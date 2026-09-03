/**
 * Mide el motor contra el corpus completo.
 *
 * Sin esto, "mejorar" es una sensación. Con esto son dos números:
 *
 *   COBERTURA      de las estafas del corpus, ¿cuántas detecta?
 *   FALSOS POSITIVOS  de los mensajes legítimos, ¿cuántos marca por error?
 *
 * Son el marcador del proyecto. Una regla nueva solo vale la pena si sube la
 * primera sin subir la segunda, y esa es exactamente la disciplina que hace
 * falta para decidir qué construir después.
 *
 * Uso:  node scripts/medir.mjs [ruta-al-corpus]
 *       node scripts/medir.mjs --fallos     solo lista lo que no detecta
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { analizar, reactivarEnlaces } from "../dist/index.js";

const args = process.argv.slice(2);
const soloFallos = args.includes("--fallos");
const ruta = args.find((a) => !a.startsWith("--")) ?? "../certia-corpus/entradas";

if (!existsSync(ruta)) {
  console.error(`No encuentro el corpus en ${ruta}`);
  console.error("Clónalo:  git clone https://github.com/luisfernandomedh/certia-corpus ../certia-corpus");
  process.exit(1);
}

const entradas = readdirSync(ruta)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(ruta, f), "utf8")));

if (entradas.length === 0) {
  console.error("El corpus está vacío.");
  process.exit(1);
}

const estafas = entradas.filter((e) => e.etiqueta === "estafa");
const legitimos = entradas.filter((e) => e.etiqueta === "legitimo");

// El corpus guarda los enlaces desactivados; el motor los necesita vivos.
const evaluar = (e) => analizar(reactivarEnlaces(e.texto));

const noDetectadas = estafas.filter((e) => evaluar(e).riesgo === "bajo");
const falsosPositivos = legitimos.filter((e) => evaluar(e).riesgo !== "bajo");

const pct = (n, total) => (total === 0 ? "—" : `${((n / total) * 100).toFixed(1)}%`);

const sinteticas = entradas.filter((e) => e.procedencia === "sintetico").length;
const proporcionSintetica = sinteticas / entradas.length;

if (!soloFallos) {
  console.log("\n═══ Certia contra el corpus ═══\n");
  console.log(`Entradas: ${entradas.length}  ·  ${estafas.length} estafas, ${legitimos.length} legítimos`);
  if (proporcionSintetica > 0.5) {
    console.log(`\n⚠  ${sinteticas} de ${entradas.length} entradas son SINTÉTICAS: se escribieron junto con el motor.`);
    console.log("   Estos números no miden nada todavía — el motor se está examinando con");
    console.log("   sus propias preguntas. Solo empiezan a significar algo cuando la mayoría");
    console.log("   del corpus venga de aportes reales.");
  }
  console.log();
  console.log(`COBERTURA          ${pct(estafas.length - noDetectadas.length, estafas.length)}  (${estafas.length - noDetectadas.length}/${estafas.length} estafas detectadas)`);
  console.log(`FALSOS POSITIVOS   ${pct(falsosPositivos.length, legitimos.length)}  (${falsosPositivos.length}/${legitimos.length} legítimos marcados por error)`);
}

if (noDetectadas.length) {
  console.log(`\n─── ${noDetectadas.length} estafas que NO detecta ───`);
  console.log("Cada una es una regla que falta. Agrúpalas por lo que tienen en común.\n");
  for (const e of noDetectadas) {
    console.log(`  ${e.id}${e.suplanta ? ` · suplanta a ${e.suplanta}` : ""}`);
    console.log(`    "${e.texto.slice(0, 100)}${e.texto.length > 100 ? "…" : ""}"`);
  }
}

if (falsosPositivos.length) {
  console.log(`\n─── ${falsosPositivos.length} legítimos marcados por error ───`);
  console.log("Estos cuestan confianza. Pesan más que una estafa no detectada.\n");
  for (const e of falsosPositivos) {
    const r = evaluar(e);
    console.log(`  ${e.id} · riesgo ${r.riesgo} (${r.puntaje}) por: ${r.hallazgos.map((h) => h.id).join(", ")}`);
    console.log(`    "${e.texto.slice(0, 100)}${e.texto.length > 100 ? "…" : ""}"`);
  }
}

// ── Qué señal aporta qué, para saber cuáles sobran ───────────────────
if (!soloFallos) {
  const uso = new Map();
  for (const e of estafas) {
    for (const h of evaluar(e).hallazgos) uso.set(h.id, (uso.get(h.id) ?? 0) + 1);
  }
  const ruido = new Map();
  for (const e of legitimos) {
    for (const h of evaluar(e).hallazgos) ruido.set(h.id, (ruido.get(h.id) ?? 0) + 1);
  }
  console.log("\n─── Aporte de cada señal ───");
  console.log("Una señal que aparece más en legítimos que en estafas está mal calibrada.\n");
  const ids = [...new Set([...uso.keys(), ...ruido.keys()])].sort(
    (a, b) => (uso.get(b) ?? 0) - (uso.get(a) ?? 0),
  );
  for (const id of ids) {
    const enEstafas = uso.get(id) ?? 0;
    const enLegitimos = ruido.get(id) ?? 0;
    const marca = enLegitimos > enEstafas ? "  ← revisar" : "";
    console.log(`  ${id.padEnd(36)} ${String(enEstafas).padStart(3)} estafas   ${String(enLegitimos).padStart(3)} legítimos${marca}`);
  }
  console.log();
}

// Falla si el motor se degradó: sirve como puerta en integración continua.
const umbralCobertura = Number(process.env.MIN_COBERTURA ?? 0);
const cobertura = estafas.length ? (estafas.length - noDetectadas.length) / estafas.length : 1;
if (cobertura * 100 < umbralCobertura) {
  console.error(`Cobertura ${pct(estafas.length - noDetectadas.length, estafas.length)} por debajo del mínimo exigido (${umbralCobertura}%).`);
  process.exit(1);
}
