# Registro de seguridad

Estado vivo de la seguridad de Constata. Lo mantiene el agente `seguridad`.
Se lee entero al empezar cualquier trabajo de seguridad y se actualiza al terminar.

**Última actualización:** 17 de septiembre de 2026

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
| 5 | `worker/analizar.js:202` acepta turnos con rol `assistant` enviados desde el navegador (4 × 2.000 caracteres). Permite fabricar una respuesta previa del modelo que declare legítimo el mensaje | Alta | **Arreglado en local, sin desplegar** (17 sep 2026). `turnosDelCliente()` solo deja pasar rol `user` |
| 6 | El cuerpo de la petición se parsea antes de aplicar cualquier tope; la imagen solo se mide por longitud, sin exigir `data:image/` ni validar tipo | Media | **Arreglado en local, sin desplegar** (17 sep 2026). 413 por `Content-Length` antes de parsear; `data:image/(jpeg\|png\|webp);base64,` obligatorio |
| 7 | Umbral de 100 consultas diarias por conexión antes de que entre el límite horario | Media | **Arreglado en local, sin desplegar** (17 sep 2026). `UMBRAL_DIARIO = 50` y llave `CLAVE_PRUEBA`. **Falta que Luis cargue el secreto** |
| 8 | El contador de KV no es atómico: lee y luego escribe. Peticiones en paralelo saltan el tope | Media | Sin aprobar. Requeriría Durable Objects |
| 9 | La política de contenido va en etiqueta `meta`, no en cabecera HTTP. `frame-ancestors` no es fiable así. Faltan HSTS, `X-Content-Type-Options` y `Permissions-Policy` | Media | Aprobado: mover a reglas de Cloudflare |
| 10 | No existe `/.well-known/security.txt` | Baja | **Escrito en local, sin desplegar** (17 sep 2026). Hace falta `docs/_config.yml` con `include: [".well-known"]`: Jekyll descarta lo que empieza por punto. **Sin comprobar contra el sitio en vivo** |
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

Bloques aprobados por Luis el 17 de septiembre de 2026, sin empezar:

- [x] **Entrada** (hallazgos 5 y 6) — hecho en local el 17 sep 2026, **sin desplegar**
- [x] **Umbral** (hallazgo 7) — hecho en local el 17 sep 2026, **sin desplegar y sin secreto cargado**
- [ ] **Cabeceras** (hallazgo 9): moverlas a reglas de Cloudflare, dejando la etiqueta `meta` como segunda capa
- [x] **`security.txt`** (hallazgo 10) — escrito en local el 17 sep 2026, **sin desplegar**
- [ ] **Pruebas y CI** (hallazgo 11): las pruebas del Worker ya existen (`test/worker-entrada.test.js`); falta el flujo de integración continua que corra las cuatro capas en cada push

### Cambios en local pendientes de que Luis apruebe y despliegue

17 de septiembre de 2026. Nada commiteado, nada en producción.

| Archivo | Qué cambió |
|---|---|
| `worker/analizar.js` | `cuerpoExcesivo()` → 413 por `Content-Length` (tope 6,5 MB) **antes** de `peticion.json()`. `imagenAceptada()` exige `data:image/` con lista blanca jpeg/png/webp. `turnosDelCliente()` descarta todo turno `assistant` del cliente. `UMBRAL_DIARIO` 100 → 50. `conLlaveDePrueba()` + `igualEnTiempoConstante()`: cabecera `X-Constata-Llave` contra el secreto `CLAVE_PRUEBA`, comparada en tiempo constante; exime del cupo, nunca de los contadores |
| `worker/wrangler.toml` | Documentado el secreto `CLAVE_PRUEBA` (solo comentarios) |
| `test/worker-entrada.test.js` | Nuevo. 15 pruebas del endpoint, con la cara negativa y la positiva de cada arreglo. **Ninguna sale a la red**: `globalThis.fetch` se sustituye por un doble que guarda lo que se le habría mandado a Groq |
| `test/security-txt.test.js` | Nuevo. 2 pruebas: campos de RFC 9116 y que no esté caducado. Se pondrá en rojo sola cuando venza |
| `docs/.well-known/security.txt` | Nuevo. Contacto `luisfernandomedhe@gmail.com`, `Expires: 2027-09-17` |
| `docs/_config.yml` | Nuevo. `include: [".well-known"]`, o Jekyll no publica el archivo |

Pasos que le tocan a Luis, en este orden:

```
cd worker && source ~/.constata-secrets && npx wrangler secret put CLAVE_PRUEBA
cd worker && source ~/.constata-secrets && npx wrangler deploy
git add -A && git commit && git push          # publica docs/ en Pages
curl -sS -D- -o /dev/null https://constata.dev/.well-known/security.txt
```

Si esa última línea devuelve 404, Jekyll siguió descartando el directorio: la
alternativa es `docs/.nojekyll`, que hace que Pages copie el sitio tal cual.

**Estado de las pruebas el 17 sep 2026:** `npm test` → 41 pruebas, 41 en verde
(eran 24). `npx wrangler deploy --dry-run` empaqueta sin errores, 30,28 KiB.
