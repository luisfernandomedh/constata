import type { Detector, Hallazgo } from "../types.js";
import { ACORTADORES, ALOJAMIENTO_GENERICO, MARCAS, esDominioDe } from "../marcas.js";

function riesgo(id: string, peso: number, explicacion: string, evidencia?: string): Hallazgo {
  return { id, tipo: "riesgo", peso, explicacion, evidencia };
}
function aviso(id: string, explicacion: string, evidencia?: string): Hallazgo {
  return { id, tipo: "aviso", peso: 0, explicacion, evidencia };
}

// ─────────────────────────────────────────────────────────────
// Códigos de verificación: distinguir entregarlo de pedirlo
// ─────────────────────────────────────────────────────────────

/** El mensaje TE PIDE un código, clave o dato de tarjeta. Siempre es fraude. */
const RE_PIDE_SECRETO = [
  /\benv[ií]a(nos|me)?\s+(el|tu|ese)\s+codigo\b/,
  /\bcomparte(nos|me)?\s+(el|tu)\s+codigo\b/,
  /\bdame\s+(el|tu)\s+codigo\b/,
  /\bindique?(nos)?\s+(el|su)\s+codigo\b/,
  /\breenvia(nos|me)?\s+(el|ese)\s+codigo\b/,
  /\bconfirm(a|e)\s+(tu|su)\s+(clave|contrasena|pin|password)\b/,
  /\bingres(a|e)\s+(tu|su)\s+(clave|contrasena|pin|password|clave dinamica)\b/,
  /\bdigit(a|e)\s+(tu|su)\s+(clave|contrasena|pin)\b/,
  /\bactualice?\s+(tus|sus)\s+datos\s+(bancarios|de la tarjeta)\b/,
  /\bnumero (de|de su|de tu) tarjeta\b/,
  /\b(cvv|cvc)\b/,
  /\bclave (dinamica|temporal|de un solo uso)\b/,
];

/**
 * El mensaje TE ENTREGA un código. Normal si lo pediste, alarma si no.
 *
 * En vez de enumerar frases exactas —que fallan con cualquier variante como
 * "su código de verificación DE GOOGLE es 483920"— buscamos la co-ocurrencia
 * de la palabra "código" y un número de 4 a 8 dígitos en la misma oración.
 */
const RE_ENTREGA_CODIGO = [
  /\bcodigo\b[^.!?\n]{0,60}\b\d{4,8}\b/,
  /\b\d{4,8}\b[^.!?\n]{0,60}\bcodigo\b/,
];

const pideSecreto: Detector = {
  id: "pide-credenciales",
  detectar(ctx) {
    if (!RE_PIDE_SECRETO.some((re) => re.test(ctx.normalizado))) return null;
    return riesgo(
      "pide-credenciales", 65,
      "El mensaje te pide un código, una clave o datos de tarjeta. Ningún banco ni empresa legítima pide eso por mensaje. Nunca. Esta sola señal basta para no responder.",
    );
  },
};

const entregaCodigo: Detector = {
  id: "codigo-recibido",
  detectar(ctx) {
    // Si además te lo pide, ya lo cubre el detector anterior
    if (RE_PIDE_SECRETO.some((re) => re.test(ctx.normalizado))) return null;
    if (!RE_ENTREGA_CODIGO.some((re) => re.test(ctx.normalizado))) return null;
    return aviso(
      "codigo-recibido",
      "Este mensaje te entrega un código de verificación. Eso es normal si tú acabas de pedirlo. Si NO lo pediste, alguien está intentando entrar a tu cuenta en este momento: cambia tu contraseña y no le des ese código a nadie que te lo pida después, por ningún medio.",
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Enlaces y dominios
// ─────────────────────────────────────────────────────────────

const desajusteMarca: Detector = {
  id: "desajuste-marca-enlace",
  detectar(ctx) {
    if (ctx.dominios.length === 0) return null;
    for (const marca of MARCAS) {
      if (!marca.alias.some((a) => ctx.normalizado.includes(a))) continue;
      if (ctx.dominios.some((d) => esDominioDe(d, marca))) continue;
      return riesgo(
        "desajuste-marca-enlace", 50,
        `El mensaje dice ser de ${marca.nombre}, pero el enlace no lleva a un sitio de ${marca.nombre}. Esa es la señal más clara de suplantación.`,
        ctx.dominios[0],
      );
    }
    return null;
  },
};

const dominioImitador: Detector = {
  id: "dominio-imitador",
  detectar(ctx) {
    for (const d of ctx.dominios) {
      const plano = d.replace(/[.\-_]/g, "");
      for (const marca of MARCAS) {
        if (esDominioDe(d, marca)) continue;
        for (const alias of marca.alias) {
          const aliasPlano = alias.replace(/\s/g, "");
          if (aliasPlano.length >= 4 && plano.includes(aliasPlano)) {
            return riesgo(
              "dominio-imitador", 50,
              `El dominio del enlace incluye el nombre "${marca.nombre}" pero no le pertenece. Es un dominio creado para confundirte.`,
              d,
            );
          }
        }
      }
    }
    return null;
  },
};

const caracteresEnganosos: Detector = {
  id: "caracteres-enganosos",
  detectar(ctx) {
    const punycode = ctx.dominios.find((d) => d.includes("xn--"));
    if (punycode) {
      return riesgo(
        "caracteres-enganosos", 45,
        "El dominio del enlace usa caracteres de otro alfabeto disfrazados de letras latinas. Es una técnica para imitar el nombre de un sitio real.",
        punycode,
      );
    }
    if (/[а-яА-ЯαβγδεΑΒΓ]/.test(ctx.texto)) {
      return riesgo(
        "caracteres-enganosos", 40,
        "El mensaje mezcla letras de otro alfabeto con texto en español. Se ven iguales pero son caracteres distintos, y sirven para imitar nombres de marcas.",
      );
    }
    return null;
  },
};

const acortador: Detector = {
  id: "enlace-acortado",
  detectar(ctx) {
    const hallado = ctx.dominios.find((d) => ACORTADORES.has(d));
    if (!hallado) return null;
    return riesgo(
      "enlace-acortado", 30,
      "El mensaje usa un acortador de enlaces, que oculta a dónde te lleva realmente. Las empresas serias no acortan sus propios enlaces.",
      hallado,
    );
  },
};

const RE_ACCION_SENSIBLE = [
  /\bcuenta (sera|va a ser)? ?(cerrada|bloqueada|suspendida|cancelada|eliminada)\b/,
  /\bverific(a|ar|ue|a tu|a su)\b.*\b(cuenta|identidad|datos)\b/,
  /\bactualiz(a|ar|e)\b.*\b(datos|informacion|cuenta)\b/,
  /\binici(a|ar|e) sesion\b/, /\bacced(a|e) a (tu|su) cuenta\b/,
  /\bcomplete el formulario\b/, /\bregulariz(a|ar|e)\b/,
  /\bpague? la (tasa|multa|deuda)\b/, /\bconfirm(a|ar|e) (tu|su) (identidad|cuenta)\b/,
];

const formularioGenerico: Detector = {
  id: "formulario-en-sitio-generico",
  detectar(ctx) {
    if (!RE_ACCION_SENSIBLE.some((re) => re.test(ctx.normalizado))) return null;
    const generico = ctx.dominios.find((d) =>
      ALOJAMIENTO_GENERICO.some((g) => d === g || d.endsWith(`.${g}`)),
    );
    if (!generico) return null;
    return riesgo(
      "formulario-en-sitio-generico", 50,
      "El mensaje te pide hacer algo con tu cuenta a través de una página gratuita que cualquiera puede crear en minutos. Un banco o una empresa real usa su propio sitio, nunca un formulario público.",
      generico,
    );
  },
};

const enlaceDesconocidoConAccion: Detector = {
  id: "enlace-desconocido-accion-sensible",
  detectar(ctx) {
    if (ctx.dominiosDesconocidos.length === 0) return null;
    if (!RE_ACCION_SENSIBLE.some((re) => re.test(ctx.normalizado))) return null;
    return riesgo(
      "enlace-desconocido-accion-sensible", 35,
      "El mensaje te pide entrar, verificar o actualizar algo de tu cuenta, y el enlace lleva a un sitio que no reconocemos. Entra siempre escribiendo tú la dirección oficial, nunca desde el enlace del mensaje.",
      ctx.dominiosDesconocidos[0],
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Ingeniería social, sin necesidad de enlace
// ─────────────────────────────────────────────────────────────

const RE_NUMERO_NUEVO = [
  /\b(hola )?(ma|mama|pa|papa|hijo|hija|mami|papi)\b.{0,80}\bnumero nuevo\b/s,
  /\bse me (daño|rompio|perdio) el (telefono|celular)\b/,
  /\beste es mi (nuevo )?numero\b/,
  /\bcambie de numero\b/,
];
const RE_PIDE_PLATA = [
  /\btransferencia\b/, /\btransfier(e|a)\b/, /\bme prestas\b/, /\bnecesito (que me )?(mandes|envies|hagas)\b.{0,40}\b(plata|dinero|deposito|transferencia)\b/s,
  /\bdeposit(a|ar|e)\b/, /\bpresta(me|rme)\b/,
];

const familiarSuplantado: Detector = {
  id: "familiar-numero-nuevo",
  detectar(ctx) {
    if (!RE_NUMERO_NUEVO.some((re) => re.test(ctx.normalizado))) return null;
    const pidePlata = RE_PIDE_PLATA.some((re) => re.test(ctx.normalizado));
    return riesgo(
      "familiar-numero-nuevo",
      pidePlata ? 60 : 30,
      pidePlata
        ? "Alguien dice ser un familiar con un número nuevo y te pide dinero. Es una de las estafas más comunes de la región. Llama al número viejo o a otro familiar antes de mandar nada."
        : "Alguien dice ser un familiar o conocido escribiendo desde un número nuevo. Verifica por otro medio antes de continuar, sobre todo si después te pide dinero.",
    );
  },
};

const RE_TARJETAS_REGALO = [
  /\btarjetas? de regalo\b/, /\bgift ?cards?\b/, /\brecargas? de (google play|itunes|steam)\b/,
  /\bcompr(a|ar|e)\b.{0,40}\b(tarjetas|codigos)\b.{0,40}\benvi(a|ame|arme)\b/s,
];

const fraudeJefe: Detector = {
  id: "suplantacion-de-jefe",
  detectar(ctx) {
    const seHacePasar = /\b(soy (el|la) (gerente|jefe|director|ceo|presidente)|le escribe (el|la) (gerente|jefe|director))\b/.test(ctx.normalizado);
    const noPuedeHablar = /\b(no puedo (hablar|contestar|atender)|estoy en (una )?reunion|estoy ocupad)\b/.test(ctx.normalizado);
    const pideCompra = RE_TARJETAS_REGALO.some((re) => re.test(ctx.normalizado)) ||
      RE_PIDE_PLATA.some((re) => re.test(ctx.normalizado));
    if (!pideCompra) return null;
    if (!seHacePasar && !noPuedeHablar) return null;
    return riesgo(
      "suplantacion-de-jefe",
      seHacePasar && noPuedeHablar ? 60 : 40,
      "Alguien dice ser tu jefe o un superior, evita hablar por voz, y te pide comprar algo o mover dinero. Es un fraude clásico. Confirma por teléfono o en persona antes de hacer nada.",
    );
  },
};

const RE_EMPLEO_FALSO = [
  /\btrabajo (remoto|desde casa)\b.{0,60}\$\s?\d{2,}/s,
  /\b\$\s?\d{2,}\s*(diarios|al dia|por dia)\b.{0,40}\b\d\s*horas?\b/s,
  /\bganancias? (diarias?|garantizadas?)\b/,
  /\bvacante\b.{0,60}\bresponda\b/s,
  /\bsin experiencia\b.{0,50}\b(sueldo|pago|ganas)\b/s,
];

const empleoFalso: Detector = {
  id: "oferta-laboral-irreal",
  detectar(ctx) {
    const hits = RE_EMPLEO_FALSO.filter((re) => re.test(ctx.normalizado));
    if (hits.length === 0) return null;
    return riesgo(
      "oferta-laboral-irreal",
      hits.length >= 2 ? 45 : 30,
      "El mensaje ofrece un trabajo con una paga muy alta por muy poco esfuerzo, sin proceso ni entrevista. Es el guion habitual de las estafas de empleo, que terminan pidiéndote un depósito o tus datos bancarios.",
    );
  },
};

const RE_PREMIO = [
  /\bhas (ganado|sido seleccionad)/, /\bfelicidades\b.{0,40}\bganad/s,
  /\breclama tu (premio|bono|regalo)\b/, /\bbono de \$?\d/,
  /\bsorteo\b/, /\bpremio (de )?\$?\d/,
  /\bdevolucion de impuestos\b/, /\bsaldo a favor\b/,
  /\btransferencia pendiente\b/, /\bpaquete (retenido|detenido|en aduana)\b/,
  /\bpuntos? (que )?(vencen|por vencer|acumulad)/,
];

const premioInesperado: Detector = {
  id: "premio-inesperado",
  detectar(ctx) {
    const hits = RE_PREMIO.filter((re) => re.test(ctx.normalizado));
    if (hits.length === 0) return null;
    return riesgo(
      "premio-inesperado", hits.length >= 2 ? 35 : 25,
      "El mensaje ofrece un premio, un pago, un reembolso o un paquete que no esperabas. Si no participaste en nada y no compraste nada, no hay nada que reclamar.",
    );
  },
};

const RE_URGENCIA = [
  /\burgente\b/, /\binmediat/, /\bahora mismo\b/, /\bultimo aviso\b/,
  /\bultima oportunidad\b/, /\bexpira\b/, /\bvence (hoy|manana)\b/,
  /\ben las proximas \d+ horas\b/, /\bantes del? \w+\b.{0,30}\b(cuenta|multa|bloqueo|suspension)\b/s,
  /\bcuenta (sera|va a ser)? ?(suspendida|bloqueada|cancelada|eliminada|cerrada)\b/,
  /\bcuenta (suspendida|bloqueada|restringida)\b/,
];

/**
 * La urgencia sola no acusa a nadie: un compañero de trabajo también escribe
 * "URGENTE". Por eso pesa poco por sí misma. Lo que la vuelve grave es
 * combinarse con un enlace o una petición, y de eso se encarga el motor.
 */
const urgencia: Detector = {
  id: "urgencia-artificial",
  detectar(ctx) {
    const hits = RE_URGENCIA.filter((re) => re.test(ctx.normalizado));
    if (hits.length === 0) return null;
    return riesgo(
      "urgencia-artificial", hits.length >= 2 ? 15 : 10,
      "El mensaje te apura con un plazo o una amenaza. La prisa impide pensar, y por eso es la herramienta favorita del estafador.",
    );
  },
};

/**
 * Un banco de verdad usa su propia marca en el dominio: pichincha.com,
 * bancoguayaquil.com. Nadie serio registra "banco-actualizaciones.com".
 * Las palabras genéricas del rubro financiero en un dominio desconocido
 * son sospechosas justamente por ser genéricas.
 */
const PALABRAS_GENERICAS_FINANCIERAS = [
  "banco", "bank", "pagos", "pago", "seguro", "segura", "cuenta", "cuentas",
  "verificacion", "verifica", "actualizacion", "actualizaciones", "soporte",
  "atencion", "cliente", "clientes", "acceso", "portal", "oficial", "alerta",
];

const dominioFinancieroGenerico: Detector = {
  id: "dominio-generico-financiero",
  detectar(ctx) {
    for (const d of ctx.dominiosDesconocidos) {
      const nombre = d.split(".")[0] ?? "";
      const encontradas = PALABRAS_GENERICAS_FINANCIERAS.filter((p) => nombre.includes(p));
      if (encontradas.length === 0) continue;
      return riesgo(
        "dominio-generico-financiero",
        encontradas.length >= 2 ? 40 : 30,
        "El dominio del enlace usa palabras genéricas del mundo financiero en vez del nombre real de una institución. Las entidades legítimas usan su propia marca en su dirección, no palabras sueltas como \"banco\" o \"pagos\".",
        d,
      );
    }
    return null;
  },
};

/** Todos los detectores, en el orden en que se evalúan. */
export const DETECTORES: Detector[] = [
  pideSecreto,
  entregaCodigo,
  desajusteMarca,
  dominioImitador,
  caracteresEnganosos,
  formularioGenerico,
  enlaceDesconocidoConAccion,
  dominioFinancieroGenerico,
  acortador,
  familiarSuplantado,
  fraudeJefe,
  empleoFalso,
  premioInesperado,
  urgencia,
];
