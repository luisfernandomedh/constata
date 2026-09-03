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
/**
 * Rompe una URL para que deje de ser clicable, conservando el dato.
 * Es la convención de la industria de inteligencia de amenazas:
 * `http://malo.com/x` se escribe `hxxp://malo[.]com/[ruta]`.
 */
export declare function desactivarEnlace(url: string): string;
/** ¿Este texto contiene alguna URL? */
export declare function tieneEnlaces(texto: string): boolean;
/**
 * Devuelve el mensaje sin datos personales y con los enlaces desactivados,
 * junto con la lista de qué se reemplazó.
 */
export declare function anonimizar(texto: string): ResultadoAnonimizacion;
/**
 * Revierte la desactivación de enlaces. **Solo en memoria y solo para analizar.**
 *
 * El corpus guarda siempre la forma desactivada, y así debe quedarse. Pero el
 * motor necesita ver una URL de verdad para que sus señales de enlace —las más
 * fuertes que tiene— funcionen. Sin esto, una entrada del corpus se analiza
 * como si no tuviera enlaces y saca un puntaje mucho más bajo del real.
 *
 * El resultado de esta función NUNCA debe escribirse a ningún lado.
 */
export declare function reactivarEnlaces(texto: string): string;
