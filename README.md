# Cierto

**Detecta señales de estafa en un mensaje y explica por qué.**

Cierto recibe un texto — un SMS, un correo, un mensaje de WhatsApp — y devuelve las señales de fraude que encuentra, cada una con una explicación en español llano. No da un veredicto seco: da indicios, para que la persona decida.

🔎 **[Probar la demostración](https://luisfernandomedh.github.io/certia/)** — corre entera en tu navegador.

## Por qué

En Latinoamérica la estafa por mensaje es cotidiana y la gente no tiene forma de verificar nada. Las herramientas que existen son de pago, están en inglés, o son cajas negras que dicen "peligroso" sin explicar nada.

Cierto es gratis, abierto, y sobre todo **explicable**: si le dices a alguien que un mensaje es una estafa, tienes que poder decirle por qué. Esa explicación no es un adorno, es el producto — porque enseña a reconocer el patrón la próxima vez.

## Principios

- **El mensaje nunca sale de tu dispositivo.** `analizar()` es una función pura: sin red, sin estado, sin registro. No es una promesa de privacidad, es una propiedad de la arquitectura.
- **Sin dependencias.** Corre igual en el navegador y en Node.
- **Nunca promete seguridad.** Un riesgo bajo significa "no encontré señales conocidas", no "esto es seguro". Decirle a alguien que un mensaje es seguro cuando no lo es sería peor que no haber dicho nada.
- **Cada señal es un módulo.** Agregar detección nueva no toca el motor.

## Uso

```bash
npm install certia
```

```js
import { analizar } from "certia";

const resultado = analizar(
  "URGENTE: Su cuenta de Netflix sera suspendida hoy. Confirme su contrasena aqui: http://netflix-pagos.info/verificar"
);

console.log(resultado.riesgo);   // "alto"
console.log(resultado.puntaje);  // 100

for (const h of resultado.hallazgos) {
  console.log(h.id, "—", h.explicacion);
}
// desajuste-marca-enlace — El mensaje dice ser de Netflix, pero el enlace no lleva a un sitio de Netflix…
// dominio-imitador      — El dominio del enlace incluye el nombre "Netflix" pero no pertenece a Netflix…
// urgencia-artificial   — El mensaje te apura con un plazo o una amenaza de perder la cuenta…
```

## Señales de la versión 1

| Señal | Qué detecta |
|---|---|
| `pide-credenciales` | Te pide un código, clave, PIN o datos de tarjeta |
| `codigo-recibido` | *(aviso)* Te entrega un código: normal si lo pediste, alarma si no |
| `desajuste-marca-enlace` | Dice ser de una marca, pero el enlace va a otro lado |
| `dominio-imitador` | El dominio incluye el nombre de una marca sin pertenecerle |
| `dominio-generico-financiero` | Dominio con palabras sueltas como "banco" o "pagos" en vez de una marca real |
| `caracteres-enganosos` | Letras de otro alfabeto disfrazadas de latinas (punycode, cirílico) |
| `formulario-en-sitio-generico` | Trámites de cuenta en Google Forms y similares |
| `enlace-desconocido-accion-sensible` | Te pide entrar o verificar en un sitio no reconocido |
| `enlace-acortado` | Acortadores que ocultan el destino real |
| `familiar-numero-nuevo` | «Hola mamá, este es mi número nuevo» y pide dinero |
| `suplantacion-de-jefe` | Alguien dice ser tu jefe, evita hablar, y pide comprar algo |
| `oferta-laboral-irreal` | Mucho dinero por poco trabajo, sin proceso |
| `premio-inesperado` | Premios, bonos, paquetes o devoluciones que nadie pidió |
| `urgencia-artificial` | Plazos y amenazas para impedir que pienses |

Los hallazgos vienen en dos clases. Los de tipo `riesgo` suman al puntaje y acusan al mensaje. Los de tipo `aviso` no suman nada, pero se muestran siempre: son cosas que necesitas saber para decidir, sin que el mensaje sea necesariamente malo.

El registro de marcas en [`src/marcas.ts`](src/marcas.ts) cubre bancos, entidades del Estado y operadoras de Ecuador y la región, además de plataformas globales. **Agregar una institución local es la contribución más útil y más fácil**: es una línea, y mejora la detección sin tocar el motor.

## Hacia dónde va

1. **Versión 1 — núcleo determinista.** Sin modelo, sin red, sin costo. Es lo que hay hoy. Esta capa nunca deja de ser gratis.
2. **Versión 2 — capa de modelo opcional** para los casos que las reglas no resuelven, detrás de una interfaz que permita cambiar de proveedor. La clave la pone quien incrusta la biblioteca, nunca el proyecto.
3. **Versión 3 — ciclo de mejora:** lo que el modelo resuelve bien se convierte en reglas nuevas del núcleo. El sistema se abarata al crecer en vez de encarecerse.

## Privacidad, en concreto

No es una promesa, es una propiedad de la arquitectura:

- `analizar()` es una función pura. No usa la red, no guarda estado, no registra nada.
- La demo web corre entera en el navegador. **Puedes desconectar el internet y sigue funcionando.**
- Sin cuenta, sin cookies, sin almacenamiento, sin telemetría, sin publicidad.
- Si decides contribuir un ejemplo, es un acto aparte y explícito, y **ves exactamente el texto que se va a enviar antes de enviarlo**.

## Cómo contribuir

**Lo más valioso son mensajes de estafa reales**, en español y de Latinoamérica. No existe un corpus público de eso, y llenar esa ausencia es el aporte principal de este proyecto. Ver [CORPUS.md](CORPUS.md).

Desde la [herramienta](https://luisfernandomedh.github.io/certia/): analiza tu mensaje, toca **Contribuir este ejemplo**, revisa el texto ya limpio —y edítalo, porque los nombres propios no se detectan solos— y confirma. Se abre un formulario de GitHub con todo puesto.

**La segunda contribución más útil, y la más fácil: agregar una institución** al registro de [`src/marcas.ts`](src/marcas.ts). Es una línea, y mejora la detección sin tocar el motor. Hay una [plantilla de issue](https://github.com/luisfernandomedh/certia/issues/new?template=agregar-marca.yml) para eso.

Antes de aportar mensajes o código, lee [SECURITY.md](SECURITY.md). Aceptar contenido de desconocidos y publicarlo tiene riesgos concretos —enlaces de phishing vivos, inyección, datos personales irreversibles, envenenamiento del corpus— y el diseño los enfrenta de forma explícita.

## Desarrollo

```bash
npm install
npm run build
npm test
```

## Licencia

MIT

## Documentos

- [SECURITY.md](SECURITY.md) — modelo de amenazas y decisiones de diseño
- [CORPUS.md](CORPUS.md) — formato del corpus abierto y cómo se aporta
