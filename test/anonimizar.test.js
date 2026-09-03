import test from "node:test";
import assert from "node:assert/strict";
import { anonimizar, desactivarEnlace } from "../dist/index.js";

test("desactiva los enlaces para que no sean clicables", () => {
  const { texto } = anonimizar("Entra a http://pichincha-seguro.net/login?u=12345");
  assert.ok(!texto.includes("http://"), "no debe quedar un esquema clicable");
  assert.ok(texto.includes("hxxp://"), "debe usar la convención hxxp");
  assert.ok(texto.includes("[.]"), "los puntos del dominio deben ir rotos");
  assert.ok(!texto.includes("12345"), "la ruta y los parámetros se eliminan");
});

test("conserva el dominio, que es la señal más valiosa", () => {
  const { texto } = anonimizar("Entra a https://sri-devoluciones.info/form");
  assert.match(texto, /sri-devoluciones\[\.\]info/);
});

test("quita datos personales de quien contribuye", () => {
  const { texto } = anonimizar(
    "Hola, soy Ana, escribeme a ana.perez@gmail.com o al 0987654321. Te debo $45.20. Mi cedula es 1712345678.",
  );
  assert.ok(!texto.includes("ana.perez@gmail.com"), "el correo debe irse");
  assert.ok(!texto.includes("0987654321"), "el telefono debe irse");
  assert.ok(!texto.includes("1712345678"), "la cedula debe irse");
  assert.ok(!texto.includes("45.20"), "el monto debe irse");
});

test("informa qué clases de dato reemplazó", () => {
  const { reemplazos } = anonimizar("Escribe a x@y.com desde http://z.com/a");
  assert.ok(reemplazos.length >= 2);
  assert.ok(reemplazos.some((r) => r.includes("correo")));
  assert.ok(reemplazos.some((r) => r.includes("enlace")));
});

test("un mensaje sin datos personales sale casi igual", () => {
  const original = "Hola, te confirmo la reunion de manana a las 10.";
  const { texto, reemplazos } = anonimizar(original);
  assert.equal(texto, original);
  assert.equal(reemplazos.length, 0);
});

test("no rompe con entradas raras", () => {
  for (const entrada of ["", "   ", null, undefined, 42]) {
    const r = anonimizar(entrada);
    assert.equal(r.texto, "");
    assert.deepEqual(r.reemplazos, []);
  }
});

test("desactivarEnlace es idempotente en lo esencial", () => {
  const uno = desactivarEnlace("https://malo.com/x");
  assert.ok(uno.startsWith("hxxps://"));
  assert.ok(uno.includes("malo[.]com"));
});

test("el resultado nunca contiene una URL clicable", () => {
  const casos = [
    "mira bit.ly/abc123",
    "www.banco-falso.com/login",
    "https://a.b.c.d.com/muy/larga/ruta?token=secreto",
  ];
  for (const c of casos) {
    const { texto } = anonimizar(c);
    assert.doesNotMatch(texto, /https?:\/\//, `quedó clicable: ${texto}`);
  }
});

// Estas dos pruebas nacen de la primera contribución real recibida:
// el mensaje traía una marca de tiempo exacta, y la limpieza destruía
// la señal que el corpus necesita para servir como suite de pruebas.

test("borra fechas y horas exactas", () => {
  const casos = [
    "Su codigo es 483920. 2026-09-02 09:36",
    "Vence el 02/09/2026",
    "Le llamamos a las 14:30 pm",
  ];
  for (const c of casos) {
    const { texto } = anonimizar(c);
    assert.doesNotMatch(texto, /\d{4}[-/]\d{1,2}[-/]\d{1,2}/, `fecha sobrevivió: ${texto}`);
    assert.doesNotMatch(texto, /\d{1,2}:\d{2}/, `hora sobrevivió: ${texto}`);
  }
});

test("el código se reemplaza por uno sintético que conserva la forma", async () => {
  const { analizar } = await import("../dist/index.js");
  const original = "Su codigo de verificacion de Google es 483920. No lo comparta.";
  const { texto } = anonimizar(original);

  assert.ok(!texto.includes("483920"), "el código real no debe quedar");
  assert.match(texto, /\b\d{6}\b/, "debe quedar un número de la misma longitud");

  // Lo importante: la entrada del corpus sigue disparando la señal.
  const avisos = analizar(texto).avisos.map((a) => a.id);
  assert.ok(
    avisos.includes("codigo-recibido"),
    "anonimizar no debe destruir la señal, o la entrada no sirve como prueba",
  );
});

test("los centinelas internos nunca salen al texto final", () => {
  const { texto } = anonimizar("Tu codigo es 483920 y tu clave 1234");
  assert.doesNotMatch(texto, /[\u{E000}-\u{F8FF}]/u, "se filtró un carácter de uso privado");
});
