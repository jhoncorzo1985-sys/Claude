---
tags: [rsmv, arquitectura, ecosistema, escala]
created: 2026-04-12
---

# 🏗️ RSMV — Arquitectura del Ecosistema

[[HOME]] | [[RSMV - Qué Es]] | [[Marelab - Ecosistema]]

---

## Escala Total del Sistema

| Nivel | Número |
|-------|--------|
| Jugadores totales | **1,024** |
| Equipos | **256** (4 jugadores c/u) |
| Academias | **16** (8 Liga A + 8 Liga B) |
| Torneos Municipales | **16** |
| Torneos Regionales | **2** |
| Torneo Nacional | **1** |

---

## Estructura de un Equipo

```
EQUIPO (4 jugadores)
├── Titular 1  ← Juega desde el inicio
├── Titular 2  ← Juega desde el inicio
├── Suplente 1 ← Entra de cambio
└── Suplente 2 ← Entra de cambio

+ Dueño/Licenciante (1 persona)
+ Director Técnico / DT (1 persona, ≠ jugador)
```

> **Regla crítica:** El DT NO puede ser jugador del mismo equipo.

---

## Pirámide de Torneos

```
       [NACIONAL]
      /           \
  [REGIONAL]  [REGIONAL]
  /   \           /   \
[M] [M] [M] [M] [M] [M] [M] [M]
        (16 Municipales)
```

---

## Las 16 Academias

### Liga A — Antioquia
| # | Academia | Ciudad |
|---|----------|--------|
| 1 | Academia Medellín Norte | Medellín |
| 2 | Academia Medellín Sur | Medellín |
| 3 | Academia Bello | Bello |
| 4 | Academia Itagüí | Itagüí |
| 5 | Academia Envigado | Envigado |
| 6 | Academia La Estrella | La Estrella |
| 7 | Academia Caldas | Caldas |
| 8 | Academia Copacabana | Copacabana |

### Liga B — Nacional
| # | Academia | Ciudad |
|---|----------|--------|
| 9 | Academia Bogotá Norte | Bogotá |
| 10 | Academia Bogotá Sur | Bogotá |
| 11 | Academia Cali | Cali |
| 12 | Academia Barranquilla | Barranquilla |
| 13 | Academia Bucaramanga | Bucaramanga |
| 14 | Academia Pereira | Pereira |
| 15 | Academia Manizales | Manizales |
| 16 | Academia Cartagena | Cartagena |

---

## Roles de Usuario

| Rol | Puede ser también |
|-----|------------------|
| Jugador Titular | Dueño del equipo |
| Jugador Suplente | Dueño del equipo |
| Dueño/Licenciante | Jugador de su equipo |
| Director Técnico | Jugador de OTRO equipo |

---

## Relacionado
- [[RSMV - Qué Es]]
- [[RSMV - Torneos y Premios]]
- [[RSMV - Sistema EXP]]
- [[Marelab - Ecosistema]]
