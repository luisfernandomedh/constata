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
