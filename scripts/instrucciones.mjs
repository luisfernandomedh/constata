/**
 * Genera worker/instrucciones.js desde INSTRUCCIONES.md.
 *
 * El documento público es la fuente de verdad, no una copia. Así no puede
 * pasar lo peor: que publiquemos unas instrucciones y el servidor corra
 * otras. Con --verificar solo comprueba y falla si difieren.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEPARADOR = "\n---\n\n";

const md = readFileSync(join(raiz, "INSTRUCCIONES.md"), "utf8");
const corte = md.indexOf(SEPARADOR);
if (corte === -1) {
  console.error("INSTRUCCIONES.md no tiene el separador '---' que abre las instrucciones.");
  process.exit(1);
}
/*
  Son dos prompts, separados por otra línea de guiones. El primero es el
  análisis completo; el segundo, mucho más corto, es el que se manda cuando la
  persona contesta a una pregunta. Mandar el largo en cada vuelta gastaba el
  cupo por minuto de Groq y dejaba la conversación colgada.
*/
const partes = md.slice(corte + SEPARADOR.length).split(SEPARADOR).map((p) => p.trim());
if (partes.length !== 2) {
  console.error(`INSTRUCCIONES.md debe tener DOS bloques separados por '---': encontré ${partes.length}.`);
  process.exit(1);
}
const [principal, repregunta] = partes;
const texto = partes.join("\n");

// Se escapa lo que rompería una plantilla de JavaScript.
const plantilla = (t) => t.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const salida = `// GENERADO — no lo edites aquí.
// La fuente es INSTRUCCIONES.md, en la raíz del repositorio, que es pública
// a propósito: lo que cualquiera puede leer es exactamente lo que corre.
// Para regenerarlo:  node scripts/instrucciones.mjs
export const INSTRUCCIONES = \`${plantilla(principal)}\`;

// El prompt corto de las repreguntas. Ver INSTRUCCIONES.md.
export const INSTRUCCIONES_REPREGUNTA = \`${plantilla(repregunta)}\`;
`;

const destino = join(raiz, "worker", "instrucciones.js");

if (process.argv.includes("--verificar")) {
  let actual = "";
  try { actual = readFileSync(destino, "utf8"); } catch { /* no existe */ }
  if (actual !== salida) {
    console.error("DESINCRONIZADO: INSTRUCCIONES.md y worker/instrucciones.js no coinciden.");
    console.error("Corrígelo con:  node scripts/instrucciones.mjs");
    process.exit(1);
  }
  console.log(`en sincronía · ${principal.split("\n").length} + ${repregunta.split("\n").length} líneas`);
} else {
  writeFileSync(destino, salida);
  console.log(`worker/instrucciones.js generado · ${principal.split("\n").length} + ${repregunta.split("\n").length} líneas`);
}
