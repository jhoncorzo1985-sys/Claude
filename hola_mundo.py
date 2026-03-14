"""
╔══════════════════════════════════════════════════════════════════╗
║         HOLA MUNDO — Jhon Carlos Corzo Vega                     ║
║         Creador | Emprendedor | Visionario                       ║
║                                                                  ║
║  Proyectos:                                                      ║
║   🤖 Robot Soccer Mare — Ecosistema de fútbol con robots        ║
║   🌸 Desfile de Robots Silleteros — Tradición + Tecnología      ║
║                                                                  ║
║  Superpoder: La Creatividad                                      ║
╚══════════════════════════════════════════════════════════════════╝
"""

CREADOR = "Jhon Carlos Corzo Vega"
SUPERPODER = "Creatividad"

PROYECTOS = {
    "Robot Soccer Mare": {
        "descripcion": "Ecosistema de fútbol con robots",
        "vision": "Democratizar la robótica a través del deporte más popular del mundo",
        "tecnologias": ["Robótica", "IA", "Visión por computador", "Claude AI"],
    },
    "Desfile de Robots Silleteros": {
        "descripcion": "Fusión entre tradición colombiana y tecnología de punta",
        "vision": "Preservar la cultura silletera llevándola al futuro con robots",
        "tecnologias": ["Robótica autónoma", "Diseño creativo", "Cultura colombiana"],
    },
}


def presentacion():
    print("=" * 60)
    print(f"  ¡Hola Mundo! Soy {CREADOR}")
    print(f"  Mi superpoder es: {SUPERPODER}")
    print("=" * 60)

    for nombre, proyecto in PROYECTOS.items():
        print(f"\n🚀 Proyecto: {nombre}")
        print(f"   📌 {proyecto['descripcion']}")
        print(f"   💡 Visión: {proyecto['vision']}")
        print(f"   🛠  Stack: {', '.join(proyecto['tecnologias'])}")

    print("\n" + "=" * 60)
    print("  Con Claude Code + Creatividad, el límite no existe.")
    print("=" * 60)


if __name__ == "__main__":
    presentacion()
