import type { Contexto } from "./types.js";

/** Quita tildes y pasa a minúsculas, para comparar sin depender de la ortografía. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const RE_URL = /\b(?:https?:\/\/|www\.)[^\s<>"'()]+/gi;
// Un dominio suelto, sin esquema: banco-ejemplo.com/algo
const RE_DOMINIO_SUELTO =
  /\b(?![\w-]+@)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(?:\/[^\s<>"'()]*)?/gi;

/** Extrae el dominio de una URL, sin el prefijo www. Devuelve null si no se puede. */
export function dominioDe(url: string): string | null {
  const conEsquema = /^https?:\/\//i.test(url) ? url : `http://${url}`;
  try {
    return new URL(conEsquema).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Precalcula todo lo que los detectores necesitan, una sola vez. */
export function construirContexto(texto: string): Contexto {
  const urls = new Set<string>();

  for (const m of texto.matchAll(RE_URL)) urls.add(m[0]);
  for (const m of texto.matchAll(RE_DOMINIO_SUELTO)) {
    const candidato = m[0];
    // No lo agregamos si ya está contenido en una URL con esquema
    if (![...urls].some((u) => u.includes(candidato))) urls.add(candidato);
  }

  const lista = [...urls];
  const dominios = lista
    .map(dominioDe)
    .filter((d): d is string => d !== null);

  return {
    texto,
    normalizado: normalizar(texto),
    urls: lista,
    dominios: [...new Set(dominios)],
  };
}
