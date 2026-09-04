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
const comoJson = args.includes("--json");
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
/**
 * Historial de certificados emitidos para el dominio.
 *
 * Funciona aunque el sitio esté caído, porque los registros de transparencia
 * guardan cada certificado que se ha emitido. Es la salida para las entidades
 * públicas de Ecuador, que se caen a menudo y cuya indisponibilidad no dice
 * nada sobre si el dominio es legítimo.
 *
 * Ojo con lo que prueba y lo que no: confirma que el dominio existe y que
 * alguien lo controla desde hace tiempo. NO confirma quién.
 */
async function historial(dominio) {
  try {
    const r = await fetch(`https://crt.sh/?q=${encodeURIComponent(dominio)}&output=json`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    const cs = await r.json();
    if (!Array.isArray(cs) || cs.length === 0) return { n: 0 };
    const fechas = cs.map((c) => c.not_before).filter(Boolean).sort();
    return { n: cs.length, desde: (fechas[0] ?? "").slice(0, 10) };
  } catch { return null; }
}

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

/**
 * Antes de nada, comprobar que la red de QUIEN CORRE ESTO funciona.
 *
 * Sin esto el script miente de la peor manera: si tu conexión falla, todos
 * los dominios salen "no responde" y parece que medio Ecuador está caído.
 * Pasó de verdad. Un diagnóstico que no distingue "el sitio está mal" de
 * "yo estoy mal" no sirve para decidir nada.
 */
const CONTROL = ["google.com", "cloudflare.com"];
const controles = await Promise.all(CONTROL.map((d) => certificadoDe(d, 6000)));
if (controles.every((c) => c.error)) {
  console.error("\nTu conexión no está respondiendo — ni siquiera google.com.");
  console.error("Los resultados serían falsos: todo saldría como caído. Inténtalo más tarde.\n");
  process.exit(2);
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
      const j = juzgar(marca, dominio, cert);
      // Si el sitio no respondió, preguntarle al historial de certificados,
      // que sí sabe aunque el servidor esté caído.
      if (j.nivel === "ERROR") {
        const h = await historial(dominio);
        if (h?.n) j.nota = `${cert.error} — pero tiene ${h.n} certificados emitidos desde ${h.desde}: el dominio es real y activo. Reintenta cuando el sitio esté arriba.`;
        else if (h?.n === 0) j.nota = `${cert.error} — y NUNCA se le emitió un certificado. Sospechoso: revísalo.`;
      }
      return { marca, dominio, cert, ...j };
    }),
  );
  resultados.push(...hechos);
  process.stdout.write(`\r  ${resultados.length}/${tareas.length}`);
}
process.stdout.write("\r".padEnd(40) + "\r");

// Salida legible por máquina: la escribe la tarea programada y la lee la web.
// El historial de git de este archivo ES el registro de auditoría — muestra
// cuándo cambió el estado de cada dominio, y no hay que construir nada más.
if (comoJson) {
  const salida = {
    revisado: new Date().toISOString(),
    metodo: "certificado TLS del servidor; historial de transparencia como respaldo",
    resumen: {
      total: resultados.length,
      confirmados: resultados.filter((r) => r.nivel === "CONFIRMADO").length,
      revisar: resultados.filter((r) => r.nivel === "REVISAR").length,
      dudosos: resultados.filter((r) => r.nivel === "DUDOSO").length,
      sin_respuesta: resultados.filter((r) => r.nivel === "ERROR").length,
    },
    dominios: Object.fromEntries(
      resultados
        .sort((a, b) => a.dominio.localeCompare(b.dominio))
        .map((r) => [r.dominio, {
          institucion: r.marca.nombre,
          estado: r.nivel,
          detalle: r.nota,
          ...(r.cert?.hasta ? { certificado_vence: r.cert.hasta } : {}),
        }]),
    ),
  };
  const { writeFileSync } = await import("node:fs");
  writeFileSync("docs/verificacion.json", JSON.stringify(salida, null, 2) + "\n");
  console.log(`docs/verificacion.json escrito · ${salida.resumen.confirmados}/${salida.resumen.total} confirmados`);
  // Señal para la tarea programada: algo empeoró y hace falta un humano.
  const graves = resultados.filter((r) => r.nivel === "DUDOSO" || /NUNCA se le emiti/.test(r.nota ?? ""));
  if (graves.length) {
    console.log("\nATENCION:");
    for (const g of graves) console.log(`  ${g.dominio} (${g.marca.nombre}) — ${g.nota}`);
    process.exit(3);
  }
  process.exit(0);
}

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
console.log("  ERROR       no respondió ahora. Las entidades públicas de Ecuador se caen a menudo;");
console.log("              eso no dice nada sobre su legitimidad. Se consulta el historial de");
console.log("              certificados, que funciona aunque el sitio esté abajo, y se reintenta luego.\n");
console.log("Contraste independiente para bancos de Ecuador: la lista oficial de entidades");
console.log("autorizadas está en superbancos.gob.ec — no dependas solo de esto ni de mí.\n");
