import test from "node:test";
import assert from "node:assert/strict";
import { analizar } from "../dist/index.js";

/** Mensajes de estafa. Deben salir con riesgo medio o alto. */
const ESTAFAS = [
  "Su cuenta de Netflix sera suspendida hoy. Actualice sus datos aqui: http://netflix-pagos.info/verificar",
  "URGENTE: detectamos un acceso no autorizado. Confirma tu contrasena en bit.ly/3xKq2",
  "Felicidades! Has ganado un bono de $500. Reclama tu premio en http://premios-hoy.top",
  "Su paquete esta retenido en aduana. Pague la tasa: https://dhl-envios-ec.com/pago",
  "Somos WhatsApp. Envianos el codigo de verificacion que te llego por SMS.",
  "Banco: su cuenta sera bloqueada en las proximas 24 horas. Ingrese su clave dinamica.",
];

/** Mensajes normales. No deberian salir con riesgo alto. */
const LEGITIMOS = [
  "Hola, te confirmo la reunion de manana a las 10. Saludos.",
  "Tu pedido fue enviado. Puedes seguirlo en https://www.amazon.com/orders",
  "Recordatorio: tu cita medica es el jueves a las 3 de la tarde.",
  "Adjunto el informe que me pediste. Cualquier cosa me avisas.",
  "El link de la reunion es https://meet.google.com/abc-defg-hij",
];

test("detecta mensajes de estafa", () => {
  for (const msg of ESTAFAS) {
    const r = analizar(msg);
    assert.notEqual(r.riesgo, "bajo", `no detectado: ${msg}\n${JSON.stringify(r, null, 2)}`);
    assert.ok(r.hallazgos.length > 0, `sin hallazgos: ${msg}`);
  }
});

test("no marca como alto riesgo los mensajes normales", () => {
  for (const msg of LEGITIMOS) {
    const r = analizar(msg);
    assert.notEqual(r.riesgo, "alto", `falso positivo: ${msg}\n${JSON.stringify(r, null, 2)}`);
  }
});

test("todo hallazgo trae una explicacion en lenguaje llano", () => {
  for (const msg of ESTAFAS) {
    for (const h of analizar(msg).hallazgos) {
      assert.ok(h.explicacion.length > 30, `explicacion muy corta en ${h.id}`);
      assert.ok(h.id.length > 0);
    }
  }
});

test("mensaje vacio no rompe nada", () => {
  for (const entrada of ["", "   ", null, undefined, 42]) {
    const r = analizar(entrada);
    assert.equal(r.riesgo, "bajo");
    assert.equal(r.hallazgos.length, 0);
  }
});

test("pedir un codigo basta para no ser riesgo bajo", () => {
  const r = analizar("Hola, mandame el codigo de verificacion porfa");
  assert.notEqual(r.riesgo, "bajo");
});
