---
tags: [rsmv, torneos, premios, dinero, competencia]
created: 2026-04-12
---

# 🏆 RSMV — Torneos y Premios

[[HOME]] | [[RSMV - Qué Es]] | [[RSMV - Arquitectura del Ecosistema]]

---

## Estructura de Torneos

```
[16 Torneos Municipales] → 16 Campeones
         ↓
[2 Torneos Regionales] → 2 Campeones  
         ↓
[1 Torneo Nacional] → 1 CAMPEÓN ABSOLUTO
```

---

## Tipos de Torneo

| Tipo | Descripción |
|------|-------------|
| `municipal` | Por academia/ciudad |
| `regional` | 8 equipos por región |
| `nacional` | Los mejores del país |

---

## Modos de Torneo

| Modo | Descripción |
|------|-------------|
| `evento` | Torneo programado en fecha |
| `express` | Torneo rápido sin esperas |

---

## Fases de cada Torneo

| Fase | Descripción |
|------|-------------|
| Entrenamiento | Penales + SP + partido vs fantasma |
| Clasificación | 16 equipos → 8 (por partidos) |
| Copa | 8 equipos → 2 campeones (eliminatoria) |

---

## Premios en Dinero (COP)

| Posición | Premio |
|----------|--------|
| 🥇 Nacional 1° | **$4,000,000 COP** |
| 🥈 Nacional 2° | **$2,500,000 COP** |
| 🏆 Regional Campeón (×2) | **$400,000 COP** c/u |
| 🥇 Municipal Campeón (×16) | **$100,000 COP** c/u |

**Total máximo en premios:** ~$7,700,000 COP por ciclo completo

---

## Premio por Municipales (16 × $100k)
$1,600,000 COP total en municipales

## Premio por Regionales (2 × $400k)
$800,000 COP total en regionales

## Premio por Nacional
$6,500,000 COP en nacional (1° + 2°)

---

## EXP por Resultados de Torneo

| Resultado | Municipal | Regional | Nacional |
|-----------|-----------|----------|----------|
| Partido ganado | +5 | +8 | +12 |
| Clasificar Copa | +15 | +30 | +50 |
| Campeón | +20 | +40 | +100 |
| MVP | +30 | +60 | +120 |

---

## Desempate

Cualquier empate en partido se resuelve con **Super Penal 2v2**.

> El Super Penal puede resultar en: A gana, B gana, o nadie anota → se repite hasta haber ganador.

---

## Estado en DB

```sql
-- Estados posibles de torneo
'pendiente'  -- Aún no inicia
'en_curso'   -- Corriendo
'finalizado' -- Terminó
```

---

## Relacionado
- [[RSMV - Arquitectura del Ecosistema]]
- [[RSMV - Motor de Simulación]]
- [[RSMV - Sistema EXP]]
- [[Modelo de Negocio]]
