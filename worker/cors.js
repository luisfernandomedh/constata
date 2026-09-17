/**
 * Quién puede llamar a este Worker desde un navegador.
 *
 * Antes respondía «cualquiera» (Access-Control-Allow-Origin: *). El límite por
 * IP seguía funcionando, pero se podía rodear: una web cualquiera mete un
 * script que llama a /analizar, y cada visitante suyo gasta cuota con SU
 * propia IP. Mil visitantes son mil IP distintas, ninguna llega al tope, y la
 * cuota diaria del modelo se agota para la gente que de verdad la necesita.
 *
 * Esto no detiene a quien use curl —CORS lo aplica el navegador, no el
 * servidor—, pero corta el abuso barato, que es el que ocurre.
 */
const PERMITIDOS = new Set([
  "https://constata.dev",
  "https://www.constata.dev",
]);

export function cors(peticion) {
  const origen = peticion?.headers?.get("Origin") || "";
  const base = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    // Sin esto, una caché intermedia podría servirle a un origen la respuesta
    // que se le dio a otro.
    "Vary": "Origin",
  };
  // Petición del mismo sitio: el navegador no manda Origin y no hace falta
  // permiso ninguno. Solo se responde cuando el origen está en la lista.
  if (!PERMITIDOS.has(origen)) return base;
  return { ...base, "Access-Control-Allow-Origin": origen };
}
