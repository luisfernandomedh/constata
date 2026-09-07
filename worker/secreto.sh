#!/bin/bash
# Actualiza UN solo secreto sin tocar los demás.
#
#   bash worker/secreto.sh groq        clave de Groq (modelo)
#   bash worker/secreto.sh github      token de GitHub (issues del corpus)
#   bash worker/secreto.sh cloudflare  token de Cloudflare (despliegue)
#
# Guarda en ~/.constata-secrets y, cuando el secreto lo necesita el Worker,
# lo sube a Cloudflare. Nunca se muestra en pantalla ni queda en el historial.

set -u
DESTINO="$HOME/.constata-secrets"
AQUI="$(cd "$(dirname "$0")" && pwd)"

QUE="${1:-}"
if [ -z "$QUE" ]; then
  echo "¿Cuál secreto quieres actualizar?"
  echo "  bash worker/secreto.sh groq"
  echo "  bash worker/secreto.sh github"
  echo "  bash worker/secreto.sh cloudflare"
  exit 1
fi

case "$QUE" in
  groq)
    LOCAL="GROQ_API_KEY";       WORKER="GROQ_API_KEY"
    DONDE="console.groq.com → API Keys  (groq con Q, no grok)" ;;
  github)
    LOCAL="GH_ISSUES_TOKEN";    WORKER="GITHUB_TOKEN"
    DONDE="github.com/settings/personal-access-tokens/new → solo constata-corpus, Issues: Read and write" ;;
  cloudflare)
    LOCAL="CLOUDFLARE_API_TOKEN"; WORKER=""
    DONDE="dash.cloudflare.com/profile/api-tokens → plantilla «Edit Cloudflare Workers»" ;;
  *)
    echo "No conozco el secreto «$QUE». Usa: groq, github o cloudflare."
    exit 1 ;;
esac

echo "─────────────────────────────────────────────"
echo " Actualizar solo: $QUE"
echo " $DONDE"
echo " Pega y presiona Enter. No vas a ver nada: es a propósito."
echo "─────────────────────────────────────────────"
printf '> '
IFS= read -rs VALOR
printf '\n'
VALOR="$(printf '%s' "$VALOR" | tr -d '[:space:]')"

if [ -z "$VALOR" ]; then
  echo "Vacío. No cambié nada."
  exit 1
fi

# Reescribe el archivo conservando las demás líneas tal cual.
umask 077
touch "$DESTINO"
TMP="$(mktemp)"
grep -v "^export ${LOCAL}=" "$DESTINO" > "$TMP" 2>/dev/null || true
echo "export ${LOCAL}=\"$VALOR\"" >> "$TMP"
mv "$TMP" "$DESTINO"
chmod 600 "$DESTINO"

echo "Guardado en $DESTINO"
echo "  $LOCAL: ${#VALOR} caracteres"
echo "  intactos: $(grep -c '^export ' "$DESTINO") secretos en total"

# Aviso si el prefijo no cuadra: atrapa el pegado a medias.
case "$QUE:$VALOR" in
  groq:gsk_*)        echo "  prefijo correcto (gsk_)" ;;
  groq:*)            echo "  OJO: las claves de Groq empiezan con gsk_ — revisa que la copiaste completa" ;;
  github:github_pat_*) echo "  prefijo correcto (permisos finos)" ;;
  github:ghp_*)      echo "  es un token clásico: funciona, pero da más acceso del necesario" ;;
esac

# El Worker necesita su propia copia; el token de Cloudflare no.
if [ -n "$WORKER" ]; then
  echo
  echo "Subiendo al Worker como $WORKER…"
  export CLOUDFLARE_API_TOKEN="$(grep '^export CLOUDFLARE_API_TOKEN=' "$DESTINO" | sed 's/.*="//;s/"$//')"
  SALIDA="$(cd "$AQUI" && printf '%s' "$VALOR" | npx --yes wrangler secret put "$WORKER" 2>&1)"
  ESTADO=$?
  # Comprobamos de verdad: preguntamos al Worker qué secretos tiene ahora.
  if [ $ESTADO -eq 0 ] && (cd "$AQUI" && npx --yes wrangler secret list 2>/dev/null) | grep -q "\"$WORKER\""; then
    echo "Confirmado: el Worker ya tiene $WORKER."
    echo "Desplegando…"
    (cd "$AQUI" && npx --yes wrangler deploy 2>&1 | tail -3)
  else
    echo "NO se pudo subir. El valor local sí quedó guardado."
    echo "$SALIDA" | tail -5
    exit 1
  fi
fi
