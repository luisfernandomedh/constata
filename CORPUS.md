# El corpus abierto de estafas en español

No existe un conjunto público de mensajes de estafa en español latinoamericano. Los que hay están en inglés, y por eso ninguna herramienta extranjera reconoce al Banco Pichincha, al SRI ni al IESS. **Esa ausencia es lo que este corpus quiere llenar.**

## Dónde vive

En un repositorio aparte: **`constata-corpus`**, separado del código.

La separación es deliberada. Si algún día el corpus recibe una queja, una solicitud de retiro o una marca de seguridad automática, la biblioteca sigue viva y utilizable. Mezclarlos sería atar el destino de uno al del otro sin ninguna necesidad.

## Formato de una entrada

Una entrada por archivo, en JSON, nombrada por su identificador:

```json
{
  "id": "2026-09-ec-0041",
  "texto": "Banco Pichincha: detectamos un consumo de [monto] en Quito. Si no lo reconoce, bloquee aqui: hxxp://pichincha-seguro[.]net/[ruta]",
  "etiqueta": "estafa",
  "canal": "sms",
  "idioma": "es",
  "pais": "EC",
  "mes": "2026-09",
  "suplanta": "Banco Pichincha",
  "senales_esperadas": ["desajuste-marca-enlace", "dominio-imitador"],
  "procedencia": "comunidad",
  "notas": "Circuló ampliamente durante la primera semana de septiembre."
}
```

### Los campos

| Campo | Qué es |
|---|---|
| `id` | `año-mes-país-secuencia`. Estable, nunca se reutiliza. |
| `texto` | El mensaje **ya anonimizado y con los enlaces desactivados**. Nunca el original. |
| `etiqueta` | `estafa` o `legitimo`. Los legítimos importan tanto como las estafas: sin ellos no se pueden medir los falsos positivos. |
| `canal` | `sms`, `correo`, `whatsapp`, `llamada`, `red-social`. |
| `idioma` | Código ISO. Casi siempre `es`. |
| `pais` | Dónde circuló, si se sabe. |
| `mes` | **Mes, nunca el día exacto.** Una fecha precisa junto con el contenido puede reidentificar a la persona. |
| `suplanta` | Qué institución imita, si aplica. |
| `senales_esperadas` | Qué detectores debería disparar. Es lo que convierte el corpus en una suite de pruebas. |
| `procedencia` | `comunidad`, `sintetico` o `publicado`. Permite revertir en bloque si una fuente resulta mala. |
| `notas` | Contexto para quien lea después. Opcional. |

### Lo que una entrada nunca contiene

Remitente, número de teléfono, dirección de correo, nombres propios, montos exactos, números de cuenta o cédula, adjuntos, capturas de pantalla, fecha con día, ni el texto original sin anonimizar.

## Cómo se aporta

Desde [la herramienta](https://luisfernandomedh.github.io/constata/):

1. Analizas tu mensaje. Eso ocurre entero en tu navegador, sin enviar nada.
2. Con el resultado en pantalla aparece el texto **ya limpio y editable**, listo para aportar.
3. Lo revisas —los nombres propios no se detectan solos— y tocas **Enviar al corpus**.

Un clic. Sin cuenta, sin registro, sin salir de la página.

Ese envío no escribe en el corpus: crea una **propuesta pendiente** que una persona revisa. Ese paso no es burocracia, es la única defensa real contra que alguien envenene el conjunto o publique sin querer datos de un tercero. Ver [SECURITY.md](SECURITY.md).

Si prefieres hacerlo tú mismo en GitHub, hay [plantillas de issue](https://github.com/luisfernandomedh/constata/issues/new/choose) para aportar un mensaje o para agregar una institución al registro.

## Licencia

El corpus se publica bajo **CC0**, dominio público. Más abierta que la licencia del código, a propósito: la idea es que cualquier investigador, periodista o empresa lo pueda usar sin pedir permiso ni dar crédito.

Si esto sirve para que otro construya algo mejor, el objetivo está cumplido.
