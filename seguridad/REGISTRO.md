# Registro de seguridad

Estado vivo de la seguridad de Constata. Lo mantiene el agente `seguridad`.
Se lee entero al empezar cualquier trabajo de seguridad y se actualiza al terminar.

**Última actualización:** 21 de septiembre de 2026

---

## Entorno de trabajo

| Qué | Dónde |
|---|---|
| Trivy | `trivy` en el sistema (0.74.0) |
| Gitleaks | `gitleaks` en el sistema (8.30.1) |
| Semgrep | entorno virtual: `<scratchpad>/sg/bin/semgrep` (1.177.0). **No está en el sistema**: Homebrew no lo compila en este Mac Intel. Se reinstala con `python3.13 -m venv <dir> && <dir>/bin/pip install --only-binary=:all: semgrep`, tarda ~1 min |
| Despliegue del Worker | `cd worker && source ~/.constata-secrets && npx wrangler deploy` |
| Secretos | `~/.constata-secrets` (600). Nunca en el repo, nunca en pantalla |

---

## Hallazgos

Severidad según el daño real en este producto, no según el número del CVE.

### Cerrados

| # | Hallazgo | Severidad | Cerrado | Prueba |
|---|---|---|---|---|
| 1 | La página no declaraba de qué sitios podía cargar programas | Alta | 17 sep 2026 · commit `f277f70` | Programa desde `unpkg.com` → bloqueado |
| 2 | Los dos archivos de CDN se cargaban sin verificar su huella | Alta | 17 sep 2026 · commit `f277f70` | Huella falsa → descartado; correcta → se ejecuta; el lector de imágenes sigue leyendo |
| 3 | El Worker respondía a cualquier origen | Media | 17 sep 2026 · Worker `1e34d325` | Origen inventado → sin permiso; `constata.dev` → con permiso |

### Abiertos

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 4 | `SECURITY.md:9` y `:90` afirman que analizar «nunca envía nada a ninguna parte» y que no envía nada durante el análisis. Los metadatos de `docs/index.html:12` y `:14` dicen «nadie más lo ve». Desde que el modelo es el camino por defecto, texto e imágenes van a Groq | **Alta** | **Luis decidió no cambiarlo** (17 sep 2026): considera que los avisos de la interfaz ya lo cubren. Queda registrado, no se toca sin que él lo pida |
| 7b | La llave de prueba `CLAVE_PRUEBA` no tiene secreto cargado en el Worker: hoy Luis está sujeto al mismo tope de 50 que cualquiera | Baja | Pendiente de él: `npx wrangler secret put CLAVE_PRUEBA` |
| 8 | El contador de KV no es atómico: lee y luego escribe. Peticiones en paralelo saltan el tope | Media | Sin aprobar. Requeriría Durable Objects |
| 9 | La política de contenido va en etiqueta `meta`, no en cabecera HTTP. `frame-ancestors` no es fiable así. Faltan HSTS, `X-Content-Type-Options` y `Permissions-Policy` | Media | Aprobado: mover a reglas de Cloudflare |
| 11 | No hay pruebas del Worker ni integración continua en cada push. Los flujos existentes son mensuales o cada 48 h | Media | Aprobado |
| 12 | `sharp 0.35.2` arrastra `GHSA-rgj7-g3m4-5g8c` (alta). Solo se usa al construir; no llega al navegador | Baja aquí | Plazo hasta el 17 nov 2026 |
| 13 | Tres archivos basura versionados en la raíz (`10}`, `8}` y uno con saltos de línea en el nombre), restos de un heredoc mal cerrado | Higiene | Sin tocar |
| 14 | `worker/index.js` contiene caracteres de control literales dentro de una expresión regular; git lo trata como binario y no muestra diferencias | Higiene | Sin tocar. Cuidado al editarlo: preservar esos bytes |

---

## Decisiones de Luis

| Fecha | Decisión |
|---|---|
| 17 sep 2026 | **Sin Turnstile** en `/analizar` por ahora. Un captcha se lo cobra a la persona asustada, que es a quien sirve el producto |
| 17 sep 2026 | **Sin WAF ni Durable Objects** por ahora. Bajar el umbral y añadir llave de prueba se considera suficiente |
| 17 sep 2026 | **Sin cambios en los textos de privacidad** (hallazgo 4) |
| 17 sep 2026 | **Fuera la medición del modelo.** `docs/evaluacion.json` mide las reglas deterministas; medir el acierto del modelo no es prioridad |
| 17 sep 2026 | Umbral diario por conexión: **100 → 50** |
| 17 sep 2026 | La llave de prueba es un **secreto compartido** en la cabecera `X-Constata-Llave`, no una firma con caducidad: exime del cupo y de nada más, así que un secreto filtrado solo deja saltarse el enfriamiento, nunca leer ni gastar de más sin quedar contado |
| 17 sep 2026 | Los turnos `assistant` del cliente se **descartan**, no se reetiquetan: reetiquetar conserva el texto fabricado, solo que en otra casilla. Coste asumido: en una repregunta el modelo ya no ve el resumen que dio en la vuelta anterior (el mensaje original sí se reenvía siempre) |

---

## Último barrido completo

**17 de septiembre de 2026.**

| Capa | Herramienta | Objetivos leídos | Resultado |
|---|---|---|---|
| Dependencias | Trivy 0.74.0 | 2 archivos de bloqueo, 95 paquetes | 1 alta (`sharp`), solo desarrollo |
| Código | Semgrep 1.177.0 | 53 archivos del repo + 4 de JS extraído de las páginas | sin hallazgos |
| Secretos | Gitleaks 8.30.1 | 66 commits, 770 KB | sin hallazgos |
| Sitio publicado | curl | cabeceras de Pages y del Worker | 3 hallazgos, los tres cerrados |

Nota metodológica que no hay que volver a descubrir: la primera pasada de Trivy
dio cero porque suprime dependencias de desarrollo, y todas las de este proyecto
lo son. La primera de Semgrep dijo «53 archivos» y escaneó **cero** de los HTML,
donde viven 1.494 líneas de JavaScript de cliente.

---

## Trabajo en curso

Verificado contra el sitio en vivo el 21 de septiembre de 2026.

- [x] **Entrada** (hallazgos 5 y 6) — desplegado, commit `43609cc`
- [x] **Umbral** (hallazgo 7) — desplegado; falta que Luis cargue el secreto
- [x] **`security.txt`** (hallazgo 10) — publicado y respondiendo 200
- [ ] **Cabeceras** (hallazgo 9): moverlas a reglas de Cloudflare. La etiqueta `meta` funciona pero `frame-ancestors` no es fiable así, y siguen faltando HSTS, `X-Content-Type-Options` y `Permissions-Policy`
- [ ] **Integración continua** (hallazgo 11): las 46 pruebas existen; falta el flujo que corra las cuatro capas en cada push

### Comprobación en vivo, 21 sep 2026

| Qué | Resultado |
|---|---|
| `https://constata.dev/` | 200 |
| `/.well-known/security.txt` | 200 |
| Política de contenido en la página | presente |
| Huellas de los dos scripts de CDN | presentes |
| `OPTIONS /analizar` con origen hostil | sin permiso |
| Campo imagen con una URL en vez de una imagen | 400 |
| Mensajes revisados hasta hoy | 65 |

### Cambios posteriores que tocaron el endpoint

Cuatro commits del 17 de septiembre cambiaron `worker/analizar.js` después de la revisión: el cuarto
veredicto «contexto», la regla de los avisos de consumo, el arreglo del bucle en la repregunta y la
separación en dos prompts. Ninguno tocó las defensas, pero conviene saber que el archivo se movió.
