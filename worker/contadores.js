/**
 * Dos números por día, y nada más.
 *
 * Sin esto no se puede responder la pregunta que decide el futuro del
 * proyecto: de cada cien personas que reciben una respuesta, cuántas donan
 * su ejemplo. Se contaban peticiones al servidor, pero ahí iban mezcladas
 * las pruebas del desarrollo con la gente real.
 *
 * Lo que se guarda es un contador por día. No hay identificadores, ni IPs,
 * ni nada que permita saber quién hizo qué: solo cuántas veces pasó algo.
 * Se borra solo a los 90 días.
 *
 * Aviso honesto sobre la exactitud: KV no tiene sumas atómicas, así que dos
 * consultas en el mismo instante pueden contarse como una. Con nuestro
 * volumen la diferencia es despreciable, y prefiero un número aproximado y
 * anónimo antes que uno exacto que obligue a guardar más de lo necesario.
 */
const NOVENTA_DIAS = 90 * 86400;

function hoy() {
  return new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10); // UTC-5
}

/** Las pruebas del desarrollo no cuentan: se marcan con una cabecera. */
export function esPrueba(peticion) {
  return peticion.headers.get("X-Constata-Prueba") === "1";
}

export async function contar(env, que, peticion) {
  if (!env.LIMITES || (peticion && esPrueba(peticion))) return;
  try {
    const clave = `m:${que}:${hoy()}`;
    const previo = Number(await env.LIMITES.get(clave)) || 0;
    await env.LIMITES.put(clave, String(previo + 1), { expirationTtl: NOVENTA_DIAS });

    // Un total acumulado aparte, sin caducidad: es el que se enseña en la
    // página, y leerlo debe costar una sola lectura, no recorrer 90 claves.
    if (que !== "donacion") {
      const t = Number(await env.LIMITES.get("m:total")) || 0;
      await env.LIMITES.put("m:total", String(t + 1));
    }
  } catch { /* una cuenta perdida no vale romper una respuesta */ }
}

/** El total que se enseña en la página. Público a propósito. */
export async function total(env) {
  if (!env.LIMITES) return 0;
  try { return Number(await env.LIMITES.get("m:total")) || 0; }
  catch { return 0; }
}
