---
tags: [rsmv, exp, niveles, jugador, dt]
created: 2026-04-12
---

# ⭐ RSMV — Sistema EXP

[[HOME]] | [[RSMV - Qué Es]] | [[RSMV - Motor de Simulación]]

---

## Regla de Oro

> **EXP es inmediato y NUNCA disminuye.**

Una vez ganado, el EXP es permanente. Tu reputación es inmutable en RSMV.

---

## Niveles de Jugador

| Nivel | EXP Requerido | Descripción |
|-------|--------------|-------------|
| 🏘️ Local | 0 – 49 | Jugador nuevo |
| 🏙️ Municipal | 50 – 149 | Jugador de ciudad |
| 🗺️ Regional | 150 – 299 | Jugador de región |
| 🇨🇴 Nacional | 300 – 499 | Jugador élite |
| 🌟 Estrella RSMV | 500+ | La cima |

---

## Niveles de Director Técnico (DT)

| Nivel | EXP Requerido |
|-------|--------------|
| 🎓 Asistente | 0 – 49 |
| 🏙️ DT Local | 50 – 149 |
| 🗺️ DT Regional | 150 – 299 |
| 🇨🇴 DT Nacional | 300+ |

---

## Cómo se Gana EXP

### Penales Individuales

| Acción | Municipal | Regional | Nacional |
|--------|-----------|----------|----------|
| Gol de penal | +3 | +5 | +8 |
| Fallo de penal | +2 | +2 | +2 |

> Incluso fallar da EXP. Participar siempre suma.

---

### Super Penal (2v2)

| Rol | EXP |
|-----|-----|
| Anotador del SP | +4 |
| Compañero de carrera | +3 |
| Rival en la carrera | +2 |
| Suplente observando | +1 |

> El Super Penal tiene UN ganador o NINGUNO. Nunca empate.

---

### Goles en Partido

| Fase | Municipal | Regional | Nacional |
|------|-----------|----------|----------|
| Entrenamiento | +5 | +8 | +12 |
| Clasificación | +7 | +12 | +18 |
| Copa | +10 | +15 | +25 |

---

### Resultados del Partido

| Resultado | Municipal | Regional | Nacional |
|-----------|-----------|----------|----------|
| Partido ganado | +5 | +8 | +12 |
| Clasificar a Copa | +15 | +30 | +50 |
| Campeón | +20 | +40 | +100 |
| MVP del torneo | +30 | +60 | +120 |

---

### EXP por Tiempo en Cancha

| Rol | EXP por segundo |
|-----|----------------|
| Titular | 1/15 ≈ 0.067 EXP/s |
| Suplente | 1/60 ≈ 0.017 EXP/s |

---

## Cálculo Automático de Nivel

El nivel se actualiza automáticamente en la base de datos vía **trigger PostgreSQL** al cambiar el EXP total.

```sql
-- Función en Supabase
IF exp_total >= 500 THEN nivel = 'estrella_rsmv'
ELSIF exp_total >= 300 THEN nivel = 'nacional'
ELSIF exp_total >= 150 THEN nivel = 'regional'
ELSIF exp_total >= 50  THEN nivel = 'municipal'
ELSE nivel = 'local'
```

---

## Ver tu EXP (cuesta Marecoin)

| Consulta | Costo |
|----------|-------|
| Ver mi propio EXP | 3 MC |
| Ver EXP de un rival | 5 MC |

> Diseño de escasez intencional: la información tiene valor.

---

## Relacionado
- [[RSMV - Marecoin]]
- [[RSMV - Motor de Simulación]]
- [[Base de Datos Schema]]
