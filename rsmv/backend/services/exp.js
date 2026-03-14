/**
 * RSMV — Servicio de EXP
 * EXP es inmediato y NUNCA disminuye. Sin excepciones.
 *
 * Tablas de EXP según el Super Prompt de Marelab.
 */

const { supabaseAdmin } = require('../config/supabase');

// ============================================================
// TABLAS DE EXP
// ============================================================

const EXP_PENALES = {
  municipal:  { gol: 3, fallo: 2 },
  regional:   { gol: 5, fallo: 2 },
  nacional:   { gol: 8, fallo: 2 }
};

const EXP_SUPER_PENAL = {
  anotador: 4,
  companero_carrera: 3,
  rival_carrera: 2,
  suplente_observando: 1
};

const EXP_GOLES_PARTIDO = {
  municipal:  { entrenamiento: 5, clasificacion: 7, copa: 10 },
  regional:   { entrenamiento: 8, clasificacion: 12, copa: 15 },
  nacional:   { entrenamiento: 12, clasificacion: 18, copa: 25 }
};

const EXP_GOLES_PENAL_COPA = {
  municipal:  { clasificacion: 6, copa: 10 },
  regional:   { clasificacion: 10, copa: 16 },
  nacional:   { clasificacion: 16, copa: 20 }
};

// Tiempo en cancha: 1 EXP cada 15s titular, 1 cada 60s suplente
const EXP_TIEMPO = {
  titular_intervalo: 15,   // segundos por EXP
  suplente_intervalo: 60
};

const EXP_RESULTADOS = {
  municipal:  { ganado: 5,  clasificar_copa: 15, campeon: 20, mvp: 30 },
  regional:   { ganado: 8,  clasificar_copa: 30, campeon: 40, mvp: 60 },
  nacional:   { ganado: 12, clasificar_copa: 50, campeon: 100, mvp: 120 }
};

const EXP_DT = {
  ganar_partido: 10,
  jugador_mvp: 20,
  equipo_clasifica_copa: 30
};

// ============================================================
// NIVELES
// ============================================================

function calcularNivelJugador(exp) {
  if (exp >= 500) return 'estrella_rsmv';
  if (exp >= 300) return 'nacional';
  if (exp >= 150) return 'regional';
  if (exp >= 50)  return 'municipal';
  return 'local';
}

function calcularNivelDT(exp) {
  if (exp >= 300) return 'dt_nacional';
  if (exp >= 150) return 'dt_regional';
  if (exp >= 50)  return 'dt_local';
  return 'asistente';
}

// ============================================================
// ASIGNAR EXP A JUGADOR
// ============================================================

async function asignarExpJugador(jugadorId, cantidad, tipoAccion, partidoId = null, torneoId = null) {
  if (cantidad <= 0) throw new Error('EXP debe ser positivo');

  // Obtener estado actual
  const { data: jugador, error } = await supabaseAdmin
    .from('jugadores')
    .select('exp_total, nivel, user_id')
    .eq('id', jugadorId)
    .single();

  if (error || !jugador) throw new Error('Jugador no encontrado');

  const expAnterior = jugador.exp_total;
  const expNuevo = expAnterior + cantidad;
  const nivelAnterior = jugador.nivel;
  const nivelNuevo = calcularNivelJugador(expNuevo);

  // Actualizar EXP (el trigger en DB actualiza el nivel automáticamente)
  const { error: updateError } = await supabaseAdmin
    .from('jugadores')
    .update({ exp_total: expNuevo })
    .eq('id', jugadorId);

  if (updateError) throw new Error('Error actualizando EXP del jugador');

  // Registrar en log
  await supabaseAdmin.from('exp_log').insert({
    jugador_id: jugadorId,
    partido_id: partidoId,
    torneo_id: torneoId,
    tipo_accion: tipoAccion,
    exp_ganado: cantidad,
    nivel_anterior: nivelAnterior,
    nivel_nuevo: nivelNuevo
  });

  const subioNivel = nivelAnterior !== nivelNuevo;
  return { expAnterior, expNuevo, nivelAnterior, nivelNuevo, subioNivel };
}

// ============================================================
// ASIGNAR EXP A DT
// ============================================================

async function asignarExpDT(dtId, cantidad, tipoAccion, partidoId = null, torneoId = null) {
  if (cantidad <= 0) throw new Error('EXP DT debe ser positivo');

  const { data: dt, error } = await supabaseAdmin
    .from('directores_tecnicos')
    .select('exp_dt, nivel')
    .eq('id', dtId)
    .single();

  if (error || !dt) throw new Error('DT no encontrado');

  const expAnterior = dt.exp_dt;
  const expNuevo = expAnterior + cantidad;
  const nivelAnterior = dt.nivel;
  const nivelNuevo = calcularNivelDT(expNuevo);

  await supabaseAdmin
    .from('directores_tecnicos')
    .update({ exp_dt: expNuevo })
    .eq('id', dtId);

  await supabaseAdmin.from('exp_log').insert({
    dt_id: dtId,
    partido_id: partidoId,
    torneo_id: torneoId,
    tipo_accion: tipoAccion,
    exp_ganado: cantidad,
    nivel_nuevo: nivelNuevo
  });

  return { expAnterior, expNuevo, nivelAnterior, nivelNuevo, subioNivel: nivelAnterior !== nivelNuevo };
}

// ============================================================
// CALCULAR EXP DE TIEMPO EN CANCHA
// ============================================================

function calcularExpTiempo(segundosEnCancha, esTitular) {
  const intervalo = esTitular ? EXP_TIEMPO.titular_intervalo : EXP_TIEMPO.suplente_intervalo;
  return Math.floor(segundosEnCancha / intervalo);
}

module.exports = {
  EXP_PENALES,
  EXP_SUPER_PENAL,
  EXP_GOLES_PARTIDO,
  EXP_GOLES_PENAL_COPA,
  EXP_RESULTADOS,
  EXP_DT,
  calcularNivelJugador,
  calcularNivelDT,
  calcularExpTiempo,
  asignarExpJugador,
  asignarExpDT
};
