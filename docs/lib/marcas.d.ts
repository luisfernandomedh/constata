/**
 * Registro de marcas suplantadas y sus dominios legítimos.
 *
 * Este archivo es el punto de crecimiento del proyecto: cada entrada nueva
 * mejora la detección sin tocar el motor. Las contribuciones más valiosas
 * son instituciones locales, porque son las que ninguna herramienta extranjera
 * conoce y las que más se suplantan en la región.
 */
export interface Marca {
    nombre: string;
    /** Formas en que el mensaje puede nombrarla, en minúsculas y sin tildes. */
    alias: string[];
    /** Dominios que sí le pertenecen. Un subdominio de estos también vale. */
    dominios: string[];
    pais?: string;
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
