"""
Lee los contadores de uso que el Worker guarda en KV y los presenta por día.

Vive aparte del script de métricas a propósito: incrustar Python dentro de
comillas de shell dentro de comillas de curl es una fuente inagotable de
errores tontos, y ya costó uno.

Necesita CLOUDFLARE_API_TOKEN en el entorno.
"""
import collections, json, os, subprocess

KV = "cfe0c3561c724f0d852286b869e2ff8d"
BASE = "https://api.cloudflare.com/client/v4"
TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "")


def pedir(ruta, crudo=False):
    """Se llama a curl y no a urllib: el Python de macOS no trae los
    certificados raíz instalados y falla al verificar el TLS de Cloudflare."""
    salida = subprocess.run(
        ["curl", "-sS", "--max-time", "12", "-H", f"Authorization: Bearer {TOKEN}", f"{BASE}{ruta}"],
        capture_output=True, text=True, check=True).stdout
    return salida if crudo else json.loads(salida)


def main():
    if not TOKEN:
        print("USO · falta CLOUDFLARE_API_TOKEN"); return
    try:
        cuenta = pedir("/accounts")["result"][0]["id"]
        listado = pedir(f"/accounts/{cuenta}/storage/kv/namespaces/{KV}/keys?prefix=m%3A&limit=1000")
    except Exception as e:
        print(f"USO · no pude leer los contadores: {e}"); return
    if not listado.get("success"):
        print("USO · no pude leer los contadores:", json.dumps(listado.get("errors"))[:140]); return

    claves = [k["name"] for k in listado["result"]]
    if not claves:
        print("USO · todavía no hay datos. Los contadores acaban de empezar."); return

    dias = collections.defaultdict(lambda: {"texto": 0, "imagen": 0, "donacion": 0})
    for k in claves:
        _, que, dia = k.split(":", 2)
        if que not in dias[dia]:
            continue
        try:
            dias[dia][que] = int(pedir(f"/accounts/{cuenta}/storage/kv/namespaces/{KV}/values/{k}", crudo=True).strip())
        except Exception:
            pass

    print("USO REAL (sin las pruebas del desarrollo)")
    print("  fecha        análisis   con imagen   donaciones   tasa")
    total_a = total_d = 0
    for dia in sorted(dias):
        x = dias[dia]
        a = x["texto"] + x["imagen"]
        total_a += a
        total_d += x["donacion"]
        tasa = f"{round(x['donacion'] * 100 / a)}%" if a else "—"
        print(f"  {dia}   {a:>8}   {x['imagen']:>10}   {x['donacion']:>10}   {tasa:>5}")
    if total_a:
        print(f"\n  → de cada 100 personas que reciben respuesta, {round(total_d * 100 / total_a)} donan su ejemplo")


if __name__ == "__main__":
    main()
