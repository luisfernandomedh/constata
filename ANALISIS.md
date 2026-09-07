# Cómo se analiza tu mensaje

Esta página explica, sin rodeos, qué pasa con lo que escribes o subes a
[constata.dev](https://constata.dev). Si algo de lo que aquí se dice no
coincide con lo que hace el código, es un error nuestro: [avísanos](https://github.com/luisfernandomedh/constata/issues).

## El recorrido, paso a paso

1. **Escribes el mensaje o subes la captura.** Todo sigue en tu dispositivo.
2. **Si es una imagen, se encoge en tu propio navegador** antes de salir:
   máximo 1200 píxeles de lado. Ni el original ni una copia se guardan.
3. **Se envía a nuestro servidor** (un Cloudflare Worker en `constata.dev`),
   que lo reenvía a **Groq**, el servicio que ejecuta el modelo.
4. **El modelo responde** con un nivel de riesgo, las señales que encontró y
   qué hacer. Esa respuesta te llega y se muestra en pantalla.
5. **Se acabó.** No hay base de datos. Nada de lo que enviaste queda escrito.

## Qué modelo lo lee

`qwen/qwen3.8-27b`, un modelo abierto, ejecutado en la capa gratuita de Groq.
El modelo puede cambiar si deja de estar disponible; el que esté en uso
siempre se puede leer en el código, en
[`worker/analizar.js`](worker/analizar.js).

El modelo **se equivoca**. Puede marcar como estafa algo legítimo, y puede
dejar pasar una estafa real. Es una ayuda para que decidas tú, no un
veredicto.

## Qué se guarda, y qué no

**No se guarda:**

- El mensaje ni la imagen. El servidor los pasa y los olvida.
- Tu dirección IP. Se usa una huella cifrada e irreversible, y solo para
  contar cuántas veces has consultado en la última hora. Se borra sola a las
  dos horas.
- Nada que permita saber quién eres. No hay cuentas, ni cookies de rastreo,
  ni analítica.

**Sí se guarda, y solo si tú lo pides:** cuando después de ver el resultado
tocas *«Dona este ejemplo»*, el mensaje se añade a un
[repositorio público de ejemplos](https://github.com/luisfernandomedh/constata-corpus)
para mejorar la herramienta. Antes de enviarlo:

- Se limpian automáticamente correos, teléfonos, montos, fechas y las rutas
  de los enlaces, **en tu navegador**, antes de que nada salga.
- Se te muestra el texto ya limpio para que lo revises con tus ojos.
- **La limpieza automática no detecta nombres propios.** Si aparece tu nombre
  o el de alguien más, bórralo tú antes de enviar.
- Cada aporte pasa por revisión humana antes de entrar al conjunto.

Donar es siempre un segundo acto, separado y explícito. Nunca hay una casilla
marcada de antemano.

## Qué ve el servicio de análisis

Groq recibe el mensaje o la imagen para procesarlos. Su política de
retención en la capa gratuita es suya, no nuestra, y puede cambiar sin que
nos enteremos: <https://groq.com/privacy-policy>.

Por eso el consejo de la pantalla es literal y va en serio: **quita tu nombre
y el de otras personas antes de enviar.** Para saber si un mensaje es una
estafa no hace falta que aparezca quién eres.

## Protección contra manipulación del modelo

Un estafador que sepa que hay un modelo detrás puede intentar escribirle. Por
eso el mensaje se le entrega **delimitado y marcado como material a examinar,
nunca como instrucciones**. Si el contenido intenta darle órdenes al modelo,
eso mismo cuenta como una señal grave de fraude. Los detalles están en
[SECURITY.md](SECURITY.md).

## Cuando el servicio no responde

Hay un límite de consultas gratuitas. Si se agota, o si el servicio falla, la
herramienta **no se queda muda**: cae a un motor de reglas que funciona
entero dentro de tu navegador, sin red. Es más limitado —no lee intención—
pero sigue detectando enlaces falsos, suplantación de marcas y peticiones de
claves. Y en ese caso nada sale de tu dispositivo.

## Todo esto es comprobable

El código entero es público y no hay una versión distinta corriendo en
producción:

- La página: [`docs/index.html`](docs/index.html)
- El servidor: [`worker/analizar.js`](worker/analizar.js)
- Las reglas locales: [`src/signals/index.ts`](src/signals/index.ts)

No hace falta que nos creas. Léelo.
