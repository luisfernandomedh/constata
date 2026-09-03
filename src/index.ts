import { construirContexto } from "./contexto.js";
import { DETECTORES } from "./signals/index.js";
import type { Hallazgo, Resultado, Riesgo } from "./types.js";

export type { Contexto, Detector, Hallazgo, Resultado, Riesgo } from "./types.js";
export { DETECTORES } from "./signals/index.js";
export { construirContexto, dominioDe, normalizar } from "./contexto.js";

function nivel(puntaje: number): Riesgo {
  if (puntaje >= 60) return "alto";
  if (puntaje >= 25) return "medio";
  return "bajo";
}

/**
 * Analiza un mensaje y devuelve las señales de estafa que encuentra.
 *
 * Es una función pura: no usa la red, no guarda nada, y con el mismo
 * mensaje siempre devuelve el mismo resultado. El texto nunca sale de
 * donde se ejecuta esta función.
 *
 * No devuelve certezas: devuelve indicios y su explicación, para que
 * la persona decida. Un riesgo "bajo" no significa que el mensaje sea
 * seguro, solo que no encontramos señales conocidas.
 */
export function analizar(texto: string): Resultado {
  if (typeof texto !== "string" || texto.trim() === "") {
    return { riesgo: "bajo", puntaje: 0, hallazgos: [] };
  }

  const ctx = construirContexto(texto);
  const hallazgos: Hallazgo[] = [];

  for (const detector of DETECTORES) {
    const hallazgo = detector.detectar(ctx);
    if (hallazgo) hallazgos.push(hallazgo);
  }

  const puntaje = Math.min(100, hallazgos.reduce((a, h) => a + h.peso, 0));
  return { riesgo: nivel(puntaje), puntaje, hallazgos };
}
