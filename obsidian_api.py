"""
╔══════════════════════════════════════════════════════════════════╗
║   OBSIDIAN LOCAL REST API + CLAUDE — Sin Termux                 ║
║   Jhon Carlos Corzo Vega                                         ║
║                                                                  ║
║  Controla Obsidian desde cualquier PC/Mac en la misma red WiFi  ║
║  usando el plugin "Local REST API" + Claude AI                   ║
║                                                                  ║
║  Requisito: plugin "Local REST API" activo en Obsidian          ║
╚══════════════════════════════════════════════════════════════════╝

CONFIGURACIÓN RÁPIDA
────────────────────
1. En Obsidian → Ajustes → Plugins de la comunidad → buscar "Local REST API"
2. Activarlo y copiar el API Key que genera
3. Anotar la IP de tu celular (Ajustes → WiFi → detalles de la red)
4. Ejecutar este script desde tu PC:

   export OBSIDIAN_API_KEY="tu-api-key-del-plugin"
   export OBSIDIAN_HOST="192.168.x.x"   # IP de tu celular
   export ANTHROPIC_API_KEY="sk-ant-..."
   python obsidian_api.py listar
"""

import os
import sys
import json
import urllib.request
import urllib.error
import ssl
import datetime
import anthropic

# ── Configuración ────────────────────────────────────────────────
OBSIDIAN_HOST = os.environ.get("OBSIDIAN_HOST", "127.0.0.1")
OBSIDIAN_PORT = int(os.environ.get("OBSIDIAN_PORT", "27123"))   # 27123=HTTPS / 27124=HTTP
OBSIDIAN_API_KEY = os.environ.get("OBSIDIAN_API_KEY", "")
VAULT_SUBPATH = os.environ.get(
    "OBSIDIAN_VAULT_SUBPATH",
    "Ecosistema Marelab Celular"   # subcarpeta raíz dentro del vault
)
MODEL = "claude-opus-4-6"
MAX_TOKENS = 16000

# SSL: el plugin usa certificado autofirmado → lo ignoramos
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE

BASE_URL = f"https://{OBSIDIAN_HOST}:{OBSIDIAN_PORT}"


# ── HTTP helpers ─────────────────────────────────────────────────

def _headers(extra: dict | None = None) -> dict:
    h = {
        "Authorization": f"Bearer {OBSIDIAN_API_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def _request(method: str, path: str, body: bytes | None = None,
             content_type: str = "application/json") -> tuple[int, bytes]:
    """Realiza una petición HTTP a la API de Obsidian."""
    url = f"{BASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {OBSIDIAN_API_KEY}",
        "Content-Type": content_type,
    }
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=SSL_CONTEXT, timeout=10) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except urllib.error.URLError as e:
        print(f"❌ No se puede conectar a Obsidian en {BASE_URL}")
        print(f"   Causa: {e.reason}")
        print("   ¿Está Obsidian abierto y el plugin Local REST API activo?")
        sys.exit(1)


def _get(path: str):
    status, data = _request("GET", path)
    if status == 200:
        return json.loads(data)
    return None


def _put(path: str, contenido: str):
    body = contenido.encode("utf-8")
    status, _ = _request("PUT", path, body=body, content_type="text/markdown")
    return status in (200, 201, 204)


def _delete(path: str):
    status, _ = _request("DELETE", path)
    return status in (200, 204)


# ── API de Obsidian ──────────────────────────────────────────────

def listar_notas(subpath: str = "") -> list[dict]:
    """Lista archivos en el vault (o en un subdirectorio)."""
    ruta = f"/vault/{urllib.parse.quote(subpath)}/" if subpath else "/vault/"
    datos = _get(ruta)
    if not datos:
        return []
    archivos = datos.get("files", [])
    return [{"ruta": f} for f in archivos if f.endswith(".md")]


def leer_nota(ruta: str) -> str:
    """Lee el contenido de una nota."""
    status, data = _request("GET", f"/vault/{urllib.parse.quote(ruta)}")
    if status == 200:
        return data.decode("utf-8")
    return ""


def guardar_nota(ruta: str, contenido: str) -> bool:
    """Crea o actualiza una nota. La ruta es relativa al vault."""
    encoded = urllib.parse.quote(ruta)
    return _put(f"/vault/{encoded}", contenido)


def crear_carpeta_con_indice(nombre: str, subpath: str = "") -> bool:
    """
    Crea una carpeta creando una nota índice dentro de ella.
    En Obsidian, las carpetas existen cuando tienen al menos un archivo.
    """
    if subpath:
        ruta_nota = f"{subpath}/{nombre}/indice.md"
    else:
        ruta_nota = f"{nombre}/indice.md"

    contenido = f"""---
titulo: {nombre}
tipo: carpeta-indice
creado: {datetime.date.today()}
tags: [carpeta, claude-ai]
---

# {nombre}

> 📁 Carpeta creada automáticamente por **Claude AI**

## Notas en esta sección

*(agrega notas aquí y se enlazarán en el grafo)*

## Conexiones

- [[Ecosistema Marelab Celular]]
"""
    ok = guardar_nota(ruta_nota, contenido)
    return ok


def buscar_notas(consulta: str) -> list[dict]:
    """Búsqueda simple en el vault."""
    import urllib.parse
    q = urllib.parse.quote(consulta)
    datos = _get(f"/search/simple/?query={q}&contextLength=200")
    if not datos:
        return []
    return datos if isinstance(datos, list) else []


# ── Integración con Claude ───────────────────────────────────────

def _construir_contexto(notas: list[dict], max_chars: int = 60_000) -> str:
    bloques = []
    total = 0
    for nota in notas:
        contenido = leer_nota(nota["ruta"])
        bloque = f"## {nota['ruta']}\n\n{contenido}\n\n---\n\n"
        if total + len(bloque) > max_chars:
            break
        bloques.append(bloque)
        total += len(bloque)
    return "".join(bloques)


def resumir_vault(subpath: str = "") -> None:
    notas = listar_notas(subpath)
    if not notas:
        print("⚠️  No se encontraron notas.")
        return
    contexto = _construir_contexto(notas)
    client = anthropic.Anthropic()
    print(f"📚 Analizando {len(notas)} nota(s) via REST API...\n")
    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=(
            "Eres un asistente experto en gestión del conocimiento. "
            "Analiza el vault de Obsidian y responde en español."
        ),
        messages=[{"role": "user", "content": (
            f"Vault:\n\n{contexto}\n\n"
            "Haz un resumen ejecutivo: temas principales, ideas recurrentes y conexiones."
        )}],
    ) as stream:
        for texto in stream.text_stream:
            print(texto, end="", flush=True)
    print()


def crear_nota_ia(tema: str, subpath: str = "") -> None:
    client = anthropic.Anthropic()
    notas = listar_notas(subpath)
    contexto = _construir_contexto(notas, max_chars=30_000) if notas else ""
    ctx_msg = (
        f"El vault ya contiene:\n\n{contexto}\n\nConéctala con notas existentes.\n\n"
        if contexto else ""
    )
    print(f"✍️  Generando nota sobre '{tema}'...\n")
    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=(
            "Crea notas Obsidian con frontmatter YAML, encabezados, listas y [[wikilinks]]. "
            "Devuelve solo el contenido Markdown, sin explicaciones."
        ),
        messages=[{"role": "user", "content": (
            f"{ctx_msg}Crea una nota detallada sobre: **{tema}**"
        )}],
    ) as stream:
        contenido = ""
        for texto in stream.text_stream:
            print(texto, end="", flush=True)
            contenido += texto
    print()

    nombre_archivo = tema.replace(" ", "_").replace("/", "-")[:60] + ".md"
    ruta = f"{subpath}/{nombre_archivo}" if subpath else nombre_archivo
    if guardar_nota(ruta, contenido):
        print(f"\n✅ Nota guardada en Obsidian: {ruta}")
    else:
        print("\n❌ Error al guardar la nota.")


def chat_con_vault(subpath: str = "") -> None:
    notas = listar_notas(subpath)
    contexto = _construir_contexto(notas) if notas else ""
    client = anthropic.Anthropic()
    historial: list[dict] = []
    sistema = (
        "Eres un asistente conectado al vault de Obsidian del usuario. "
        "Responde siempre en español."
    )
    if contexto:
        sistema += f"\n\n--- VAULT ---\n\n{contexto}"

    print("🤖 Chat activo. Escribe 'salir' para terminar.\n")
    while True:
        try:
            pregunta = input("Tú: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n👋 Hasta luego.")
            break
        if pregunta.lower() in ("salir", "exit", "quit"):
            print("👋 Hasta luego.")
            break
        if not pregunta:
            continue
        historial.append({"role": "user", "content": pregunta})
        with client.messages.stream(
            model=MODEL, max_tokens=MAX_TOKENS,
            system=sistema, messages=historial,
        ) as stream:
            print("Claude: ", end="", flush=True)
            respuesta = ""
            for texto in stream.text_stream:
                print(texto, end="", flush=True)
                respuesta += texto
        print("\n")
        historial.append({"role": "assistant", "content": respuesta})


# ── Verificar conexión ───────────────────────────────────────────

def verificar_conexion() -> bool:
    """Comprueba que el plugin está accesible."""
    status, _ = _request("GET", "/")
    ok = status == 200
    if ok:
        print(f"✅ Conectado a Obsidian en {BASE_URL}")
    else:
        print(f"❌ No se pudo conectar (HTTP {status})")
    return ok


# ── CLI ──────────────────────────────────────────────────────────

import urllib.parse   # noqa: E402 — se usa arriba también


def mostrar_ayuda():
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║       OBSIDIAN REST API + CLAUDE — Comandos               ║
╠═══════════════════════════════════════════════════════════╣
║  python obsidian_api.py ping                              ║
║      → Verifica conexión con Obsidian                     ║
║                                                           ║
║  python obsidian_api.py listar                            ║
║      → Lista notas del vault                              ║
║                                                           ║
║  python obsidian_api.py carpeta "nombre"                  ║
║      → Crea carpeta + nota índice (aparece en el grafo)   ║
║                                                           ║
║  python obsidian_api.py crear "tema"                      ║
║      → Genera nota con IA y la guarda en Obsidian         ║
║                                                           ║
║  python obsidian_api.py resumir                           ║
║      → Resumen inteligente del vault                      ║
║                                                           ║
║  python obsidian_api.py chat                              ║
║      → Chat interactivo sobre tus notas                   ║
╠═══════════════════════════════════════════════════════════╣
║  Variables de entorno:                                    ║
║    OBSIDIAN_HOST=192.168.x.x  (IP de tu celular)          ║
║    OBSIDIAN_PORT=27123         (o 27124 para HTTP)         ║
║    OBSIDIAN_API_KEY=xxx        (del plugin)                ║
║    OBSIDIAN_VAULT_SUBPATH=...  (subcarpeta raíz)           ║
║    ANTHROPIC_API_KEY=sk-ant-...                            ║
╚═══════════════════════════════════════════════════════════╝
  Host activo: {BASE_URL}
""")


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "ayuda"):
        mostrar_ayuda()
        return

    cmd = args[0].lower()
    subpath = VAULT_SUBPATH

    if cmd == "ping":
        verificar_conexion()

    elif cmd == "listar":
        notas = listar_notas(subpath)
        if not notas:
            print(f"⚠️  No hay notas en '{subpath}'")
        else:
            print(f"\n📂 {subpath}\n")
            for n in notas:
                print(f"  📄 {n['ruta']}")
            print(f"\n  Total: {len(notas)} nota(s)\n")

    elif cmd == "carpeta":
        nombre = " ".join(args[1:]) if len(args) > 1 else "prueba claude"
        print(f"📁 Creando carpeta '{nombre}' en Obsidian...")
        if crear_carpeta_con_indice(nombre, subpath):
            print(f"✅ Carpeta '{nombre}' creada. Abre Obsidian para verla en el grafo.")
        else:
            print("❌ Error al crear la carpeta.")

    elif cmd == "crear":
        if len(args) < 2:
            print("❌ Uso: python obsidian_api.py crear \"tema\"")
            sys.exit(1)
        crear_nota_ia(" ".join(args[1:]), subpath)

    elif cmd == "resumir":
        resumir_vault(subpath)

    elif cmd == "chat":
        chat_con_vault(subpath)

    elif cmd == "buscar":
        if len(args) < 2:
            print("❌ Uso: python obsidian_api.py buscar \"consulta\"")
            sys.exit(1)
        resultados = buscar_notas(" ".join(args[1:]))
        if not resultados:
            print("Sin resultados.")
        else:
            for r in resultados:
                print(f"\n📄 {r.get('filename', '?')}")
                print(f"   {r.get('context', '')}")

    else:
        print(f"❌ Comando desconocido: {cmd}")
        mostrar_ayuda()
        sys.exit(1)


if __name__ == "__main__":
    main()
