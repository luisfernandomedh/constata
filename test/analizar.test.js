import test from "node:test";
import assert from "node:assert/strict";
import { analizar } from "../dist/index.js";

/**
 * Estos casos NO están escritos para que coincidan con los detectores.
 * Son mensajes tomados de la realidad, y la suite existe justamente para
 * que duela cuando el motor falle. Si un caso nuevo no pasa, se agrega
 * igual y se marca como pendiente: la lista de fallos es la hoja de ruta.
 */

/** Deben salir con riesgo medio o alto. */
const ESTAFAS = [
  // Suplantación de instituciones ecuatorianas
  "Banco Pichincha: detectamos un consumo de $340 en Quito. Si no lo reconoce, bloquee aqui: http://pichincha-seguro.net/bloqueo",
  "SRI: usted tiene una devolucion de impuestos de $187.40 pendiente. Ingrese sus datos: https://sri-devoluciones.info",
  "IESS informa: su historia laboral presenta inconsistencias. Regularice antes del viernes en iess-tramites.online",
  "Claro: acumulaste 5000 puntos que vencen hoy. Canjealos en bit.ly/claro-pts",
  // Suplantación de marcas globales
  "URGENTE: Su cuenta de Netflix sera suspendida hoy. Confirme su contrasena aqui: http://netflix-pagos.info/verificar",
  "Su paquete esta retenido en aduana. Pague la tasa: https://dhl-envios-ec.com/pago",
  // Robo de código de un solo uso
  "Somos WhatsApp. Envianos el codigo de verificacion que te llego por SMS.",
  "Banco: su cuenta sera bloqueada en las proximas 24 horas. Ingrese su clave dinamica.",
  // Ingeniería social sin ningún enlace
  "Hola mama, se me daño el telefono, este es mi numero nuevo. Necesito que me hagas una transferencia urgente, luego te explico.",
  "Buenas, le escribo de Recursos Humanos. Tenemos una vacante de trabajo remoto, $80 diarios por 2 horas. Interesado responda SI.",
  "Soy el gerente. Estoy en una reunion y no puedo hablar. Necesito que compres tarjetas de regalo y me envies los codigos.",
  // Abuso de servicios legítimos y dominios genéricos
  "Su cuenta sera cerrada. Complete el formulario: https://docs.google.com/forms/d/e/1FAIpQL/viewform",
  "Estimado cliente, hemos actualizado nuestra politica de privacidad. Revise los cambios en https://banco-actualizaciones.com/politica",
  // Caracteres engañosos
  "Ingrese a su cuenta: https://xn--pypal-4ve.com/login",
  "Verifique su cuenta en раypal.com ahora mismo",
];

/** No deben salir con riesgo medio ni alto. Los falsos positivos cuestan confianza. */
const LEGITIMOS = [
  "Su codigo de verificacion de Google es 483920. No lo comparta con nadie.",
  "Banco Pichincha: consumo aprobado por $45.20 en SUPERMAXI. Si no lo reconoce llame al 1700 100 100.",
  "URGENTE: el informe para el cliente vence hoy. Me lo puedes pasar antes de las 5?",
  "Felicidades por tu ascenso! Nos tienes que invitar algo.",
  "Tu paquete de Amazon llega manana. Sigue el envio en https://www.amazon.com/progress-tracker",
  "Hola, te confirmo la reunion de manana a las 10. El link es https://meet.google.com/abc-defg-hij",
  "Recordatorio: tu cita medica es el jueves a las 3 de la tarde.",
];

test("detecta las estafas conocidas", () => {
  const fallos = ESTAFAS.filter((m) => analizar(m).riesgo === "bajo");
  assert.deepEqual(fallos, [], `no detectadas:\n${fallos.join("\n")}`);
});

test("no genera falsos positivos en mensajes normales", () => {
  const fallos = LEGITIMOS.filter((m) => analizar(m).riesgo !== "bajo");
  assert.deepEqual(fallos, [], `falsos positivos:\n${fallos.join("\n")}`);
});

test("recibir un codigo es un aviso, no una acusacion", () => {
  const r = analizar("Su codigo de verificacion de Google es 483920. No lo comparta con nadie.");
  assert.equal(r.riesgo, "bajo", "recibir un codigo no debe puntuar como riesgo");
  assert.equal(r.avisos.length, 1, "pero debe advertir que si no lo pediste, alguien esta entrando");
  assert.match(r.avisos[0].explicacion, /si no lo pediste/i);
});

test("pedir un codigo si es riesgo alto", () => {
  const r = analizar("Somos WhatsApp, envianos el codigo que te llego");
  assert.equal(r.riesgo, "alto");
  assert.ok(r.hallazgos.some((h) => h.id === "pide-credenciales"));
});

test("la urgencia sola no basta para alertar", () => {
  const r = analizar("URGENTE necesito el reporte antes de las 5");
  assert.equal(r.riesgo, "bajo", "un compañero de trabajo tambien escribe URGENTE");
});

test("la urgencia junto a un enlace desconocido si alerta", () => {
  const r = analizar("URGENTE: revise esto antes de que expire https://sitio-raro-12345.tk/x");
  assert.notEqual(r.riesgo, "bajo");
});

test("todo hallazgo trae explicacion util y tipo declarado", () => {
  for (const m of [...ESTAFAS, ...LEGITIMOS]) {
    const r = analizar(m);
    for (const h of [...r.hallazgos, ...r.avisos]) {
      assert.ok(h.explicacion.length > 40, `explicacion muy corta en ${h.id}`);
      assert.ok(h.id.length > 0);
      assert.ok(h.tipo === "riesgo" || h.tipo === "aviso", `tipo invalido en ${h.id}`);
    }
    assert.ok(r.hallazgos.every((h) => h.tipo === "riesgo"));
    assert.ok(r.avisos.every((h) => h.tipo === "aviso" && h.peso === 0));
  }
});

test("entradas raras no rompen nada", () => {
  for (const entrada of ["", "   ", null, undefined, 42, {}, []]) {
    const r = analizar(entrada);
    assert.equal(r.riesgo, "bajo");
    assert.equal(r.hallazgos.length, 0);
    assert.equal(r.avisos.length, 0);
  }
});

test("el puntaje nunca se sale del rango", () => {
  for (const m of ESTAFAS) {
    const { puntaje } = analizar(m);
    assert.ok(puntaje >= 0 && puntaje <= 100, `puntaje fuera de rango: ${puntaje}`);
  }
});
