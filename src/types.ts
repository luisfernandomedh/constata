/** Nivel de riesgo resultante del análisis. */
export type Riesgo = "bajo" | "medio" | "alto";

/**
 * Qué clase de hallazgo es.
 *
 * - `riesgo`: una señal de fraude. Suma al puntaje.
 * - `aviso`: algo que la persona necesita saber para decidir, pero que por
 *   sí solo no acusa al mensaje. No suma al puntaje y siempre se muestra.
 *   El caso típico: un mensaje que te entrega un código de verificación.
 *   Es normal si tú lo pediste, y es una alarma si no lo pediste.
 */
export type TipoHallazgo = "riesgo" | "aviso";

/** Una señal encontrada en el mensaje, con su explicación en lenguaje llano. */
export interface Hallazgo {
  /** Identificador estable de la señal, para poder filtrarla o citarla. */
  id: string;
  tipo: TipoHallazgo;
  /** Cuánto aporta al puntaje total, de 0 a 100. Los avisos aportan 0. */
  peso: number;
  /** Qué se encontró, dicho para una persona sin conocimientos técnicos. */
  explicacion: string;
  /** El fragmento del mensaje que disparó la señal, si aplica. */
  evidencia?: string;
}

/** Resultado completo del análisis de un mensaje. */
export interface Resultado {
  riesgo: Riesgo;
  /** Suma acotada de los pesos, entre 0 y 100. */
  puntaje: number;
  /** Señales de fraude encontradas. */
  hallazgos: Hallazgo[];
  /** Cosas que la persona debe saber para decidir, aunque no acusen al mensaje. */
  avisos: Hallazgo[];
}

/** Contexto precalculado que se pasa a cada detector, para no repetir trabajo. */
export interface Contexto {
  /** El mensaje original, sin tocar. */
  texto: string;
  /** El mensaje en minúsculas y sin tildes, para comparar. */
  normalizado: string;
  /** Las URL encontradas en el mensaje. */
  urls: string[];
  /** Los dominios de esas URL, en minúsculas y sin www. */
  dominios: string[];
  /** Dominios que no pertenecen a ninguna marca conocida. */
  dominiosDesconocidos: string[];
}

/** Un detector de señales. Función pura: mismo mensaje, mismo resultado. */
export interface Detector {
  id: string;
  detectar(ctx: Contexto): Hallazgo | null;
}
