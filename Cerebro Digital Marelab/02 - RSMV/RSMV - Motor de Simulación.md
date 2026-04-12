---
tags: [rsmv, motor, simulación, ia, técnico]
created: 2026-04-12
---

# ⚙️ RSMV — Motor de Simulación

[[HOME]] | [[RSMV - Qué Es]] | [[RSMV - Sistema EXP]] | [[Backend API]]

---

## Qué hace el Motor

El motor (`simulator/motor.js`) simula **todo** el juego:
- Penales individuales
- Super Penal 2v2
- Partidos completos (con distribución Poisson)
- Torneos completos (Clasificación + Copa)

---

## Estado

```
✅ 18/18 tests pasados
```

---

## Reglas del Sistema

| Regla | Detalle |
|-------|---------|
| Seed fijo | Resultados reproducibles y auditables |
| Super Penal | UN ganador o NINGUNO (nunca ambos) |
| EXP | Inmediato, nunca disminuye |
| Partido | Siempre arranca 0-0 |
| Goles | Distribución Poisson (λ = 0.25 gol/min) |

---

## El Generador Pseudoaleatorio (PRNG)

Algoritmo: **xorshift32**

```javascript
class PRNG {
  constructor(seed) {
    this.seed = seed ?? Date.now();
    this.state = this.seed;
  }
  next() {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return ((this.state >>> 0) / 4294967296);
  }
}
```

El seed se guarda en la base de datos → cualquier partido es 100% reproducible.

---

## Constantes del Motor

| Constante | Valor |
|-----------|-------|
| Probabilidad gol penal base | 60% |
| Campo de juego | 2m × 3m |
| Jugadores en cancha | 2 por equipo |
| Goles promedio | 0.25 gol/minuto |

---

## Fase 1 — Penales Individuales

- Los 4 jugadores del equipo patean
- Prob. base: 60% (+5% por habilidad del jugador)
- Máximo: 95% de probabilidad
- **Todos ganan EXP** (si anotan o fallan)

---

## Fase 2 — Super Penal 2v2

El DT elige 2 jugadores para correr. Si no hay DT, la IA elige.

**Resultado posible:**
- Nadie anota (33%)
- Equipo A anota (33%)
- Equipo B anota (33%)

> No puede haber empate en Super Penal.

**EXP del Super Penal:**

| Rol | EXP |
|-----|-----|
| Anotador | +4 |
| Compañero de carrera | +3 |
| Rival en carrera | +2 |
| Suplente observando | +1 |

---

## Simulación de Partido

1. Se calcula número de goles (distribución Poisson)
2. Se asignan minutos aleatoriamente
3. Cada gol: se decide quién anota (50/50)
4. 15% de goles son de penal
5. EXP por tiempo en cancha para todos
6. EXP por victoria al equipo ganador
7. MVP: jugador con más EXP acumulado

---

## Fases del Torneo

### Clasificación (16 → 8)
- Partidos de 3 minutos × 2 mitades
- Empate → desempate por Super Penal
- 8 ganadores pasan a la Copa

### Copa (8 → 2 Campeones)
- Dos llaves de 4 equipos
- Semifinales + Final por llave
- 2 campeones salen al siguiente nivel

---

## Cómo correr los tests

```bash
cd rsmv/simulator
node motor.test.js
# → 18/18 tests pasados ✓
```

---

## Relacionado
- [[RSMV - Sistema EXP]]
- [[RSMV - Arquitectura del Ecosistema]]
- [[Base de Datos Schema]]
