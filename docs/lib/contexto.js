import { esDominioConocido } from "./marcas.js";
/** Quita tildes y pasa a minúsculas, para comparar sin depender de la ortografía. */
export function normalizar(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
const RE_URL = /\b(?:https?:\/\/|www\.)[^\s<>"'()]+/gi;
const RE_DOMINIO_SUELTO = /\b(?![\w-]+@)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(?:\/[^\s<>"'()]*)?/gi;
/** Extrae el dominio de una URL, sin el prefijo www. Devuelve null si no se puede. */
export function dominioDe(url) {
    const conEsquema = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    try {
        return new URL(conEsquema).hostname.toLowerCase().replace(/^www\./, "");
    }
    catch {
        return null;
    }
}
/** Precalcula todo lo que los detectores necesitan, una sola vez. */
export function construirContexto(texto) {
    const urls = new Set();
    for (const m of texto.matchAll(RE_URL))
        urls.add(m[0]);
    for (const m of texto.matchAll(RE_DOMINIO_SUELTO)) {
        const candidato = m[0];
        if (![...urls].some((u) => u.includes(candidato)))
            urls.add(candidato);
    }
    const lista = [...urls];
    const dominios = [...new Set(lista.map(dominioDe).filter((d) => d !== null))];
    return {
        texto,
        normalizado: normalizar(texto),
        urls: lista,
        dominios,
        dominiosDesconocidos: dominios.filter((d) => !esDominioConocido(d)),
    };
}
