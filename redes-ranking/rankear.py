#!/usr/bin/env python3
"""Ranking de conexiones de LinkedIn e Instagram según afinidad con tus metas.

Solo lee exportaciones locales y genera CSVs. NO se conecta a ninguna red
y NO deja de seguir ni elimina a nadie: solo produce una lista de candidatos
que revisas tú a mano.

Uso:
    python3 rankear.py --config config.json --datos ./datos --salida ./salida
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path


@dataclass
class Persona:
    red: str                     # "linkedin" | "instagram"
    usuario: str                 # nombre visible o @usuario
    url: str = ""
    cargo: str = ""
    empresa: str = ""
    conectado_desde: str = ""    # fecha ISO si la exportación la trae
    sigue_a_mi: bool = False     # Instagram: te sigue
    yo_sigo: bool = False        # Instagram: tú la sigues
    relevancia: int | None = None   # 0-5, la pones tú en notas.csv
    interaccion: int | None = None  # 0-5, la pones tú en notas.csv
    proteger: bool = False       # marcada como "no tocar"
    notas: str = ""
    puntaje: float = 0.0
    motivos: list[str] = field(default_factory=list)

    @property
    def clave(self) -> str:
        return f"{self.red}:{normalizar(self.usuario)}"


# ---------- utilidades ----------

def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", texto).strip().lower()


def leer_json(ruta: Path):
    with ruta.open(encoding="utf-8") as f:
        return json.load(f)


def fecha_desde_timestamp(ts) -> str:
    try:
        return datetime.fromtimestamp(int(ts), tz=timezone.utc).date().isoformat()
    except (TypeError, ValueError, OSError):
        return ""


# ---------- lectores de exportaciones ----------

def leer_linkedin(ruta: Path) -> list[Persona]:
    """Lee Connections.csv de la exportación oficial de LinkedIn.

    LinkedIn pone unas líneas de notas antes del encabezado, así que buscamos
    la línea que empieza con "First Name".
    """
    if not ruta.exists():
        return []
    lineas = ruta.read_text(encoding="utf-8-sig").splitlines()
    inicio = next((i for i, l in enumerate(lineas) if l.startswith("First Name")), None)
    if inicio is None:
        raise ValueError(f"No encuentro el encabezado 'First Name' en {ruta}")

    personas = []
    for fila in csv.DictReader(lineas[inicio:]):
        nombre = f"{fila.get('First Name', '').strip()} {fila.get('Last Name', '').strip()}".strip()
        if not nombre:
            continue
        personas.append(Persona(
            red="linkedin",
            usuario=nombre,
            url=(fila.get("URL") or "").strip(),
            cargo=(fila.get("Position") or "").strip(),
            empresa=(fila.get("Company") or "").strip(),
            conectado_desde=(fila.get("Connected On") or "").strip(),
        ))
    return personas


def _usuarios_de_lista(datos) -> list[tuple[str, str, str]]:
    """Devuelve (usuario, url, fecha) para el formato de Instagram.

    Instagram cambia la estructura según la versión de la exportación, así que
    aceptamos tanto una lista directa como un objeto con una clave que la contiene.
    """
    if isinstance(datos, dict):
        for valor in datos.values():
            if isinstance(valor, list):
                datos = valor
                break
    resultado = []
    for item in datos if isinstance(datos, list) else []:
        entradas = item.get("string_list_data") or []
        primera = entradas[0] if entradas else {}
        usuario = item.get("title") or primera.get("value") or ""
        if not usuario:
            continue
        resultado.append((
            usuario.lstrip("@"),
            primera.get("href", ""),
            fecha_desde_timestamp(primera.get("timestamp")),
        ))
    return resultado


def leer_instagram(carpeta: Path) -> list[Persona]:
    """Lee followers_*.json y following.json de la exportación de Instagram.

    Se buscan dentro de carpeta/ de forma recursiva, así que puedes dejar
    la exportación completa tal como la descargas.
    """
    seguidores = {}
    for ruta in sorted(carpeta.rglob("followers_*.json")):
        for usuario, url, fecha in _usuarios_de_lista(leer_json(ruta)):
            seguidores[normalizar(usuario)] = (usuario, url, fecha)

    seguidos = {}
    for ruta in sorted(carpeta.rglob("following*.json")):
        for usuario, url, fecha in _usuarios_de_lista(leer_json(ruta)):
            seguidos[normalizar(usuario)] = (usuario, url, fecha)

    personas = []
    for clave in set(seguidores) | set(seguidos):
        usuario, url, fecha = seguidores.get(clave) or seguidos[clave]
        personas.append(Persona(
            red="instagram",
            usuario=usuario,
            url=url,
            conectado_desde=fecha,
            sigue_a_mi=clave in seguidores,
            yo_sigo=clave in seguidos,
        ))
    return personas


# ---------- notas manuales ----------

def leer_notas(ruta: Path) -> dict[str, dict]:
    """Lee notas.csv: tu criterio manual por persona.

    Columnas: red, usuario, relevancia (0-5), interaccion (0-5),
    proteger (si/no), notas (texto libre). Las demás columnas se ignoran.
    """
    if not ruta.exists():
        return {}
    notas = {}
    with ruta.open(encoding="utf-8-sig", newline="") as f:
        for fila in csv.DictReader(f):
            red = normalizar(fila.get("red", ""))
            usuario = (fila.get("usuario") or "").strip()
            if not red or not usuario:
                continue
            notas[f"{red}:{normalizar(usuario)}"] = fila
    return notas


def _entero(valor) -> int | None:
    try:
        return max(0, min(5, int(str(valor).strip())))
    except (TypeError, ValueError):
        return None


# ---------- puntaje ----------

def puntuar(p: Persona, cfg: dict) -> None:
    pesos = cfg["pesos"]
    motivos = []

    # 1) Afinidad con tus metas: palabras clave en cargo, empresa y notas.
    texto = normalizar(f"{p.cargo} {p.empresa} {p.notas}")
    hits = [kw for kw in cfg["palabras_clave_metas"] if normalizar(kw) in texto]
    afinidad = min(1.0, len(hits) / max(1, cfg.get("kw_para_maximo", 3)))
    if hits:
        motivos.append(f"metas: {', '.join(hits[:4])}")

    # 2) Relevancia que tú asignas (0-5). Sin nota, cuenta como neutra (2.5).
    relevancia = (p.relevancia if p.relevancia is not None else 2.5) / 5
    if p.relevancia is not None:
        motivos.append(f"relevancia manual {p.relevancia}/5")

    # 3) Interacción real que tú asignas (0-5).
    interaccion = (p.interaccion if p.interaccion is not None else 0) / 5
    if p.interaccion:
        motivos.append(f"interacción {p.interaccion}/5")

    # 4) Señales de reciprocidad en Instagram (te sigue y tú la sigues).
    reciproco = 1.0 if (p.red == "instagram" and p.sigue_a_mi and p.yo_sigo) else 0.0
    if reciproco:
        motivos.append("seguimiento mutuo")

    total = (
        pesos["afinidad"] * afinidad
        + pesos["relevancia"] * relevancia
        + pesos["interaccion"] * interaccion
        + pesos["reciproco"] * reciproco
    )
    p.puntaje = round(100 * total, 1)
    p.motivos = motivos


# ---------- proceso principal ----------

def cargar_config(ruta: Path) -> dict:
    cfg = leer_json(ruta)
    faltan = [k for k in ("pesos", "palabras_clave_metas", "umbral_eliminar", "top_n") if k not in cfg]
    if faltan:
        raise ValueError(f"Faltan claves en la configuración: {faltan}")
    return cfg


def construir(datos: Path, notas_ruta: Path, cfg: dict) -> list[Persona]:
    personas = leer_linkedin(datos / "linkedin" / "Connections.csv")
    personas += leer_instagram(datos / "instagram")

    notas = leer_notas(notas_ruta)
    for p in personas:
        fila = notas.get(p.clave)
        if not fila:
            continue
        p.relevancia = _entero(fila.get("relevancia"))
        p.interaccion = _entero(fila.get("interaccion"))
        p.proteger = normalizar(fila.get("proteger", "")) in {"si", "sí", "yes", "x", "1"}
        p.notas = (fila.get("notas") or "").strip()

    for p in personas:
        puntuar(p, cfg)
    personas.sort(key=lambda p: p.puntaje, reverse=True)
    return personas


CAMPOS = ["puntaje", "red", "usuario", "cargo", "empresa", "url", "conectado_desde",
          "sigue_a_mi", "yo_sigo", "relevancia", "interaccion", "proteger", "notas", "motivos"]


def fila_csv(p: Persona) -> dict:
    return {
        "puntaje": p.puntaje, "red": p.red, "usuario": p.usuario, "cargo": p.cargo,
        "empresa": p.empresa, "url": p.url, "conectado_desde": p.conectado_desde,
        "sigue_a_mi": "si" if p.sigue_a_mi else "", "yo_sigo": "si" if p.yo_sigo else "",
        "relevancia": "" if p.relevancia is None else p.relevancia,
        "interaccion": "" if p.interaccion is None else p.interaccion,
        "proteger": "si" if p.proteger else "", "notas": p.notas,
        "motivos": "; ".join(p.motivos),
    }


def escribir(ruta: Path, filas: list[Persona]) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with ruta.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        for p in filas:
            w.writerow(fila_csv(p))


def main(argv: list[str] | None = None) -> int:
    base = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", type=Path, default=base / "config.json")
    ap.add_argument("--datos", type=Path, default=base / "datos")
    ap.add_argument("--notas", type=Path, default=None, help="Por defecto: <datos>/notas.csv")
    ap.add_argument("--salida", type=Path, default=base / "salida")
    args = ap.parse_args(argv)

    cfg = cargar_config(args.config)
    notas = args.notas or (args.datos / "notas.csv")
    personas = construir(args.datos, notas, cfg)
    if not personas:
        print("No encontré conexiones. Revisa que las exportaciones estén en", args.datos, file=sys.stderr)
        return 1

    top = [p for p in personas if not p.proteger][: cfg["top_n"]]
    # Solo son candidatas las personas que TÚ calificaste y quedaron bajo el umbral.
    # Sin calificación no se sugiere eliminar: se cuentan aparte para que las califiques.
    candidatos = [
        p for p in personas
        if not p.proteger and p.relevancia is not None and p.puntaje < cfg["umbral_eliminar"]
    ]
    candidatos.sort(key=lambda p: p.puntaje)
    sin_calificar = [p for p in personas if p.relevancia is None and not p.proteger]

    escribir(args.salida / "ranking_top.csv", top)
    escribir(args.salida / "candidatos_revisar.csv", candidatos)
    escribir(args.salida / "todas_puntuadas.csv", personas)

    por_red = {}
    for p in personas:
        por_red[p.red] = por_red.get(p.red, 0) + 1
    print(f"Conexiones leídas: {len(personas)} {por_red}")
    print(f"Top {len(top)} -> {args.salida / 'ranking_top.csv'}")
    print(f"Candidatos a revisar (calificadas y puntaje < {cfg['umbral_eliminar']}): {len(candidatos)} "
          f"-> {args.salida / 'candidatos_revisar.csv'}")
    print(f"Sin calificar todavía: {len(sin_calificar)} (agrégalas a notas.csv para evaluarlas)")
    print("Nada se ha eliminado ni dejado de seguir. Revisa la lista y decide tú.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
