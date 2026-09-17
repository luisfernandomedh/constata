/**
 * El archivo que le dice a quien encuentre un fallo por dónde avisar.
 * Se prueba aquí porque caduca: un security.txt vencido es peor que ninguno,
 * y esta prueba se pone en rojo sola cuando llegue la fecha.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const RUTA = new URL("../docs/.well-known/security.txt", import.meta.url);
const texto = readFileSync(RUTA, "utf8");
const campos = Object.fromEntries(
  texto.split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]),
);

test("tiene los campos obligatorios de RFC 9116", () => {
  assert.equal(campos.Contact, "mailto:luisfernandomedhe@gmail.com");
  assert.equal(campos.Canonical, "https://constata.dev/.well-known/security.txt");
  assert.ok(campos.Expires, "falta Expires");
});

test("no está caducado y no promete más de 12 meses", () => {
  const vence = new Date(campos.Expires);
  assert.ok(!Number.isNaN(vence.getTime()), "Expires no es una fecha válida");
  const dias = (vence - Date.now()) / 86_400_000;
  assert.ok(dias > 0, `el security.txt está caducado desde hace ${Math.abs(Math.round(dias))} días`);
  assert.ok(dias <= 366, "RFC 9116 recomienda no pasar de un año");
});
