import type { Contexto } from "./types.js";
/** Quita tildes y pasa a minúsculas, para comparar sin depender de la ortografía. */
export declare function normalizar(texto: string): string;
/** Extrae el dominio de una URL, sin el prefijo www. Devuelve null si no se puede. */
export declare function dominioDe(url: string): string | null;
/** Precalcula todo lo que los detectores necesitan, una sola vez. */
export declare function construirContexto(texto: string): Contexto;
