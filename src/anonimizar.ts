/**
 * Prepara un mensaje para poder compartirse sin hacer daño.
 *
 * Hace dos cosas distintas que conviene no confundir:
 *
 * 1. **Anonimizar** — quitar datos personales de quien recibió el mensaje.
 *    Protege a la persona que contribuye.
 * 2. **Desactivar los enlaces** — romper las URL para que no sean clicables
 *    ni indexables. Protege a quien después lea el corpus, y evita que un
 *    repositorio público se convierta en un catálogo de sitios de phishing.
 *
 * Ambas corren en el mismo lugar que el análisis: en el dispositivo de la
 * persona. Nada sale de ahí sin haber pasado por aquí primero.
 *
 * IMPORTANTE — esto no es infalible. Detecta correos, teléfonos, montos,
 * números largos y datos dentro de las URL, pero **no puede detectar nombres
 * propios de forma confiable**. Por eso el resultado siempre se le muestra a
 * la persona para que lo revise y lo edite. La revisión humana no es un extra:
 * es parte del diseño.
 */

export interface ResultadoAnonimizacion {
  /** El texto limpio y con los enlaces desactivados, listo para revisarse. */
  texto: string;
  /** Qué clases de dato se reemplazaron, para poder decírselo a la persona. */
  reemplazos: string[];
}

const RE_URL_GLOBAL = /\b(?:https?:\/\/|www\.)[^\s<>"'()]+/gi;
const RE_DIVIDIR_URL = /(\b(?:https?:\/\/|www\.)[^\s<>"'()]+)/gi;

interface Regla {
  nombre: string;
  patron: RegExp;
  reemplazo: string;
}

const REGLAS: Regla[] = [
  { nombre: "correos electrónicos", patron: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, reemplazo: "[correo]" },
  {
    // Formatos de Ecuador y genéricos: +593 9 8765 4321, 0987654321, (02) 234-5678
    nombre: "números de teléfono",
    patron: /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g,
    reemplazo: "[telefono]",
  },
  { nombre: "montos de dinero", patron: /\$\s?\d(?:[\d.,]*\d)?/g, reemplazo: "[monto]" },
  {
    // Cédulas, cuentas, referencias. Los códigos de 4 a 5 dígitos se conservan
    // porque son parte del guion de la estafa, no un dato de la víctima.
    nombre: "números largos",
    patron: /\b\d{6,}\b/g,
    reemplazo: "[numero]",
  },
  { nombre: "identificadores de usuario", patron: /(^|\s)@[\w.]{3,}/g, reemplazo: "$1[usuario]" },
];

/**
 * Rompe una URL para que deje de ser clicable, conservando el dato.
 * Es la convención de la industria de inteligencia de amenazas:
 * `http://malo.com/x` se escribe `hxxp://malo[.]com/[ruta]`.
 */
export function desactivarEnlace(url: string): string {
  const conEsquema = /^https?:\/\//i.test(url) ? url : `http://${url}`;
  let host: string;
  let esquemaOriginal = "";
  try {
    const u = new URL(conEsquema);
    host = u.host;
    if (/^https?:\/\//i.test(url)) {
      esquemaOriginal = u.protocol === "https:" ? "hxxps://" : "hxxp://";
    }
  } catch {
    return url.replace(/\./g, "[.]").replace(/^http/i, "hxxp");
  }
  const teniaRuta = conEsquema.replace(/^https?:\/\/[^/]+/i, "").replace(/\/+$/, "") !== "";
  const hostRoto = host.replace(/\./g, "[.]");
  return `${esquemaOriginal}${hostRoto}${teniaRuta ? "/[ruta]" : ""}`;
}

/** ¿Este texto contiene alguna URL? */
export function tieneEnlaces(texto: string): boolean {
  return new RegExp(RE_URL_GLOBAL.source, "i").test(texto);
}

/**
 * Devuelve el mensaje sin datos personales y con los enlaces desactivados,
 * junto con la lista de qué se reemplazó.
 */
export function anonimizar(texto: string): ResultadoAnonimizacion {
  if (typeof texto !== "string" || texto.trim() === "") {
    return { texto: "", reemplazos: [] };
  }

  const reemplazos: string[] = [];

  // Las URL van primero. Si no, las reglas numéricas destrozarían sus rutas
  // y perderíamos el dominio, que es la señal más valiosa del corpus.
  let huboEnlaces = false;
  let resultado = texto.replace(RE_URL_GLOBAL, (url) => {
    huboEnlaces = true;
    return desactivarEnlace(url);
  });
  if (huboEnlaces) reemplazos.push("enlaces desactivados y sin su ruta");

  // El resto se aplica solo fuera de los enlaces ya procesados.
  for (const regla of REGLAS) {
    const partes = resultado.split(RE_DIVIDIR_URL);
    let cambio = false;
    const nuevas = partes.map((parte, i) => {
      if (i % 2 === 1) return parte; // los impares son URL intactas
      const sustituida = parte.replace(regla.patron, regla.reemplazo);
      if (sustituida !== parte) cambio = true;
      return sustituida;
    });
    if (cambio) {
      reemplazos.push(regla.nombre);
      resultado = nuevas.join("");
    }
  }

  return { texto: resultado.trim(), reemplazos };
}
