/** Nivel de riesgo resultante del análisis. */
export type Riesgo = "bajo" | "medio" | "alto";

/** Una señal encontrada en el mensaje, con su explicación en lenguaje llano. */
export interface Hallazgo {
  /** Identificador estable de la señal, para poder filtrarla o citarla. */
  id: string;
  /** Cuánto aporta al puntaje total. Entre 0 y 100. */
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
  hallazgos: Hallazgo[];
}

/** Contexto precalculado que se pasa a cada detector, para no repetir trabajo. */
export interface Contexto {
  /** El mensaje original, sin tocar. */
  texto: string;
  /** El mensaje en minúsculas y sin tildes, para comparar. */
  normalizado: string;
  /** Las URL encontradas en el mensaje. */
  urls: string[];
  /** Los dominios de esas URL, en minúsculas. */
  dominios: string[];
}

/** Un detector de señales. Función pura: mismo mensaje, mismo resultado. */
export interface Detector {
  id: string;
  detectar(ctx: Contexto): Hallazgo | null;
}
