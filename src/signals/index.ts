import type { Detector } from "../types.js";

/** Servicios que esconden el destino real de un enlace. */
const ACORTADORES = new Set([
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly",
  "cutt.ly", "rb.gy", "shorturl.at", "rebrand.ly", "bl.ink", "acortar.link",
]);

/**
 * Marcas frecuentemente suplantadas y sus dominios legítimos.
 * Esta lista es el punto de crecimiento del proyecto: cada marca añadida
 * mejora la detección sin tocar el motor.
 */
const MARCAS: Array<{ nombre: string; alias: string[]; dominios: string[] }> = [
  { nombre: "WhatsApp", alias: ["whatsapp"], dominios: ["whatsapp.com", "wa.me"] },
  { nombre: "Netflix", alias: ["netflix"], dominios: ["netflix.com"] },
  { nombre: "PayPal", alias: ["paypal"], dominios: ["paypal.com"] },
  { nombre: "Correos", alias: ["correos"], dominios: ["correos.es"] },
  { nombre: "DHL", alias: ["dhl"], dominios: ["dhl.com"] },
  { nombre: "Apple", alias: ["apple", "icloud"], dominios: ["apple.com", "icloud.com"] },
  { nombre: "Microsoft", alias: ["microsoft", "outlook"], dominios: ["microsoft.com", "live.com", "outlook.com"] },
  { nombre: "Amazon", alias: ["amazon"], dominios: ["amazon.com"] },
];

const acortador: Detector = {
  id: "enlace-acortado",
  detectar(ctx) {
    const hallado = ctx.dominios.find((d) => ACORTADORES.has(d));
    if (!hallado) return null;
    return {
      id: "enlace-acortado",
      peso: 25,
      explicacion:
        "El mensaje usa un acortador de enlaces, que oculta a dónde te lleva realmente. Las empresas serias no acortan sus propios enlaces.",
      evidencia: hallado,
    };
  },
};

const desajusteMarca: Detector = {
  id: "desajuste-marca-enlace",
  detectar(ctx) {
    if (ctx.dominios.length === 0) return null;
    for (const marca of MARCAS) {
      const mencionada = marca.alias.some((a) => ctx.normalizado.includes(a));
      if (!mencionada) continue;
      const coincide = ctx.dominios.some((d) =>
        marca.dominios.some((leg) => d === leg || d.endsWith(`.${leg}`)),
      );
      if (coincide) continue;
      return {
        id: "desajuste-marca-enlace",
        peso: 45,
        explicacion: `El mensaje dice ser de ${marca.nombre}, pero el enlace no lleva a un sitio de ${marca.nombre}. Esa es la señal más clara de suplantación.`,
        evidencia: ctx.dominios[0],
      };
    }
    return null;
  },
};

const caracteresEnganosos: Detector = {
  id: "caracteres-enganosos",
  detectar(ctx) {
    for (const d of ctx.dominios) {
      if (d.startsWith("xn--")) {
        return {
          id: "caracteres-enganosos",
          peso: 40,
          explicacion:
            "El dominio del enlace usa caracteres de otro alfabeto disfrazados de letras latinas. Es una técnica para imitar el nombre de un sitio real.",
          evidencia: d,
        };
      }
    }
    if (/[а-яА-ЯαβγδεΑΒΓ]/.test(ctx.texto) && ctx.dominios.length > 0) {
      return {
        id: "caracteres-enganosos",
        peso: 30,
        explicacion:
          "El mensaje mezcla letras de otro alfabeto con texto en español, algo típico de imitaciones de marcas.",
      };
    }
    return null;
  },
};

const RE_URGENCIA = [
  /\burgente\b/, /\binmediat/, /\bahora mismo\b/, /\bultimo aviso\b/,
  /\bultima oportunidad\b/, /\bexpira\b/, /\bvence hoy\b/,
  /\ben las proximas \d+ horas\b/, /\bantes de que\b.*\bcuenta\b/,
  /\bsu cuenta sera (suspendida|bloqueada|cancelada|eliminada)\b/,
  /\bcuenta (suspendida|bloqueada|restringida)\b/,
];

const urgencia: Detector = {
  id: "urgencia-artificial",
  detectar(ctx) {
    const hits = RE_URGENCIA.filter((re) => re.test(ctx.normalizado));
    if (hits.length === 0) return null;
    return {
      id: "urgencia-artificial",
      peso: hits.length >= 2 ? 25 : 15,
      explicacion:
        "El mensaje te apura con un plazo o una amenaza de perder la cuenta. La prisa impide pensar, y por eso es la herramienta favorita del estafador.",
    };
  },
};

const RE_CREDENCIALES = [
  /\bcodigo de (verificacion|seguridad|confirmacion)\b/,
  /\benv[ií]a(nos)? el codigo\b/, /\bcomparte el codigo\b/,
  /\bconfirma tu (clave|contrasena|pin)\b/,
  /\b(clave|contrasena|pin) (dinamica|temporal|de acceso)\b/,
  /\bactualiza tus datos (bancarios|de la tarjeta)\b/,
  /\bnumero de tarjeta\b/, /\bcvv\b/, /\bcvc\b/,
];

const pideCredenciales: Detector = {
  id: "pide-credenciales",
  detectar(ctx) {
    if (!RE_CREDENCIALES.some((re) => re.test(ctx.normalizado))) return null;
    return {
      id: "pide-credenciales",
      peso: 50,
      explicacion:
        "El mensaje pide un código, una clave o datos de tarjeta. Ningún banco ni empresa legítima pide eso por mensaje. Nunca. Esta sola señal basta para no responder.",
    };
  },
};

const RE_PREMIO = [
  /\bhas (ganado|sido seleccionad)/, /\bfelicidades\b.*\bganad/,
  /\bpremio\b/, /\bsorteo\b/, /\breclama tu\b/,
  /\bbono de \$?\d/, /\btransferencia pendiente\b/,
  /\bdevolucion de impuestos\b/, /\bpaquete retenido\b/,
];

const premioInesperado: Detector = {
  id: "premio-inesperado",
  detectar(ctx) {
    const hits = RE_PREMIO.filter((re) => re.test(ctx.normalizado));
    if (hits.length === 0) return null;
    return {
      id: "premio-inesperado",
      peso: hits.length >= 2 ? 30 : 20,
      explicacion:
        "El mensaje ofrece un premio, un pago o un paquete que no esperabas. Si no participaste en nada, no hay nada que reclamar.",
    };
  },
};

const dominioReciente: Detector = {
  id: "dominio-imitador",
  detectar(ctx) {
    for (const d of ctx.dominios) {
      const sinPunto = d.replace(/\./g, "");
      for (const marca of MARCAS) {
        for (const alias of marca.alias) {
          // El dominio contiene el nombre de la marca pero no es el dominio real
          const esLegitimo = marca.dominios.some(
            (leg) => d === leg || d.endsWith(`.${leg}`),
          );
          if (!esLegitimo && sinPunto.includes(alias)) {
            return {
              id: "dominio-imitador",
              peso: 45,
              explicacion: `El dominio del enlace incluye el nombre "${marca.nombre}" pero no pertenece a ${marca.nombre}. Es un dominio hecho para confundirte.`,
              evidencia: d,
            };
          }
        }
      }
    }
    return null;
  },
};

/** Todos los detectores de la versión 1, en orden de evaluación. */
export const DETECTORES: Detector[] = [
  pideCredenciales,
  desajusteMarca,
  dominioReciente,
  caracteresEnganosos,
  acortador,
  premioInesperado,
  urgencia,
];
