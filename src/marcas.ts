/**
 * Registro de marcas suplantadas y sus dominios legítimos.
 *
 * Este archivo es el punto de crecimiento del proyecto: cada entrada nueva
 * mejora la detección sin tocar el motor. Las contribuciones más valiosas
 * son instituciones locales, porque son las que ninguna herramienta extranjera
 * conoce y las que más se suplantan en la región.
 */
/**
 * Qué tan comprobado está que estos dominios son de quien decimos.
 *
 * - `certificado`: el certificado TLS del sitio lleva el nombre legal de la
 *   organización. Es la prueba fuerte: para obtenerlo hay que demostrarle a
 *   una autoridad certificadora que controlas el dominio, y en los de
 *   validación de organización además hay documentos de por medio.
 * - `pendiente`: el dominio responde y es plausible, pero su certificado no
 *   confirma quién está detrás. Muy común, y no significa que esté mal.
 *
 * Se comprueba con `npm run verificar`. La distinción se muestra en público:
 * una lista verificada que nadie verificó no vale más que una alucinación
 * bien formateada.
 */
export type Verificacion = "certificado" | "pendiente";

export interface Marca {
  nombre: string;
  /** Formas en que el mensaje puede nombrarla, en minúsculas y sin tildes. */
  alias: string[];
  /** Dominios que sí le pertenecen. Un subdominio de estos también vale. */
  dominios: string[];
  pais?: string;
  verificacion?: Verificacion;
}

export const MARCAS: Marca[] = [
  // ── Banca Ecuador ─────────────────────────────────────────────
  { nombre: "Banco Pichincha", pais: "EC", alias: ["pichincha", "banco pichincha"], dominios: ["pichincha.com", "deuna.app"], verificacion: "certificado" },
  { nombre: "Banco Guayaquil", pais: "EC", alias: ["banco guayaquil", "bancoguayaquil"], dominios: ["bancoguayaquil.com"], verificacion: "certificado" },
  { nombre: "Produbanco", pais: "EC", alias: ["produbanco"], dominios: ["produbanco.com.ec", "produbanco.com"], verificacion: "certificado" },
  { nombre: "Banco del Pacífico", pais: "EC", alias: ["banco del pacifico", "bancodelpacifico"], dominios: ["bancodelpacifico.com"], verificacion: "certificado" },
  { nombre: "Banco Bolivariano", pais: "EC", alias: ["bolivariano"], dominios: ["bolivariano.com"], verificacion: "certificado" },
  { nombre: "Banco Internacional", pais: "EC", alias: ["banco internacional"], dominios: ["bancointernacional.com.ec"], verificacion: "certificado" },
  { nombre: "Diners Club", pais: "EC", alias: ["diners", "diners club"], dominios: ["dinersclub.com.ec"], verificacion: "certificado" },
  { nombre: "Cooperativa JEP", pais: "EC", alias: ["coop jep", "cooperativa jep", "coopjep"], dominios: ["coopjep.fin.ec"], verificacion: "certificado" },
  { nombre: "PayPhone", pais: "EC", alias: ["payphone"], dominios: ["payphone.app"] },

  // ── Estado Ecuador ────────────────────────────────────────────
  { nombre: "SRI", pais: "EC", alias: ["sri", "servicio de rentas"], dominios: ["sri.gob.ec"], verificacion: "certificado" },
  { nombre: "IESS", pais: "EC", alias: ["iess", "seguro social"], dominios: ["iess.gob.ec"], verificacion: "certificado" },
  { nombre: "ANT", pais: "EC", alias: ["ant", "agencia nacional de transito"], dominios: ["ant.gob.ec"] },
  { nombre: "Registro Civil", pais: "EC", alias: ["registro civil"], dominios: ["registrocivil.gob.ec"] },

  // ── Telecomunicaciones ────────────────────────────────────────
  { nombre: "Claro", pais: "EC", alias: ["claro"], dominios: ["claro.com.ec", "claro.com"] },
  { nombre: "Movistar", alias: ["movistar"], dominios: ["movistar.com.ec", "movistar.com", "movistar.es"], verificacion: "certificado" },
  { nombre: "CNT", pais: "EC", alias: ["cnt"], dominios: ["cnt.com.ec", "cnt.gob.ec"] },

  // ── Banca y pagos de la región ────────────────────────────────
  { nombre: "Mercado Libre", alias: ["mercado libre", "mercadolibre", "mercado pago", "mercadopago"], dominios: ["mercadolibre.com", "mercadopago.com", "mercadolibre.com.ec"] },
  { nombre: "Nequi", pais: "CO", alias: ["nequi"], dominios: ["nequi.com.co"] },
  { nombre: "Bancolombia", pais: "CO", alias: ["bancolombia"], dominios: ["bancolombia.com"], verificacion: "certificado" },
  { nombre: "BBVA", alias: ["bbva"], dominios: ["bbva.com", "bbva.mx", "bbva.es"], verificacion: "certificado" },
  { nombre: "Santander", alias: ["santander"], dominios: ["santander.com", "santander.com.mx"], verificacion: "certificado" },
  { nombre: "Banorte", pais: "MX", alias: ["banorte"], dominios: ["banorte.com"] },
  { nombre: "BCP", pais: "PE", alias: ["bcp", "banco de credito"], dominios: ["viabcp.com"] },
  { nombre: "Interbank", pais: "PE", alias: ["interbank"], dominios: ["interbank.pe"], verificacion: "certificado" },
  { nombre: "Itaú", alias: ["itau"], dominios: ["itau.com", "itau.com.br"], verificacion: "certificado" },
  { nombre: "Western Union", alias: ["western union"], dominios: ["westernunion.com"], verificacion: "certificado" },
  { nombre: "Binance", alias: ["binance"], dominios: ["binance.com"], verificacion: "certificado" },

  // ── Paquetería ────────────────────────────────────────────────
  { nombre: "DHL", alias: ["dhl"], dominios: ["dhl.com"], verificacion: "certificado" },
  { nombre: "FedEx", alias: ["fedex"], dominios: ["fedex.com"], verificacion: "certificado" },
  { nombre: "UPS", alias: ["ups"], dominios: ["ups.com"], verificacion: "certificado" },
  { nombre: "Servientrega", alias: ["servientrega"], dominios: ["servientrega.com"] },
  { nombre: "Correos del Ecuador", pais: "EC", alias: ["correos del ecuador"], dominios: ["correosdelecuador.com.ec"] },

  // ── Plataformas globales ──────────────────────────────────────
  { nombre: "WhatsApp", alias: ["whatsapp"], dominios: ["whatsapp.com", "wa.me"], verificacion: "certificado" },
  { nombre: "Netflix", alias: ["netflix"], dominios: ["netflix.com"], verificacion: "certificado" },
  { nombre: "PayPal", alias: ["paypal"], dominios: ["paypal.com"], verificacion: "certificado" },
  { nombre: "Apple", alias: ["apple", "icloud", "app store"], dominios: ["apple.com", "icloud.com"], verificacion: "certificado" },
  { nombre: "Microsoft", alias: ["microsoft", "outlook", "office 365"], dominios: ["microsoft.com", "live.com", "outlook.com", "office.com"], verificacion: "certificado" },
  { nombre: "Amazon", alias: ["amazon"], dominios: ["amazon.com", "amazon.es", "amazon.com.mx"] },
  { nombre: "Google", alias: ["google", "gmail"], dominios: ["google.com", "gmail.com", "youtube.com"] },
  { nombre: "Instagram", alias: ["instagram"], dominios: ["instagram.com"], verificacion: "certificado" },
  { nombre: "Facebook", alias: ["facebook"], dominios: ["facebook.com", "fb.com"], verificacion: "certificado" },
  { nombre: "Spotify", alias: ["spotify"], dominios: ["spotify.com"], verificacion: "certificado" },
  { nombre: "Uber", alias: ["uber"], dominios: ["uber.com"], verificacion: "certificado" },
  { nombre: "Disney+", alias: ["disney"], dominios: ["disneyplus.com"] },
];

/** ¿Este dominio pertenece a la marca, directamente o como subdominio? */
export function esDominioDe(dominio: string, marca: Marca): boolean {
  return marca.dominios.some((d) => dominio === d || dominio.endsWith(`.${d}`));
}

/** ¿Este dominio pertenece a alguna marca conocida? */
export function esDominioConocido(dominio: string): boolean {
  return MARCAS.some((m) => esDominioDe(dominio, m));
}

/**
 * Servicios que cualquiera puede usar para publicar una página en minutos.
 * No son maliciosos, pero un banco jamás alojaría ahí su formulario de acceso.
 */
export const ALOJAMIENTO_GENERICO = [
  "docs.google.com", "forms.gle", "sites.google.com", "typeform.com",
  "jotform.com", "wufoo.com", "formstack.com", "airtable.com",
  "firebaseapp.com", "web.app", "netlify.app", "vercel.app", "pages.dev",
  "glitch.me", "herokuapp.com", "repl.co", "weebly.com", "wixsite.com",
  "blogspot.com", "github.io", "000webhostapp.com", "r2.dev", "workers.dev",
];

/** Servicios que esconden el destino real de un enlace. */
export const ACORTADORES = new Set([
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly",
  "cutt.ly", "rb.gy", "shorturl.at", "rebrand.ly", "bl.ink", "acortar.link",
  "n9.cl", "url.gd", "tiny.cc", "soo.gd", "shorte.st", "adf.ly",
]);
