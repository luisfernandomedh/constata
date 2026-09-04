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
export declare const MARCAS: Marca[];
/** ¿Este dominio pertenece a la marca, directamente o como subdominio? */
export declare function esDominioDe(dominio: string, marca: Marca): boolean;
/** ¿Este dominio pertenece a alguna marca conocida? */
export declare function esDominioConocido(dominio: string): boolean;
/**
 * Servicios que cualquiera puede usar para publicar una página en minutos.
 * No son maliciosos, pero un banco jamás alojaría ahí su formulario de acceso.
 */
export declare const ALOJAMIENTO_GENERICO: string[];
/** Servicios que esconden el destino real de un enlace. */
export declare const ACORTADORES: Set<string>;
