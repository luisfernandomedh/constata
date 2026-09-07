#!/bin/bash
# Cuánto se está usando Constata, ahora mismo. Solo lee, no cambia nada.
#   bash scripts/metricas.sh
set -u
. "$HOME/.constata-secrets"

echo "═══════════════════════════════════════════════"
echo " CONSTATA · $(date '+%d %b %Y, %H:%M')"
echo "═══════════════════════════════════════════════"

# ── 1. Tráfico al servidor (Cloudflare) ──────────────────────────
CUENTA="$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['result'][0]['id'])")"

DESDE="$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)"

curl -s -X POST https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  -d "{\"query\":\"query{viewer{accounts(filter:{accountTag:\\\"$CUENTA\\\"}){workersInvocationsAdaptive(limit:200,filter:{datetime_geq:\\\"$DESDE\\\",scriptName:\\\"constata-aportes\\\"}){sum{requests errors}dimensions{datetimeHour}}}}}\"}" \
| python3 -c "
import sys,json,collections
d=json.load(sys.stdin)
f=d['data']['viewer']['accounts'][0]['workersInvocationsAdaptive']
tot=sum(x['sum']['requests'] for x in f); err=sum(x['sum']['errors'] for x in f)
print(f'\nCONSULTAS · últimas 24 h: {tot}   fallidas: {err}')
h=collections.Counter()
for x in f: h[x['dimensions']['datetimeHour'][11:13]] += x['sum']['requests']
if h:
    pico=max(h.values())
    print('  por hora (UTC):')
    for k in sorted(h)[-12:]:
        print(f'    {k}:00  {\"█\"*max(1,round(h[k]/pico*24)):<24} {h[k]}')
else:
    print('  sin tráfico todavía')
"

# ── 2. Cuota del modelo (Groq) ───────────────────────────────────
echo
if [ -n "${GROQ_API_KEY:-}" ]; then
  curl -s -D - -o /dev/null https://api.groq.com/openai/v1/chat/completions \
    -H "Authorization: Bearer $GROQ_API_KEY" -H "Content-Type: application/json" \
    -d '{"model":"qwen/qwen3.8-27b","messages":[{"role":"user","content":"ok"}],"max_tokens":1}' \
  | python3 -c "
import sys,re
h=dict(re.findall(r'^(x-ratelimit-[a-z-]+): (.+)\$', sys.stdin.read(), re.M|re.I))
lr,rr = int(h.get('x-ratelimit-limit-requests',0)), int(h.get('x-ratelimit-remaining-requests',0))
lt,rt = int(h.get('x-ratelimit-limit-tokens',0)),   int(h.get('x-ratelimit-remaining-tokens',0))
def barra(u,t,n=24):
    p=round(u/t*n) if t else 0
    return '█'*p + '░'*(n-p)
print(f'CUOTA DEL MODELO (Groq, capa gratuita)')
print(f'  hoy:        {barra(lr-rr,lr)} {lr-rr} de {lr} consultas')
print(f'  este minuto:{barra(lt-rt,lt)} {lt-rt} de {lt} tokens')
print(f'  → quedan {rr} consultas. Una imagen gasta ~2 200 tokens.')
"
else
  echo "CUOTA DEL MODELO · sin clave de Groq configurada"
fi

# ── 3. Aportes al corpus ─────────────────────────────────────────
echo
GH_TOKEN="$GH_ISSUES_TOKEN" gh api "repos/luisfernandomedh/constata-corpus/issues?state=all&per_page=100" \
  --jq 'length as $n | "CORPUS · \($n) aportes recibidos en total"' 2>/dev/null \
  || echo "CORPUS · no pude consultarlo"
echo
