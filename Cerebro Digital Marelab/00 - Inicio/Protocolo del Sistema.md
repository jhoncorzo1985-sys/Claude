---
tags: [protocolo, sistema, meta, flujo]
created: 2026-04-12
tipo: meta-nota
---

# 🗺️ Protocolo del Sistema — Cerebro Digital Marelab

[[Baúl de las Ideas]] | [[HOME]]

> *Este documento explica CÓMO funciona el cerebro. Léelo una vez y úsalo siempre.*

---

## El Sistema Completo

```
┌─────────────────────────────────────────────────────────┐
│                  CEREBRO DIGITAL MARELAB                │
│                                                         │
│  1. CAPTURA          2. SEMILLERO         3. MODELO     │
│  ┌──────────┐        ┌───────────┐        ┌──────────┐  │
│  │  Baúl   │──────▶ │   LC      │──────▶ │   BMC    │  │
│  │de Ideas │        │ (validar) │        │(escalar) │  │
│  └──────────┘        └───────────┘        └──────────┘  │
│                                                  │       │
│  4. PROPUESTA DE VALOR                           │       │
│  ┌──────────────────────────────────────────┐   │       │
│  │           BMC-2 validado                 │◀──┘       │
│  └──────────────────────────────────────────┘           │
│                         │                               │
│  5. EJECUCIÓN           ▼                               │
│  ┌──────────────────────────────────────────┐           │
│  │  Roadmap → SOPs → Features → Diario      │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## Las 5 Zonas del Cerebro

### Zona 1 — CAPTURA
**Nota:** [[Baúl de las Ideas]]
**Propósito:** Atrapar ideas antes de que se pierdan.
**Regla:** Sin filtro. Sin formato. Solo escribe.
**Herramienta:** Texto libre en la sección "Ideas en Bruto"

---

### Zona 2 — SEMILLERO
**Carpeta:** `02 - Semillero/`
**Nota central:** [[Semillero de Innovación]]
**Propósito:** Evaluar si una idea vale la pena.
**Herramienta:** [[Lean Canvas (Plantilla)]] — 20 min por idea

Una idea entra al semillero cuando tiene:
- Un problema claro
- Un cliente hipotético
- Una solución posible

Sale del semillero cuando:
- El LC está completo (aunque sea con hipótesis)
- Hay claridad en el "problema N°1"
- Decide: ¿avanzar a BMC o descartar?

---

### Zona 3 — MODELO DE NEGOCIO
**Carpeta:** `03 - Modelos de Negocio/`
**Propósito:** Construir el modelo completo cuando la idea sobrevivió el semillero.
**Herramienta:** [[BMC Marelab]] + los 9 bloques en `01 - BMC/`

Una idea entra al modelo cuando:
- El LC dijo "tiene sentido"
- Hay claridad en los segmentos y la propuesta de valor

---

### Zona 4 — PROPUESTA DE VALOR
**Nota:** [[BMC-2 Propuesta de Valor]]
**Propósito:** La salida validada del semillero. El "qué" definitivo.
**Es el puente** entre el modelo de negocio y la ejecución.

---

### Zona 5 — EJECUCIÓN
**Carpetas:** `06 - Ideas/` + `07 - Procesos/`
**Herramientas:**
- [[Roadmap RSMV]] — qué construir y cuándo
- SOPs (`07 - Procesos/`) — cómo hacer cada cosa
- [[Features Pendientes]] — backlog técnico
- `05 - Diario/` — qué pasó hoy

---

## Dónde Va Cada Cosa

| Tipo de nota | Carpeta |
|--------------|---------|
| Idea bruta nueva | Baúl de las Ideas (sección Ideas en Bruto) |
| Idea en evaluación | `02 - Semillero/` |
| Modelo de negocio completo | `03 - Modelos de Negocio/` |
| Bloques del BMC | `01 - BMC/` |
| Información de la empresa | `04 - Marelab/` (o `01 - Marelab/`) |
| Info del producto (RSMV) | `02 - RSMV/` |
| Código y stack técnico | `03 - Tecnico/` |
| Procesos y SOPs | `07 - Procesos/` |
| Registro diario | `05 - Diario/` |
| Roadmap y futuro | `06 - Ideas/` |

---

## Herramientas por Zona

| Zona | Herramienta | Por qué |
|------|-------------|---------|
| Captura | Texto libre | Sin fricción |
| Semillero | Lean Canvas | Valida hipótesis rápido |
| Modelo | BMC | Construye el negocio completo |
| Propuesta de Valor | BMC-2 | Define el "qué" central |
| Procesos | SOP + Mermaid | Reproducible y mejorable |
| Ejecución | Roadmap + Diario | Controla el avance |

---

## Regla de Oro

> **Una nota = una responsabilidad.**
> Si una nota responde dos preguntas distintas, es dos notas.

---

*Actualizar este protocolo cada vez que el sistema evolucione.*
