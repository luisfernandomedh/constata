import type { Resultado } from "./types.js";
export type { Contexto, Detector, Hallazgo, Resultado, Riesgo, TipoHallazgo } from "./types.js";
export { DETECTORES } from "./signals/index.js";
export { construirContexto, dominioDe, normalizar } from "./contexto.js";
export { MARCAS, ACORTADORES, ALOJAMIENTO_GENERICO, esDominioConocido, esDominioDe } from "./marcas.js";
export type { Marca } from "./marcas.js";
export { anonimizar, desactivarEnlace, tieneEnlaces } from "./anonimizar.js";
export type { ResultadoAnonimizacion } from "./anonimizar.js";
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
export declare function analizar(texto: string): Resultado;
