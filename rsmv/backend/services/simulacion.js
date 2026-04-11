/**
 * RSMV — Servicio de Simulación de Torneos
 * Conecta motor.js con Supabase. El corazón del juego.
 *
 * Flujo: pendiente → en_curso → finalizado
 * Fases: Entrenamiento → Clasificación → Copa
 *
 * Marelab © 2025 — Jhon Carlos Corzo Vega
 */

const path = require('path');
const Motor = require(path.join(__dirname, '../../simulator/motor'));
const { supabaseAdmin } = require('../config/supabase');
const { asignarExpJugador, asignarExpDT, EXP_RESULTADOS, EXP_DT } = require('./exp');
const { acreditar } = require('./marecoin');

// ============================================================
// CARGA DE EQUIPOS DESDE LA BD
// ============================================================

/**
 * Carga equipos inscritos en el torneo con sus jugadores.
 * Devuelve equipos en formato compatible con motor.js.
 */
async function cargarEquipos(torneoId) {
  const { data, error } = await supabaseAdmin
    .from('torneo_equipos')
    .select(`
      equipo_id,
      equipos(
        id, nombre, dt_user_id,
        jugadores(
          id, user_id, rol,
          perfiles!jugadores_user_id_fkey(nombre_completo)
        )
      )
    `)
    .eq('torneo_id', torneoId);

  if (error) throw new Error(`Error cargando equipos: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No hay equipos inscritos en el torneo');

  return data.map(te => {
    const eq = te.equipos;
    const jugs = eq.jugadores || [];

    const titulares = jugs.filter(j => j.rol === 'titular').slice(0, 2);
    const suplentes = jugs.filter(j => j.rol === 'suplente').slice(0, 2);

    const toMotor = j => ({
      id: j.id,
      nombre: j.perfiles?.nombre_completo || `Jugador ${j.id.slice(0, 6)}`,
      habilidad: 0
    });

    return {
      id: eq.id,
      nombre: eq.nombre,
      dt_user_id: eq.dt_user_id || null,
      jugadores: jugs.map(toMotor),   // los 4
      titulares: titulares.map(toMotor),
      suplentes: suplentes.map(toMotor)
    };
  });
}

// ============================================================
// PERSISTENCIA DE PARTIDOS
// ============================================================

/**
 * Guarda un partido simulado en la BD y devuelve su UUID.
 */
async function persistirPartido(torneoId, fase, resultado) {
  const { data: partido, error } = await supabaseAdmin
    .from('partidos')
    .insert({
      torneo_id: torneoId,
      fase,
      equipo_a_id: resultado.equipo_a_id || null,
      equipo_b_id: resultado.equipo_b_id || null,
      goles_a: resultado.goles_a ?? 0,
      goles_b: resultado.goles_b ?? 0,
      ganador_id: resultado.ganador_id || null,
      super_penal_ganador: resultado.super_penal_desempate?.ganador_id || null,
      duracion_segundos: resultado.duracion_segundos || null,
      seed: resultado._seed || null,
      estado: 'finalizado',
      finalizado_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) throw new Error(`Error persistiendo partido: ${error.message}`);
  return partido.id;
}

// ============================================================
// ASIGNACIÓN DE EXP POR PARTIDO
// ============================================================

/**
 * Agrupa los eventos de EXP del motor por jugador y los aplica a la BD.
 * Acumula el EXP de un partido completo por jugador antes de hacer el update
 * para minimizar operaciones a la BD.
 */
async function aplicarExpPartido(expEventos, partidoId, torneoId) {
  if (!expEventos || expEventos.length === 0) return {};

  // Sumar EXP por jugador (evita múltiples updates)
  const porJugador = {};
  for (const ev of expEventos) {
    if (!ev.jugador_id || ev.exp <= 0) continue;
    if (!porJugador[ev.jugador_id]) porJugador[ev.jugador_id] = 0;
    porJugador[ev.jugador_id] += ev.exp;
  }

  const resultados = {};
  for (const [jugadorId, totalExp] of Object.entries(porJugador)) {
    try {
      const r = await asignarExpJugador(
        jugadorId,
        totalExp,
        'partido',
        partidoId,
        torneoId
      );
      resultados[jugadorId] = r;
    } catch (err) {
      console.warn(`EXP skip jugador ${jugadorId}: ${err.message}`);
    }
  }
  return resultados;
}

// ============================================================
// ACUMULADOR DE ESTADÍSTICAS
// ============================================================

/**
 * Acumula stats de jugadores durante la simulación.
 * Al final se hace un único UPDATE por jugador.
 */
function crearAcumuladorStats() {
  const stats = {};

  function get(jugadorId) {
    if (!stats[jugadorId]) {
      stats[jugadorId] = {
        goles_partido: 0,
        goles_penales: 0,
        goles_super_penal: 0,
        partidos_jugados: 0,
        partidos_ganados: 0,
        torneos_campeon: 0,
        mvp_torneos: 0
      };
    }
    return stats[jugadorId];
  }

  return {
    addGol(jugadorId, esPenal = false) {
      const s = get(jugadorId);
      if (esPenal) s.goles_penales++;
      else s.goles_partido++;
    },
    addSuperPenal(jugadorId) {
      get(jugadorId).goles_super_penal++;
    },
    addPartido(jugadorId, gano = false) {
      const s = get(jugadorId);
      s.partidos_jugados++;
      if (gano) s.partidos_ganados++;
    },
    addCampeon(jugadorId) {
      get(jugadorId).torneos_campeon++;
    },
    addMVP(jugadorId) {
      get(jugadorId).mvp_torneos++;
    },
    getAll() { return stats; }
  };
}

/**
 * Aplica las estadísticas acumuladas a la BD.
 * Usa load + update para evitar necesitar funciones RPC.
 */
async function persistirStats(statsAcumulados) {
  for (const [jugadorId, delta] of Object.entries(statsAcumulados)) {
    // Filtramos solo los que cambiaron
    const cambios = Object.fromEntries(
      Object.entries(delta).filter(([, v]) => v > 0)
    );
    if (Object.keys(cambios).length === 0) continue;

    // Cargar valores actuales
    const { data: actual } = await supabaseAdmin
      .from('jugadores')
      .select('goles_partido, goles_penales, goles_super_penal, partidos_jugados, partidos_ganados, torneos_campeon, mvp_torneos')
      .eq('id', jugadorId)
      .single();

    if (!actual) continue;

    const updates = {};
    for (const [campo, incremento] of Object.entries(cambios)) {
      updates[campo] = (actual[campo] || 0) + incremento;
    }

    await supabaseAdmin.from('jugadores').update(updates).eq('id', jugadorId);
  }
}

// ============================================================
// FUNCIÓN PRINCIPAL: SIMULAR TORNEO COMPLETO
// ============================================================

/**
 * Simula un torneo completo (3 fases) y persiste todo en Supabase.
 *
 * @param {string} torneoId - UUID del torneo a simular
 * @param {number|null} seedOverride - Seed opcional (si no hay uno en DB)
 * @returns {Object} Resumen completo del torneo
 */
async function simularTorneo(torneoId, seedOverride = null) {
  // ── 1. Cargar y validar torneo ──────────────────────────────
  const { data: torneo, error: torneoErr } = await supabaseAdmin
    .from('torneos')
    .select('*')
    .eq('id', torneoId)
    .single();

  if (torneoErr || !torneo) throw new Error('Torneo no encontrado');
  if (torneo.estado !== 'pendiente') {
    throw new Error(`El torneo no está pendiente (estado actual: ${torneo.estado})`);
  }

  const nivelTorneo = torneo.tipo; // 'municipal' | 'regional' | 'nacional'
  const seed = seedOverride ?? torneo.seed_simulacion ?? Date.now();

  // ── 2. Marcar en_curso ──────────────────────────────────────
  await supabaseAdmin
    .from('torneos')
    .update({ estado: 'en_curso', seed_simulacion: seed })
    .eq('id', torneoId);

  // ── 3. Cargar equipos ───────────────────────────────────────
  const equipos = await cargarEquipos(torneoId);
  if (equipos.length < 2) {
    throw new Error(`Se necesitan al menos 2 equipos (hay ${equipos.length})`);
  }

  const stats = crearAcumuladorStats();

  const resumen = {
    torneo_id: torneoId,
    nombre: torneo.nombre,
    nivel: nivelTorneo,
    seed,
    equipos_participantes: equipos.length,
    fases: {},
    campeon_equipo_id: null,
    mvp_jugador_id: null
  };

  // ── 4. FASE ENTRENAMIENTO ───────────────────────────────────
  const entrenamientos = [];

  for (const equipo of equipos) {
    if (equipo.jugadores.length !== 4) {
      console.warn(`Equipo "${equipo.nombre}" no tiene exactamente 4 jugadores — entrenamiento saltado`);
      continue;
    }

    // Seed único por equipo: XOR del seed global con el código del id
    const seedEq = seed ^ equipo.id.split('').reduce((acc, c) => acc ^ c.charCodeAt(0), 0);

    const resultEnt = Motor.simularFaseEntrenamiento(equipo, nivelTorneo, null, seedEq);
    const partido = resultEnt.partido_entrenamiento;

    // Persistir partido (el rival "fantasma" no tiene UUID válido → lo omitimos)
    const partidoId = await persistirPartido(torneoId, 'entrenamiento', {
      equipo_a_id: equipo.id,
      equipo_b_id: null, // fantasma no existe en DB
      goles_a: partido.goles_a,
      goles_b: partido.goles_b,
      ganador_id: partido.ganador_id === equipo.id ? equipo.id : null,
      duracion_segundos: partido.duracion_segundos
    });

    // Reunir todos los eventos de EXP de la fase
    const todosExp = [
      ...resultEnt.penales.map(p => ({ jugador_id: p.jugador_id, exp: p.exp })),
      ...resultEnt.super_penal.eventos,
      ...(partido.exp_eventos || [])
    ];
    await aplicarExpPartido(todosExp, partidoId, torneoId);

    // Stats
    for (const gol of partido.goles) {
      stats.addGol(gol.jugador_id, gol.es_penal);
    }
    for (const j of [...equipo.titulares, ...equipo.suplentes]) {
      stats.addPartido(j.id, partido.ganador_id === equipo.id);
    }
    // Super penal anotador
    const spAnotador = resultEnt.super_penal.eventos.find(e => e.rol === 'anotador');
    if (spAnotador) stats.addSuperPenal(spAnotador.jugador_id);

    entrenamientos.push({
      equipo_id: equipo.id,
      equipo_nombre: equipo.nombre,
      partido_id: partidoId,
      resultado: `${partido.goles_a}-${partido.goles_b}`
    });
  }

  resumen.fases.entrenamiento = { partidos: entrenamientos.length, detalle: entrenamientos };

  // ── 5. CLASIFICACIÓN ────────────────────────────────────────
  const resultClasif = Motor.simularClasificacion(equipos, nivelTorneo, seed);
  const partidosClasif = [];

  for (const partido of resultClasif.partidos) {
    const pId = await persistirPartido(torneoId, 'clasificacion', partido);

    await aplicarExpPartido(partido.exp_eventos || [], pId, torneoId);

    // EXP extra por clasificar a copa (ganador)
    if (partido.ganador_id) {
      const eqGanador = equipos.find(e => e.id === partido.ganador_id);
      if (eqGanador) {
        const expClasif = EXP_RESULTADOS[nivelTorneo].clasificar_copa;
        for (const j of [...eqGanador.titulares, ...eqGanador.suplentes]) {
          try {
            await asignarExpJugador(j.id, expClasif, 'clasificar_copa', pId, torneoId);
          } catch {}
        }
        // Marcar clasificó en torneo_equipos
        await supabaseAdmin
          .from('torneo_equipos')
          .update({ clasifico_copa: true })
          .eq('torneo_id', torneoId)
          .eq('equipo_id', partido.ganador_id);
      }
    }

    // Super penal de desempate
    if (partido.super_penal_desempate) {
      for (const ev of partido.super_penal_desempate.eventos || []) {
        try {
          await asignarExpJugador(ev.jugador_id, ev.exp, 'super_penal_desempate', pId, torneoId);
        } catch {}
      }
    }

    // Stats
    for (const gol of partido.goles || []) {
      stats.addGol(gol.jugador_id, gol.es_penal);
    }
    const equipoGanador = equipos.find(e => e.id === partido.ganador_id);
    const equipoPerdedor = equipos.find(e =>
      e.id === partido.equipo_a_id && e.id !== partido.ganador_id ||
      e.id === partido.equipo_b_id && e.id !== partido.ganador_id
    );
    for (const eq of [equipoGanador, equipoPerdedor].filter(Boolean)) {
      for (const j of [...eq.titulares, ...eq.suplentes]) {
        stats.addPartido(j.id, eq.id === partido.ganador_id);
      }
    }

    partidosClasif.push({ partido_id: pId, ganador_id: partido.ganador_id });
  }

  resumen.fases.clasificacion = {
    partidos: partidosClasif.length,
    ganadores: resultClasif.ganadores.map(e => e.id)
  };

  // ── 6. COPA ─────────────────────────────────────────────────
  const ganadores = resultClasif.ganadores;

  if (ganadores.length >= 2) {
    // Requiere exactamente 8 para simularCopa. Si hay menos, rellenamos con byes.
    let equiposCopa = [...ganadores];
    while (equiposCopa.length < 8) {
      // Bye: duplicamos el último equipo como fantasma
      const base = equiposCopa[equiposCopa.length - 1];
      equiposCopa.push({ ...base, id: `bye_${equiposCopa.length}`, nombre: `BYE ${equiposCopa.length}` });
    }
    equiposCopa = equiposCopa.slice(0, 8);

    let resultCopa;
    try {
      resultCopa = Motor.simularCopa(equiposCopa, nivelTorneo, seed + 9999);
    } catch (copaErr) {
      console.error('Error en Copa:', copaErr.message);
      resultCopa = null;
    }

    if (resultCopa) {
      const campeones = (resultCopa.campeones || []).filter(c => c && !String(c.id).startsWith('bye_'));
      const partidosCopa = [];

      for (const llave of resultCopa.llaves || []) {
        // Semifinales
        for (const sf of llave.semifinales || []) {
          if (!sf.equipo_a_id || String(sf.equipo_a_id).startsWith('bye_')) continue;
          const pId = await persistirPartido(torneoId, 'copa', sf);
          await aplicarExpPartido(sf.exp_eventos || [], pId, torneoId);

          for (const gol of sf.goles || []) stats.addGol(gol.jugador_id, gol.es_penal);
          partidosCopa.push({ partido_id: pId, fase: 'semifinal' });
        }

        // Final de llave
        if (llave.final && !String(llave.final.equipo_a_id || '').startsWith('bye_')) {
          const pId = await persistirPartido(torneoId, 'copa', llave.final);
          await aplicarExpPartido(llave.final.exp_eventos || [], pId, torneoId);

          // EXP de campeón
          if (llave.campeon && !String(llave.campeon.id).startsWith('bye_')) {
            const eqCamp = equipos.find(e => e.id === llave.campeon.id);
            if (eqCamp) {
              const expCamp = EXP_RESULTADOS[nivelTorneo].campeon;
              for (const j of [...eqCamp.titulares, ...eqCamp.suplentes]) {
                try { await asignarExpJugador(j.id, expCamp, 'campeon_copa', pId, torneoId); } catch {}
                stats.addCampeon(j.id);
              }
              await supabaseAdmin
                .from('torneo_equipos')
                .update({ campeon: true })
                .eq('torneo_id', torneoId)
                .eq('equipo_id', llave.campeon.id);
            }
          }

          for (const gol of llave.final.goles || []) stats.addGol(gol.jugador_id, gol.es_penal);
          partidosCopa.push({ partido_id: pId, fase: 'final_llave' });
        }
      }

      // MVP global: el jugador con más EXP acumulado (aproximado por goles)
      const mvpId = calcularMVPTorneo(resumen, resultClasif, resultCopa);
      if (mvpId) {
        stats.addMVP(mvpId);
        const expMVP = EXP_RESULTADOS[nivelTorneo].mvp;
        try { await asignarExpJugador(mvpId, expMVP, 'mvp_torneo', null, torneoId); } catch {}
        resumen.mvp_jugador_id = mvpId;
      }

      // Campeón final del torneo
      if (campeones.length > 0) {
        resumen.campeon_equipo_id = campeones[0].id;
        await distribuirPremiosMC(torneoId, torneo, campeones[0], equipos);
      }

      resumen.fases.copa = {
        partidos: partidosCopa.length,
        campeones: campeones.map(c => c.id)
      };
    }
  } else {
    // Con 1 ganador directo del clasificatorio (torneo pequeño)
    if (ganadores.length === 1) {
      resumen.campeon_equipo_id = ganadores[0].id;
      await supabaseAdmin
        .from('torneo_equipos')
        .update({ campeon: true })
        .eq('torneo_id', torneoId)
        .eq('equipo_id', ganadores[0].id);
    }
  }

  // ── 7. Persistir estadísticas acumuladas ────────────────────
  await persistirStats(stats.getAll());

  // ── 8. Finalizar torneo ─────────────────────────────────────
  await supabaseAdmin
    .from('torneos')
    .update({ estado: 'finalizado', fecha_fin: new Date().toISOString() })
    .eq('id', torneoId);

  return resumen;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * MVP aproximado: jugador con más goles en toda la copa.
 */
function calcularMVPTorneo(resumen, resultClasif, resultCopa) {
  const golesAcum = {};

  function contarGoles(partidos) {
    for (const p of partidos || []) {
      for (const g of p.goles || []) {
        golesAcum[g.jugador_id] = (golesAcum[g.jugador_id] || 0) + 1;
      }
    }
  }

  contarGoles(resultClasif.partidos);
  for (const llave of resultCopa?.llaves || []) {
    contarGoles(llave.semifinales);
    if (llave.final) contarGoles([llave.final]);
  }

  let mvpId = null, maxGoles = 0;
  for (const [id, goles] of Object.entries(golesAcum)) {
    if (goles > maxGoles) { maxGoles = goles; mvpId = id; }
  }
  return mvpId;
}

/**
 * Distribuye Marecoin simbólico al equipo campeón.
 */
async function distribuirPremiosMC(torneoId, torneo, campeon, equipos) {
  if (!campeon) return;

  const eqCamp = equipos.find(e => e.id === campeon.id);
  if (!eqCamp) return;

  // 100 MC por jugador del equipo campeón
  const MC_PREMIO = 100;
  const todosMiembros = [...eqCamp.titulares, ...eqCamp.suplentes];

  for (const j of todosMiembros) {
    try {
      const { data: jugDB } = await supabaseAdmin
        .from('jugadores')
        .select('user_id')
        .eq('id', j.id)
        .single();

      if (jugDB?.user_id) {
        await acreditar(
          jugDB.user_id,
          MC_PREMIO,
          'ganancia_torneo',
          `Premio campeón — ${torneo.nombre}`,
          torneoId
        );
      }
    } catch (err) {
      console.warn(`MC skip jugador ${j.id}: ${err.message}`);
    }
  }

  // Registrar premio en COP en torneo_equipos
  if (torneo.premio_total > 0) {
    await supabaseAdmin
      .from('torneo_equipos')
      .update({ premio_ganado: torneo.premio_total })
      .eq('torneo_id', torneoId)
      .eq('equipo_id', campeon.id);
  }
}

module.exports = { simularTorneo };
