---
tags: [técnico, base-de-datos, supabase, postgresql, schema]
created: 2026-04-12
---

# 🗄️ Base de Datos — Schema RSMV

[[HOME]] | [[Backend API]] | [[Autenticación y Seguridad]]

---

## Motor: Supabase (PostgreSQL)

Supabase provee:
- PostgreSQL completo
- Auth JWT integrado
- RLS (Row Level Security)
- Realtime subscriptions
- Storage

---

## Tablas Principales

### `perfiles`
Extensión del usuario de Supabase Auth.
```
id              UUID (= auth.users.id)
nombre_completo VARCHAR(200)
email           VARCHAR(255)
ciudad          VARCHAR(100)
whatsapp        VARCHAR(20)
marecoin_saldo  INTEGER ≥ 0
equipo_id       FK → equipos
es_dueno        BOOLEAN
es_dt           BOOLEAN
avatar_url      TEXT
```

### `jugadores`
Stats de juego del jugador.
```
id              UUID
user_id         UUID → auth.users
equipo_id       UUID → equipos
rol             'titular' | 'suplente'
exp_total       INTEGER ≥ 0
nivel           player_level (auto-calculado)
goles_penales   INTEGER
fallos_penales  INTEGER
goles_partido   INTEGER
partidos_jugados INTEGER
torneos_campeon  INTEGER
```

### `directores_tecnicos`
Stats del DT.
```
id                      UUID
user_id                 UUID → auth.users
equipo_id               UUID → equipos
exp_dt                  INTEGER ≥ 0
nivel                   dt_level (auto-calculado)
partidos_ganados        INTEGER
equipos_clasificados    INTEGER
mvp_generados           INTEGER
```

### `equipos`
```
id              UUID
nombre          VARCHAR(100) UNIQUE
academia_id     UUID → academias
dueno_user_id   UUID → auth.users
dt_user_id      UUID → auth.users
activo          BOOLEAN
```
> Constraint: `dt_user_id ≠ dueno_user_id`

### `academias`
```
id      UUID
nombre  VARCHAR(100)
ciudad  VARCHAR(100)
liga    'A' | 'B'
```

### `torneos`
```
id              UUID
nombre          VARCHAR(200)
tipo            'municipal' | 'regional' | 'nacional'
estado          'pendiente' | 'en_curso' | 'finalizado'
modo            'evento' | 'express'
premio_total    BIGINT (COP)
seed_simulacion BIGINT (reproducibilidad)
academia_id     UUID → academias
```

### `partidos`
```
id                  UUID
torneo_id           UUID → torneos
fase                match_phase
equipo_a_id         UUID → equipos
equipo_b_id         UUID → equipos
goles_a             INTEGER
goles_b             INTEGER
ganador_id          UUID → equipos
super_penal_ganador UUID → equipos
seed                BIGINT
estado              'pendiente' | 'en_curso' | 'finalizado'
```

### `eventos_partido`
Log detallado de cada partido.
```
id          UUID
partido_id  UUID → partidos
minuto      INTEGER (segundos desde inicio)
tipo        'gol' | 'penal_gol' | 'penal_fallo' | 'super_penal' | 'exp'
jugador_id  UUID → jugadores
equipo_id   UUID → equipos
valor       INTEGER (EXP o valor del evento)
descripcion TEXT
```

### `exp_log`
Auditoría completa de EXP.
```
id              UUID
jugador_id      UUID → jugadores
dt_id           UUID → directores_tecnicos
partido_id      UUID → partidos
torneo_id       UUID → torneos
tipo_accion     VARCHAR(100)
exp_ganado      INTEGER > 0 (siempre positivo)
nivel_anterior  player_level
nivel_nuevo     player_level
```

### `marecoin_transacciones`
```
id              UUID
user_id         UUID → auth.users
tipo            transaction_type
cantidad        INTEGER (+entrada / -salida)
saldo_anterior  INTEGER
saldo_nuevo     INTEGER
descripcion     TEXT
referencia_id   UUID (partido, torneo, etc.)
```

---

## Triggers Automáticos

| Trigger | Qué hace |
|---------|----------|
| `trig_nivel_jugador` | Recalcula nivel al actualizar EXP |
| `trig_nivel_dt` | Recalcula nivel DT al actualizar EXP |
| `trig_perfil_updated` | Actualiza `updated_at` del perfil |

---

## Row Level Security (RLS)

| Tabla | Política |
|-------|----------|
| `perfiles` | Solo el propio usuario |
| `jugadores` | Ver: todos | Editar: solo el propio |
| `directores_tecnicos` | Ver: todos | Editar: solo el propio |
| `marecoin_transacciones` | Solo el dueño |
| `exp_log` | Solo el jugador/DT propio |

---

## Deploy del Schema

```bash
# En el SQL Editor de Supabase
# Ejecutar: rsmv/supabase/schema.sql
```

---

## Relacionado
- [[Backend API]]
- [[Autenticación y Seguridad]]
- [[RSMV - Sistema EXP]]
- [[RSMV - Marecoin]]
