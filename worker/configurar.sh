#!/bin/bash
# Pide los dos tokens y los guarda en ~/.constata-secrets.
# No se muestran al escribirlos ni quedan en el historial de la terminal.

set -u
DESTINO="$HOME/.constata-secrets"

pedir() {
  local etiqueta="$1" pista="$2" valor=""
  while [ -z "$valor" ]; do
    printf '\n%s\n  %s\n> ' "$etiqueta" "$pista" >&2
    IFS= read -rs valor
    printf '\n' >&2
    # Quita espacios y saltos que suelen colarse al pegar
    valor="$(printf '%s' "$valor" | tr -d '[:space:]')"
    [ -z "$valor" ] && printf '  (vacío, inténtalo de nuevo)\n' >&2
  done
  printf '%s' "$valor"
}

echo "─────────────────────────────────────────────"
echo " Configuración de Constata"
echo " Pega cada token y presiona Enter."
echo " No vas a ver lo que escribes: es a propósito."
echo "─────────────────────────────────────────────"

CF="$(pedir "1/2 · Token de Cloudflare" "dash.cloudflare.com/profile/api-tokens → plantilla «Edit Cloudflare Workers»")"
GH="$(pedir "2/2 · Token de GitHub" "github.com/settings/personal-access-tokens/new → solo constata-corpus, permiso Issues: Read and write")"

umask 077
{
  echo "export CLOUDFLARE_API_TOKEN=\"$CF\""
  echo "export GH_ISSUES_TOKEN=\"$GH\""
} > "$DESTINO"
chmod 600 "$DESTINO"

echo
echo "Guardado en $DESTINO"
echo "  permisos:   $(stat -f '%Sp' "$DESTINO")"
echo "  Cloudflare: ${#CF} caracteres"
echo -n "  GitHub:     ${#GH} caracteres"
case "$GH" in
  github_pat_*) echo "  (prefijo correcto)" ;;
  ghp_*)        echo "  (ojo: es un token clásico, no uno de permisos finos — funciona, pero da más acceso del necesario)" ;;
  *)            echo "  (prefijo inesperado, revisa que lo copiaste completo)" ;;
esac
echo
echo "Listo. Dile a Claude que ya está y él sigue desde aquí."
