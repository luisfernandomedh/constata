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
const texto = md.slice(corte + SEPARADOR.length).trim();

// Se escapa lo que rompería una plantilla de JavaScript.
const escapado = texto.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const salida = `// GENERADO — no lo edites aquí.
// La fuente es INSTRUCCIONES.md, en la raíz del repositorio, que es pública
// a propósito: lo que cualquiera puede leer es exactamente lo que corre.
// Para regenerarlo:  node scripts/instrucciones.mjs
export const INSTRUCCIONES = \`${escapado}\`;
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
  console.log(`en sincronía · ${texto.split("\n").length} líneas`);
} else {
  writeFileSync(destino, salida);
  console.log(`worker/instrucciones.js generado · ${texto.split("\n").length} líneas`);
}
