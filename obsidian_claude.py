"""
╔══════════════════════════════════════════════════════════════════╗
║         OBSIDIAN + CLAUDE — Integración Inteligente             ║
║         Jhon Carlos Corzo Vega                                   ║
║                                                                  ║
║  Conecta tu vault de Obsidian con Claude AI para:               ║
║   📖 Leer y analizar notas                                       ║
║   💡 Generar nuevas notas inteligentes                           ║
║   🔍 Buscar y resumir contenido                                  ║
║   🤖 Chat contextual sobre tus apuntes                           ║
╚══════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import glob
from pathlib import Path
import anthropic

# ── Configuración ────────────────────────────────────────────────
# Ruta del vault RSMV en Android — también se puede sobreescribir con:
#   export OBSIDIAN_VAULT="/otra/ruta"
#   python obsidian_claude.py --vault "/otra/ruta" <comando>
VAULT_ANDROID = "/storage/emulated/0/Download/RSMV_Obsidian_Vault/Ecosistema Marelab Celular"
VAULT_PATH = os.environ.get("OBSIDIAN_VAULT", VAULT_ANDROID)
MODEL = "claude-opus-4-6"
MAX_TOKENS = 16000


# ── Lectura del vault ────────────────────────────────────────────

def listar_notas(vault: str) -> list[dict]:
    """Devuelve todas las notas .md del vault con su ruta relativa."""
    base = Path(vault)
    notas = []
    for md in sorted(base.rglob("*.md")):
        relativa = md.relative_to(base)
        notas.append({"ruta": str(relativa), "absoluta": str(md)})
    return notas


def leer_nota(ruta_absoluta: str) -> str:
    """Lee el contenido de una nota."""
    with open(ruta_absoluta, encoding="utf-8") as f:
        return f.read()


def guardar_nota(vault: str, nombre: str, contenido: str) -> str:
    """Guarda (o sobreescribe) una nota en el vault y devuelve la ruta."""
    if not nombre.endswith(".md"):
        nombre += ".md"
    ruta = Path(vault) / nombre
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(contenido, encoding="utf-8")
    return str(ruta)


# ── Helpers de contexto ──────────────────────────────────────────

def construir_contexto(notas: list[dict], max_chars: int = 80_000) -> str:
    """Concatena el contenido de las notas hasta el límite de caracteres."""
    bloques = []
    total = 0
    for nota in notas:
        contenido = leer_nota(nota["absoluta"])
        bloque = f"## {nota['ruta']}\n\n{contenido}\n\n---\n\n"
        if total + len(bloque) > max_chars:
            bloques.append(
                f"## {nota['ruta']}\n\n*(nota omitida — límite de contexto alcanzado)*\n\n---\n\n"
            )
            break
        bloques.append(bloque)
        total += len(bloque)
    return "".join(bloques)


# ── Funciones principales ────────────────────────────────────────

def resumir_vault(vault: str) -> str:
    """Resume todo el contenido del vault."""
    notas = listar_notas(vault)
    if not notas:
        return "⚠️  Vault vacío o no encontrado."

    contexto = construir_contexto(notas)
    client = anthropic.Anthropic()

    print(f"📚 Analizando {len(notas)} nota(s)...\n")

    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=(
            "Eres un asistente experto en gestión del conocimiento. "
            "El usuario te proporciona el contenido completo de su vault de Obsidian. "
            "Responde siempre en español, de forma clara y estructurada."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Aquí está el contenido de mi vault de Obsidian:\n\n{contexto}\n\n"
                    "Por favor, haz un resumen ejecutivo del vault: temas principales, "
                    "ideas recurrentes y conexiones entre notas."
                ),
            }
        ],
    ) as stream:
        respuesta = ""
        for texto in stream.text_stream:
            print(texto, end="", flush=True)
            respuesta += texto
    print()
    return respuesta


def chat_con_vault(vault: str) -> None:
    """Chat interactivo contextualizado en el vault."""
    notas = listar_notas(vault)
    contexto = construir_contexto(notas) if notas else ""
    client = anthropic.Anthropic()
    historial: list[dict] = []

    sistema = (
        "Eres un asistente inteligente conectado al vault de Obsidian del usuario. "
        "Conoces todo el contenido de sus notas y puedes ayudarle a encontrar información, "
        "generar nuevas ideas y crear nuevas notas. Responde siempre en español."
    )
    if contexto:
        sistema += f"\n\n--- CONTENIDO DEL VAULT ---\n\n{contexto}"

    print("🤖 Chat con tu vault activo. Escribe 'salir' para terminar.\n")

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
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=sistema,
            messages=historial,
        ) as stream:
            print("Claude: ", end="", flush=True)
            respuesta = ""
            for texto in stream.text_stream:
                print(texto, end="", flush=True)
                respuesta += texto
        print("\n")

        historial.append({"role": "assistant", "content": respuesta})


def crear_nota_ia(vault: str, tema: str) -> str:
    """Genera una nota nueva sobre el tema dado y la guarda en el vault."""
    client = anthropic.Anthropic()
    notas = listar_notas(vault)
    contexto_existente = construir_contexto(notas, max_chars=40_000) if notas else ""

    contexto_msg = ""
    if contexto_existente:
        contexto_msg = (
            f"El vault ya contiene las siguientes notas:\n\n{contexto_existente}\n\n"
            "Considera estas notas para enriquecer y conectar la nueva nota."
        )

    print(f"✍️  Generando nota sobre '{tema}'...\n")

    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=(
            "Eres un experto creador de notas en formato Obsidian Markdown. "
            "Crea notas bien estructuradas con frontmatter YAML, encabezados, "
            "listas y [[wikilinks]] cuando corresponda. Responde solo con el contenido "
            "de la nota, sin explicaciones adicionales."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"{contexto_msg}\n\n"
                    f"Crea una nota completa y detallada sobre el siguiente tema: **{tema}**"
                ),
            }
        ],
    ) as stream:
        contenido = ""
        for texto in stream.text_stream:
            print(texto, end="", flush=True)
            contenido += texto
    print()

    nombre_archivo = tema.replace(" ", "_").replace("/", "-")[:60]
    ruta = guardar_nota(vault, nombre_archivo, contenido)
    print(f"\n✅ Nota guardada en: {ruta}")
    return ruta


def buscar_en_vault(vault: str, consulta: str) -> str:
    """Busca información relevante en el vault usando Claude."""
    notas = listar_notas(vault)
    if not notas:
        return "⚠️  Vault vacío o no encontrado."

    contexto = construir_contexto(notas)
    client = anthropic.Anthropic()

    print(f"🔍 Buscando '{consulta}' en {len(notas)} nota(s)...\n")

    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=(
            "Eres un asistente de búsqueda inteligente. "
            "Analiza el vault de Obsidian y encuentra la información más relevante. "
            "Cita las notas fuente usando el formato [[nombre_nota]]. Responde en español."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Vault de Obsidian:\n\n{contexto}\n\n"
                    f"Consulta: {consulta}"
                ),
            }
        ],
    ) as stream:
        respuesta = ""
        for texto in stream.text_stream:
            print(texto, end="", flush=True)
            respuesta += texto
    print()
    return respuesta


# ── CLI ──────────────────────────────────────────────────────────

def mostrar_ayuda():
    print("""
╔═══════════════════════════════════════════════════════════╗
║          OBSIDIAN + CLAUDE  — Comandos disponibles        ║
╠═══════════════════════════════════════════════════════════╣
║  python obsidian_claude.py listar                         ║
║      → Lista todas las notas del vault                    ║
║                                                           ║
║  python obsidian_claude.py resumir                        ║
║      → Resumen inteligente de todo el vault               ║
║                                                           ║
║  python obsidian_claude.py chat                           ║
║      → Chat interactivo contextualizado                   ║
║                                                           ║
║  python obsidian_claude.py crear "tema de la nota"        ║
║      → Genera y guarda una nota nueva con IA              ║
║                                                           ║
║  python obsidian_claude.py buscar "consulta"              ║
║      → Búsqueda semántica en el vault                     ║
║                                                           ║
║  python obsidian_claude.py --vault "/ruta" <comando>      ║
║      → Usar un vault diferente                            ║
╠═══════════════════════════════════════════════════════════╣
║  Vault por defecto (Android/RSMV):                        ║
║  /storage/emulated/0/Download/                            ║
║    RSMV_Obsidian_Vault/Ecosistema Marelab Celular         ║
║                                                           ║
║  Sobreescribir: export OBSIDIAN_VAULT="/ruta"             ║
║  API key:       export ANTHROPIC_API_KEY="sk-..."         ║
╚═══════════════════════════════════════════════════════════╝
""")


def main():
    args = sys.argv[1:]

    # Soporte para --vault "/ruta/al/vault" como primer argumento
    if args and args[0] == "--vault":
        if len(args) < 2:
            print("❌ Uso: python obsidian_claude.py --vault \"/ruta/vault\" <comando>")
            sys.exit(1)
        vault = args[1]
        args = args[2:]
    else:
        vault = VAULT_PATH

    if not args or args[0] in ("-h", "--help", "ayuda"):
        mostrar_ayuda()
        print(f"  Vault activo: {vault}\n")
        return

    # Verificar que el vault existe
    if not Path(vault).exists():
        print(f"⚠️  Vault no encontrado: {vault}")
        print("   Asegúrate de que la ruta existe o define $OBSIDIAN_VAULT\n")

    cmd = args[0].lower()

    if cmd == "listar":
        notas = listar_notas(vault)
        if not notas:
            print(f"⚠️  No se encontraron notas en: {vault}")
        else:
            print(f"\n📂 Vault: {vault}\n")
            for n in notas:
                print(f"  📄 {n['ruta']}")
            print(f"\n  Total: {len(notas)} nota(s)\n")

    elif cmd == "resumir":
        resumir_vault(vault)

    elif cmd == "chat":
        chat_con_vault(vault)

    elif cmd == "crear":
        if len(args) < 2:
            print("❌ Uso: python obsidian_claude.py crear \"tema de la nota\"")
            sys.exit(1)
        crear_nota_ia(vault, " ".join(args[1:]))

    elif cmd == "buscar":
        if len(args) < 2:
            print("❌ Uso: python obsidian_claude.py buscar \"consulta\"")
            sys.exit(1)
        buscar_en_vault(vault, " ".join(args[1:]))

    else:
        print(f"❌ Comando desconocido: {cmd}")
        mostrar_ayuda()
        sys.exit(1)


if __name__ == "__main__":
    main()
