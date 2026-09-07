/**
 * Cobertura contra la taxonomía real de estafas, no contra lo que se nos ocurrió.
 *
 * Existe porque los detectores se escribieron por intuición y se nos escapó el
 * fraude más famoso del mundo. Este archivo lista una categoría por cada tipo
 * documentado por la FTC y el FBI, adaptado a cómo llegan en Latinoamérica, y
 * mide cuántas detectamos de verdad.
 *
 * El primer resultado fue 5 de 18. No es un dato para esconder: es el mapa de
 * lo que falta y el argumento de por qué las reglas no bastan.
 *
 *   node scripts/cobertura.mjs
 */
import { analizar } from "../dist/index.js";

// Un caso representativo por categoría de la taxonomía real (FTC/FBI 2026),
// adaptado a cómo llegan en Latinoamérica.
const CASOS = [
["Inversión / cripto", "Hola! Te escribo porque vi tu perfil. Soy analista de trading. Con mi metodo mis clientes ganan 15% semanal en cripto. Empeza con 200 dolares y te muestro. Mira las ganancias de ayer."],
["Pig butchering", "Disculpa, este es el numero de Carla? Ah perdon, me equivoque. Igual gusto en saludarte, soy Mei. De donde eres? Yo vivo en Singapur y trabajo en inversiones."],
["Romance", "Mi amor, sabes que te quiero. Estoy varado en el aeropuerto y me retuvieron la maleta. Necesito 800 dolares para la aduana, te lo devuelvo apenas llegue."],
["Soporte técnico", "ALERTA DE MICROSOFT: Su computadora tiene 3 virus detectados. Llame inmediatamente al 1-800-555-0199 para asistencia tecnica certificada."],
["Suplantación gobierno", "SRI: Notificacion de proceso coactivo por deuda tributaria pendiente. Debe acercarse o regularizar. Codigo de tramite 88213."],
["Extorsión / sextorsión", "Tengo grabaciones de tu camara mientras visitabas sitios para adultos. Si no depositas 500 dolares en esta billetera en 48 horas envio todo a tus contactos."],
["Arresto digital", "Le habla el fiscal Ramirez. Su cedula esta involucrada en lavado de activos. No cuelgue ni comente con nadie o sera detenido. Debe verificar sus fondos."],
["Lotería / premio", "Felicidades! Su numero resulto ganador de la loteria nacional. Premio de 50000 dolares. Para reclamar debe cubrir el impuesto de 300 dolares."],
["Factura falsa", "Estimado proveedor, adjuntamos la factura pendiente numero 4471 por 1250 dolares. Favor realizar el pago a la nueva cuenta bancaria indicada."],
["Alquiler falso", "El departamento sigue disponible. Estoy fuera del pais asi que no puedo mostrarlo, pero si me depositas el mes de garantia te envio las llaves por courier."],
["Caridad falsa", "Ayudanos! Estamos recaudando para los damnificados del terremoto. Cualquier aporte suma, deposita a esta cuenta personal por favor."],
["Reembolso falso", "Su suscripcion de Netflix se renovo por 89.99 dolares. Si no reconoce este cargo llame al 099 123 4567 para cancelar y recibir su reembolso."],
["Empleo / tareas", "Trabajo desde casa dando like a videos. Pagamos 5 dolares por tarea. Solo necesitas registrarte con un deposito inicial de 20 dolares reembolsable."],
["Abuelito / emergencia", "Abuelita soy yo, tuve un accidente con el carro y estoy en la comisaria. No le digas a mis papas. Necesito que me mandes 400 dolares urgente."],
["Pago adelantado", "Le escribo desde el bufete Smith. Un cliente fallecido comparte su apellido y le corresponde una herencia de 4.5 millones. Contacteme para los tramites."],
["Phishing bancario", "Banco Pichincha: detectamos un consumo de $340. Bloquee aqui: http://pichincha-seguro.net/bloqueo"],
["Robo de codigo", "Somos WhatsApp. Envianos el codigo de verificacion que te llego por SMS."],
["Paquete retenido", "Su paquete esta retenido en aduana. Pague la tasa: https://dhl-envios-ec.com/pago"],
];

let fallan = [];
for (const [cat, msg] of CASOS) {
  const r = analizar(msg);
  const ok = r.riesgo !== "bajo";
  if (!ok) fallan.push(cat);
  console.log(`${ok ? "✔" : "✖"} ${cat.padEnd(24)} ${r.riesgo.padEnd(6)} ${r.hallazgos.map(h=>h.id).join(", ") || "—"}`);
}
console.log(`\n${CASOS.length - fallan.length}/${CASOS.length} detectadas · FALLAN ${fallan.length}: ${fallan.join(", ")}`);
