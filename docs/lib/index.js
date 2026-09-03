import { construirContexto } from "./contexto.js";
import { DETECTORES } from "./signals/index.js";
export { DETECTORES } from "./signals/index.js";
export { construirContexto, dominioDe, normalizar } from "./contexto.js";
export { MARCAS, ACORTADORES, ALOJAMIENTO_GENERICO, esDominioConocido, esDominioDe } from "./marcas.js";
export { anonimizar, desactivarEnlace, reactivarEnlaces, tieneEnlaces } from "./anonimizar.js";
function nivel(puntaje) {
    if (puntaje >= 60)
        return "alto";
    if (puntaje >= 25)
        return "medio";
    return "bajo";
}
/**
 * Combinaciones que valen más que la suma de sus partes.
 *
 * La urgencia sola es ruido: un compañero de trabajo también escribe
 * "URGENTE". La urgencia junto a un enlace desconocido ya es un patrón.
 */
function bonificacionPorCombinacion(ids, hayEnlaceDesconocido) {
    let extra = 0;
    if (ids.has("urgencia-artificial") && hayEnlaceDesconocido)
        extra += 20;
    if (ids.has("premio-inesperado") && hayEnlaceDesconocido)
        extra += 20;
    if (ids.has("urgencia-artificial") && ids.has("premio-inesperado"))
        extra += 10;
    return extra;
}
/**
 * Analiza un mensaje y devuelve las señales de estafa que encuentra.
 *
 * Es una función pura: no usa la red, no guarda nada, y con el mismo
 * mensaje siempre devuelve el mismo resultado. El texto nunca sale de
 * donde se ejecuta esta función.
 *
 * No devuelve certezas: devuelve indicios y su explicación, para que la
 * persona decida. Un riesgo "bajo" no significa que el mensaje sea seguro,
 * solo que no encontramos señales conocidas.
 */
export function analizar(texto) {
    if (typeof texto !== "string" || texto.trim() === "") {
        return { riesgo: "bajo", puntaje: 0, hallazgos: [], avisos: [] };
    }
    const ctx = construirContexto(texto);
    const hallazgos = [];
    const avisos = [];
    for (const detector of DETECTORES) {
        const h = detector.detectar(ctx);
        if (!h)
            continue;
        (h.tipo === "aviso" ? avisos : hallazgos).push(h);
    }
    const ids = new Set(hallazgos.map((h) => h.id));
    const base = hallazgos.reduce((a, h) => a + h.peso, 0);
    const puntaje = Math.min(100, base + bonificacionPorCombinacion(ids, ctx.dominiosDesconocidos.length > 0));
    return { riesgo: nivel(puntaje), puntaje, hallazgos, avisos };
}
