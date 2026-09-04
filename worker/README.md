# Receptor de contribuciones

Un Worker de Cloudflare de una sola función: recibir un mensaje aportado desde la web y crear un issue en el repositorio del corpus. Existe para que aportar sea **un clic, sin cuenta de GitHub**.

## Por qué hace falta

El token de GitHub no puede vivir en el navegador: cualquiera lo vería en el código y lo usaría. El Worker es el único que lo tiene.

## Qué NO hace

- No guarda el mensaje. Lo reenvía y se olvida.
- No guarda la IP. La usa solo como huella efímera para el contador de límite.
- No mete nada al corpus directamente. Crea un issue, que es la cola de moderación.

## Defensas

Quitar el requisito de cuenta de GitHub también se lo quita a los bots. Por eso:

| Defensa | Qué frena |
|---|---|
| Límite de 5 aportes por origen y hora | Inundación desde una sola fuente |
| Turnstile (opcional) | Bots automatizados, invisible para personas |
| Largo máximo de 4000 caracteres | Cargas grandes |
| Rechazo de enlaces activos | Que el corpus publique phishing clicable |
| Listas cerradas en cada campo | Valores inventados en etiqueta, canal, etc. |
| Limpieza de caracteres de control | Trucos de escape en el texto |
| Token con permiso solo de issues, solo en el corpus | Que un token filtrado sirva de algo |
| Errores genéricos hacia afuera | Filtrar detalle interno a quien sondea |

La revalidación del enlace desactivado se hace **de nuevo** aquí, aunque el cliente ya lo hizo: el cliente es reemplazable por cualquiera con `curl`.

## Desplegar

El repositorio del corpus ya existe: [constata-corpus](https://github.com/luisfernandomedh/constata-corpus).
`wrangler` ya está instalado aquí, así que no hace falta `npx`.

**1. Crear el token de GitHub**

En Settings → Developer settings → Personal access tokens → **Fine-grained tokens**:

- Repository access: **solo** `constata-corpus`
- Permisos: `Issues: Read and write`. Nada más.
- Vencimiento: el más corto que tolere tu ritmo de renovación.

Si ese token se filtra, lo peor que puede hacer alguien es abrir issues en un repositorio de mensajes públicos. Eso es todo, y es a propósito.

**2. Desplegar**

```bash
cd worker
npm run login                    # abre el navegador, entra a Cloudflare
npm run kv                       # pega el id que devuelve en wrangler.toml
npm run secreto                  # pega el token de GitHub
npm run deploy
```

**3. Conectar la web**

En `docs/index.html`, poner la URL que devolvió el despliegue:

```js
const ENDPOINT = "https://constata-aportes.TU-SUBDOMINIO.workers.dev";
```

Mientras `ENDPOINT` esté vacío, la web cae de vuelta al formulario de GitHub. Nada se rompe.

## Costo

Capa gratuita de Cloudflare Workers: 100 000 peticiones diarias. Para este uso, es gratis indefinidamente.
