/**
 * Genera worker/marcas.js desde src/marcas.ts (vía dist/).
 *
 * El registro de dominios verificados es lo que distingue a Constata de
 * cualquier detector extranjero, y hasta ahora el modelo no lo veía: decía
 * que el dominio del mensaje y el del banco eran el mismo. Ahora se le pasa
 * como dato comprobado.
 *
 * Con --verificar solo comprueba que no se haya quedado atrás.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const { MARCAS } = await import(join(raiz, "dist", "marcas.js"));

const compacto = MARCAS.map((m) => ({
  n: m.nombre,
  a: m.alias,
  d: m.dominios,
  ...(m.verificacion === "certificado" ? { c: 1 } : {}),
}));

const salida = `// GENERADO — no lo edites aquí. La fuente es src/marcas.ts.
// Para regenerarlo:  npm run build && node scripts/marcas-worker.mjs
// n = nombre · a = alias · d = dominios legítimos · c = confirmado por certificado
export const MARCAS = ${JSON.stringify(compacto)};

/** Marcas que el mensaje nombra. Vacío si no reconoce ninguna. */
export function marcasEn(texto) {
  const t = (texto || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  return MARCAS.filter((m) => m.a.some((alias) => t.includes(alias)));
}

/**
 * La lista para el modelo, lo más corta posible.
 *
 * Va en cada consulta con imagen y cada token cuenta: el tope de Groq es de
 * 8000 por minuto, y una imagen ya se lleva la mitad. Se quita el guion, se
 * quita la coma y se quita la coletilla del certificado — al modelo no le
 * cambia nada saber cómo lo comprobamos, solo cuáles son.
 */
export function comoTexto(marcas) {
  return marcas.map((m) => \`\${m.n}=\${m.d.join(" ")}\`).join("\\n");
}
`;

const destino = join(raiz, "worker", "marcas.js");
if (process.argv.includes("--verificar")) {
  let actual = "";
  try { actual = readFileSync(destino, "utf8"); } catch { /* no existe */ }
  if (actual !== salida) {
    console.error("DESINCRONIZADO: src/marcas.ts y worker/marcas.js no coinciden.");
    console.error("Corrígelo con:  npm run build && node scripts/marcas-worker.mjs");
    process.exit(1);
  }
  console.log(`marcas en sincronía · ${MARCAS.length} instituciones`);
} else {
  writeFileSync(destino, salida);
  console.log(`worker/marcas.js generado · ${MARCAS.length} instituciones, ${MARCAS.reduce((a, m) => a + m.dominios.length, 0)} dominios`);
}
