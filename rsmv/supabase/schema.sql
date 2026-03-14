-- ============================================================
-- RSMV — Robot Soccer Mare Virtual
-- Supabase PostgreSQL Schema v1.0
-- Marelab © 2025 — Jhon Carlos Corzo Vega
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE player_level AS ENUM ('local', 'municipal', 'regional', 'nacional', 'estrella_rsmv');
CREATE TYPE dt_level AS ENUM ('asistente', 'dt_local', 'dt_regional', 'dt_nacional');
CREATE TYPE tournament_type AS ENUM ('municipal', 'regional', 'nacional');
CREATE TYPE tournament_phase AS ENUM ('entrenamiento', 'clasificacion', 'copa');
CREATE TYPE tournament_status AS ENUM ('pendiente', 'en_curso', 'finalizado');
CREATE TYPE match_phase AS ENUM ('penal_individual', 'super_penal', 'entrenamiento', 'oficial', 'clasificacion', 'copa');
CREATE TYPE player_role AS ENUM ('titular', 'suplente');
CREATE TYPE transaction_type AS ENUM ('compra', 'ganancia_partido', 'ganancia_torneo', 'gasto_informacion', 'premio');

-- ============================================================
-- ACADEMIAS Y LIGAS
-- ============================================================

CREATE TABLE academias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  liga VARCHAR(10) NOT NULL CHECK (liga IN ('A', 'B')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EQUIPOS
-- ============================================================

CREATE TABLE equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  academia_id UUID REFERENCES academias(id),
  dueno_user_id UUID REFERENCES auth.users(id),
  dt_user_id UUID REFERENCES auth.users(id),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- El DT no puede ser jugador del mismo equipo (validado en app layer)
  CONSTRAINT dt_diferente_dueno CHECK (dueno_user_id != dt_user_id OR dueno_user_id IS NULL OR dt_user_id IS NULL)
);

-- ============================================================
-- PERFILES DE USUARIO
-- ============================================================

CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  ciudad VARCHAR(100),
  whatsapp VARCHAR(20),
  marecoin_saldo INTEGER DEFAULT 0 NOT NULL CHECK (marecoin_saldo >= 0),
  equipo_id UUID REFERENCES equipos(id),
  es_dueno BOOLEAN DEFAULT FALSE,
  es_dt BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JUGADORES (extensión del perfil con stats)
-- ============================================================

CREATE TABLE jugadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  equipo_id UUID REFERENCES equipos(id),
  rol player_role DEFAULT 'suplente',
  exp_total INTEGER DEFAULT 0 NOT NULL CHECK (exp_total >= 0),
  nivel player_level DEFAULT 'local',
  goles_penales INTEGER DEFAULT 0,
  fallos_penales INTEGER DEFAULT 0,
  goles_super_penal INTEGER DEFAULT 0,
  goles_partido INTEGER DEFAULT 0,
  partidos_jugados INTEGER DEFAULT 0,
  partidos_ganados INTEGER DEFAULT 0,
  torneos_campeon INTEGER DEFAULT 0,
  mvp_torneos INTEGER DEFAULT 0,
  minutos_en_cancha INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIRECTORES TÉCNICOS
-- ============================================================

CREATE TABLE directores_tecnicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  equipo_id UUID REFERENCES equipos(id),
  exp_dt INTEGER DEFAULT 0 NOT NULL CHECK (exp_dt >= 0),
  nivel dt_level DEFAULT 'asistente',
  partidos_ganados INTEGER DEFAULT 0,
  equipos_clasificados_copa INTEGER DEFAULT 0,
  mvp_generados INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TORNEOS
-- ============================================================

CREATE TABLE torneos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  tipo tournament_type NOT NULL,
  estado tournament_status DEFAULT 'pendiente',
  modo VARCHAR(20) DEFAULT 'evento' CHECK (modo IN ('evento', 'express')),
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  premio_total BIGINT DEFAULT 0, -- en pesos COP
  seed_simulacion BIGINT, -- para reproducibilidad
  academia_id UUID REFERENCES academias(id), -- para municipales
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipos inscritos en un torneo
CREATE TABLE torneo_equipos (
  torneo_id UUID REFERENCES torneos(id) ON DELETE CASCADE,
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
  clasifico_copa BOOLEAN DEFAULT FALSE,
  campeon BOOLEAN DEFAULT FALSE,
  posicion_final INTEGER,
  premio_ganado BIGINT DEFAULT 0,
  PRIMARY KEY (torneo_id, equipo_id)
);

-- ============================================================
-- PARTIDOS
-- ============================================================

CREATE TABLE partidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  torneo_id UUID REFERENCES torneos(id),
  fase match_phase NOT NULL,
  equipo_a_id UUID REFERENCES equipos(id) NOT NULL,
  equipo_b_id UUID REFERENCES equipos(id) NOT NULL,
  goles_a INTEGER DEFAULT 0,
  goles_b INTEGER DEFAULT 0,
  ganador_id UUID REFERENCES equipos(id),
  penales_a INTEGER DEFAULT 0, -- goles de penal individuales
  penales_b INTEGER DEFAULT 0,
  super_penal_ganador UUID REFERENCES equipos(id),
  duracion_segundos INTEGER,
  seed BIGINT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'finalizado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finalizado_at TIMESTAMPTZ
);

-- ============================================================
-- EVENTOS DE PARTIDO (log detallado)
-- ============================================================

CREATE TABLE eventos_partido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
  minuto INTEGER NOT NULL, -- en segundos desde inicio
  tipo VARCHAR(50) NOT NULL, -- 'gol', 'penal_gol', 'penal_fallo', 'super_penal', 'cambio', 'exp'
  jugador_id UUID REFERENCES jugadores(id),
  equipo_id UUID REFERENCES equipos(id),
  valor INTEGER DEFAULT 0, -- EXP generado o valor numérico del evento
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOG DE EXP (auditoría completa)
-- ============================================================

CREATE TABLE exp_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jugador_id UUID REFERENCES jugadores(id),
  dt_id UUID REFERENCES directores_tecnicos(id),
  partido_id UUID REFERENCES partidos(id),
  torneo_id UUID REFERENCES torneos(id),
  tipo_accion VARCHAR(100) NOT NULL,
  exp_ganado INTEGER NOT NULL CHECK (exp_ganado > 0), -- EXP NUNCA disminuye
  nivel_anterior player_level,
  nivel_nuevo player_level,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MARECOIN — TRANSACCIONES
-- ============================================================

CREATE TABLE marecoin_transacciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo transaction_type NOT NULL,
  cantidad INTEGER NOT NULL, -- positivo = entrada, negativo = gasto
  saldo_anterior INTEGER NOT NULL,
  saldo_nuevo INTEGER NOT NULL,
  descripcion TEXT,
  referencia_id UUID, -- puede apuntar a torneo, partido, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MARECOIN — TARIFAS (configurables)
-- ============================================================

CREATE TABLE marecoin_tarifas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accion VARCHAR(100) UNIQUE NOT NULL,
  costo INTEGER NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarifas iniciales del MVP
INSERT INTO marecoin_tarifas (accion, costo, descripcion) VALUES
  ('ver_propio_exp', 3, 'Ver mi propio EXP y estadísticas'),
  ('ver_exp_rival', 5, 'Ver EXP de un jugador rival'),
  ('activar_ia_dt_basica', 20, 'Activar IA-DT básica para un partido'),
  ('activar_ia_dt_premium', 50, 'Activar IA-DT premium para un torneo completo');

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX idx_jugadores_equipo ON jugadores(equipo_id);
CREATE INDEX idx_jugadores_exp ON jugadores(exp_total DESC);
CREATE INDEX idx_partidos_torneo ON partidos(torneo_id);
CREATE INDEX idx_eventos_partido ON eventos_partido(partido_id);
CREATE INDEX idx_exp_log_jugador ON exp_log(jugador_id);
CREATE INDEX idx_exp_log_dt ON exp_log(dt_id);
CREATE INDEX idx_marecoin_user ON marecoin_transacciones(user_id);
CREATE INDEX idx_torneo_equipos_torneo ON torneo_equipos(torneo_id);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Función: calcular nivel de jugador basado en EXP
CREATE OR REPLACE FUNCTION calcular_nivel_jugador(exp_total INTEGER)
RETURNS player_level AS $$
BEGIN
  IF exp_total >= 500 THEN RETURN 'estrella_rsmv';
  ELSIF exp_total >= 300 THEN RETURN 'nacional';
  ELSIF exp_total >= 150 THEN RETURN 'regional';
  ELSIF exp_total >= 50 THEN RETURN 'municipal';
  ELSE RETURN 'local';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función: calcular nivel de DT basado en EXP
CREATE OR REPLACE FUNCTION calcular_nivel_dt(exp_dt INTEGER)
RETURNS dt_level AS $$
BEGIN
  IF exp_dt >= 300 THEN RETURN 'dt_nacional';
  ELSIF exp_dt >= 150 THEN RETURN 'dt_regional';
  ELSIF exp_dt >= 50 THEN RETURN 'dt_local';
  ELSE RETURN 'asistente';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: actualizar nivel automáticamente al cambiar EXP
CREATE OR REPLACE FUNCTION actualizar_nivel_jugador()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nivel = calcular_nivel_jugador(NEW.exp_total);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_nivel_jugador
  BEFORE UPDATE OF exp_total ON jugadores
  FOR EACH ROW EXECUTE FUNCTION actualizar_nivel_jugador();

-- Trigger: actualizar nivel DT
CREATE OR REPLACE FUNCTION actualizar_nivel_dt()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nivel = calcular_nivel_dt(NEW.exp_dt);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_nivel_dt
  BEFORE UPDATE OF exp_dt ON directores_tecnicos
  FOR EACH ROW EXECUTE FUNCTION actualizar_nivel_dt();

-- Trigger: actualizar perfil updated_at
CREATE OR REPLACE FUNCTION actualizar_perfil_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_perfil_updated
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION actualizar_perfil_timestamp();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE directores_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE marecoin_transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE exp_log ENABLE ROW LEVEL SECURITY;

-- Perfiles: cada usuario ve/edita solo el suyo
CREATE POLICY "perfil_propio" ON perfiles
  FOR ALL USING (auth.uid() = id);

-- Jugadores: todos pueden ver (con costo MC en la app), solo el propio puede editar
CREATE POLICY "jugador_ver" ON jugadores
  FOR SELECT USING (TRUE);

CREATE POLICY "jugador_editar_propio" ON jugadores
  FOR UPDATE USING (auth.uid() = user_id);

-- DT: mismo patrón
CREATE POLICY "dt_ver" ON directores_tecnicos
  FOR SELECT USING (TRUE);

CREATE POLICY "dt_editar_propio" ON directores_tecnicos
  FOR UPDATE USING (auth.uid() = user_id);

-- Marecoin: solo el dueño ve sus transacciones
CREATE POLICY "marecoin_propio" ON marecoin_transacciones
  FOR ALL USING (auth.uid() = user_id);

-- EXP log: el jugador ve su propio historial
CREATE POLICY "exp_log_propio" ON exp_log
  FOR SELECT USING (
    jugador_id IN (SELECT id FROM jugadores WHERE user_id = auth.uid())
    OR
    dt_id IN (SELECT id FROM directores_tecnicos WHERE user_id = auth.uid())
  );

-- ============================================================
-- DATOS INICIALES — ACADEMIAS DE EJEMPLO
-- ============================================================

INSERT INTO academias (nombre, ciudad, liga) VALUES
  ('Academia Medellín Norte', 'Medellín', 'A'),
  ('Academia Medellín Sur', 'Medellín', 'A'),
  ('Academia Bello', 'Bello', 'A'),
  ('Academia Itagüí', 'Itagüí', 'A'),
  ('Academia Envigado', 'Envigado', 'A'),
  ('Academia La Estrella', 'La Estrella', 'A'),
  ('Academia Caldas', 'Caldas', 'A'),
  ('Academia Copacabana', 'Copacabana', 'A'),
  ('Academia Bogotá Norte', 'Bogotá', 'B'),
  ('Academia Bogotá Sur', 'Bogotá', 'B'),
  ('Academia Cali', 'Cali', 'B'),
  ('Academia Barranquilla', 'Barranquilla', 'B'),
  ('Academia Bucaramanga', 'Bucaramanga', 'B'),
  ('Academia Pereira', 'Pereira', 'B'),
  ('Academia Manizales', 'Manizales', 'B'),
  ('Academia Cartagena', 'Cartagena', 'B');
