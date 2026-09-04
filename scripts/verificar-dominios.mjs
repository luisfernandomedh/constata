/**
 * Verifica que cada dominio del registro pertenezca de verdad a su institución.
 *
 * Existe por una razón incómoda: los dominios de `src/marcas.ts` los escribió
 * un modelo de lenguaje de memoria. Eso es precisamente la "respuesta probable"
 * que este proyecto dice no querer. Una lista verificada que nadie verificó no
 * vale más que una alucinación bien formateada.
 *
 * La prueba que se usa es el **certificado TLS**. No se puede falsificar sin
 * comprometer una autoridad certificadora: para emitir un certificado a nombre
 * de `pichincha.com` hay que demostrarle a la CA que controlas ese dominio, y
 * los certificados de validación de organización llevan además el nombre legal
 * de la empresa, comprobado con documentos.
 *
 * Esto NO decide nada solo. Marca cada dominio y deja el juicio a una persona.
 *
 *   node scripts/verificar-dominios.mjs            todos
 *   node scripts/verificar-dominios.mjs --pais EC  solo Ecuador
 *   node scripts/verificar-dominios.mjs --dudosos  solo lo que no cuadra
 */

import tls from "node:tls";
import { MARCAS } from "../dist/index.js";

const args = process.argv.slice(2);
const soloDudosos = args.includes("--dudosos");
const pais = args.includes("--pais") ? args[args.indexOf("--pais") + 1] : null;

/** Abre una conexión TLS y devuelve lo que dice el certificado del servidor. */
function certificadoDe(dominio, tiempoLimite = 8000) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: dominio, port: 443, servername: dominio, timeout: tiempoLimite },
      () => {
        const c = socket.getPeerCertificate();
        socket.destroy();
        resolve({
          ok: socket.authorized || socket.authorizationError === undefined,
          organizacion: c?.subject?.O ?? null,
          comun: c?.subject?.CN ?? null,
          alternativos: c?.subjectaltname ?? "",
          emisor: c?.issuer?.O ?? null,
          desde: c?.valid_from ?? null,
          hasta: c?.valid_to ?? null,
        });
      },
    );
    socket.on("timeout", () => { socket.destroy(); resolve({ error: "sin respuesta" }); });
    socket.on("error", (e) => resolve({ error: e.code || e.message }));
  });
}

/** Palabras del nombre de la marca que deberían aparecer en el certificado. */
function palabrasClave(nombre) {
  const ignorar = new Set(["banco", "de", "del", "la", "el", "club", "cooperativa"]);
  return nombre
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .split(/[\s+]/).filter((p) => p.length > 2 && !ignorar.has(p));
}

const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Compara lo que dice el certificado contra lo que dice el registro. */
function juzgar(marca, dominio, cert) {
  if (cert.error) return { nivel: "ERROR", nota: cert.error };
  if (!cert.ok) return { nivel: "DUDOSO", nota: "certificado no confiable" };

  const enCert = norm(`${cert.organizacion} ${cert.comun} ${cert.alternativos}`);
  const claves = palabrasClave(marca.nombre);
  const coincideNombre = claves.length === 0 || claves.some((k) => enCert.includes(k));
  const cubreDominio =
    norm(cert.comun) === dominio ||
    cert.alternativos.split(/,\s*/).some((s) => {
      const d = s.replace(/^DNS:/, "").toLowerCase();
      return d === dominio || (d.startsWith("*.") && dominio.endsWith(d.slice(1)));
    });

  if (!cubreDominio) return { nivel: "DUDOSO", nota: "el certificado no cubre este dominio" };
  if (cert.organizacion && coincideNombre) return { nivel: "CONFIRMADO", nota: cert.organizacion };
  if (cert.organizacion) return { nivel: "REVISAR", nota: `el certificado dice "${cert.organizacion}"` };
  return { nivel: "REVISAR", nota: "certificado sin nombre de organización (validación simple)" };
}

const objetivo = MARCAS.filter((m) => !pais || m.pais === pais);
const tareas = objetivo.flatMap((m) => m.dominios.map((d) => ({ marca: m, dominio: d })));

console.log(`\nVerificando ${tareas.length} dominios de ${objetivo.length} instituciones…`);
console.log("Prueba: el certificado TLS del servidor. Ver el encabezado del script.\n");

const resultados = [];
// De a poco, para no parecer un escaneo agresivo.
for (let i = 0; i < tareas.length; i += 6) {
  const lote = tareas.slice(i, i + 6);
  const hechos = await Promise.all(
    lote.map(async ({ marca, dominio }) => {
      const cert = await certificadoDe(dominio);
      return { marca, dominio, cert, ...juzgar(marca, dominio, cert) };
    }),
  );
  resultados.push(...hechos);
  process.stdout.write(`\r  ${resultados.length}/${tareas.length}`);
}
process.stdout.write("\r".padEnd(40) + "\r");

const ICONO = { CONFIRMADO: "✔", REVISAR: "?", DUDOSO: "✖", ERROR: "…" };
const orden = ["DUDOSO", "REVISAR", "ERROR", "CONFIRMADO"];

for (const nivel of orden) {
  const grupo = resultados.filter((r) => r.nivel === nivel);
  if (!grupo.length) continue;
  if (soloDudosos && nivel === "CONFIRMADO") continue;
  console.log(`\n─── ${nivel} (${grupo.length}) ───`);
  for (const r of grupo) {
    console.log(`  ${ICONO[nivel]} ${r.dominio.padEnd(30)} ${r.marca.nombre}`);
    console.log(`    ${r.nota}`);
  }
}

const c = resultados.filter((r) => r.nivel === "CONFIRMADO").length;
const revisar = resultados.filter((r) => r.nivel !== "CONFIRMADO").length;
console.log(`\n${c} confirmados por certificado · ${revisar} necesitan tu ojo\n`);
console.log("Qué significa cada uno:");
console.log("  CONFIRMADO  el certificado lleva el nombre de la organización y coincide.");
console.log("  REVISAR     el certificado es válido para el dominio, pero no confirma el nombre.");
console.log("              Muy común: muchos sitios usan certificados de validación simple.");
console.log("  DUDOSO      el certificado no cubre este dominio. Investigar antes de confiar.");
console.log("  ERROR       no respondió. Puede ser red, no necesariamente un problema del dominio.\n");
console.log("Contraste independiente para bancos de Ecuador: la lista oficial de entidades");
console.log("autorizadas está en superbancos.gob.ec — no dependas solo de esto ni de mí.\n");
