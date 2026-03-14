/**
 * RSMV — Motor de Simulación
 * Robot Soccer Mare Virtual — Marelab © 2025
 *
 * Reglas del Super Prompt:
 * - Super Penal: UN solo ganador o NINGUNO
 * - Partido Oficial: siempre arranca 0-0
 * - EXP: inmediato, nunca disminuye
 * - Seed fijo para reproducibilidad
 */

// ============================================================
// GENERADOR PSEUDOALEATORIO CON SEED (reproducible)
// ============================================================

class PRNG {
  constructor(seed) {
    this.seed = seed ?? Date.now();
    this.state = this.seed;
  }

  // Algoritmo xorshift32
  next() {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return ((this.state >>> 0) / 4294967296);
  }

  // Float en rango [min, max)
  float(min = 0, max = 1) {
    return min + this.next() * (max - min);
  }

  // Entero en rango [min, max]
  int(min, max) {
    return Math.floor(this.float(min, max + 1));
  }

  // Boolean con probabilidad p
  bool(p = 0.5) {
    return this.next() < p;
  }

  // Elegir elemento aleatorio de array
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  // Mezclar array (Fisher-Yates)
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// ============================================================
// CONSTANTES
// ============================================================

const PROB_PENAL = 0.60;          // Probabilidad de gol en penal
const CAMPO_ANCHO = 2;            // metros
const CAMPO_LARGO = 3;            // metros
const JUGADORES_POR_EQUIPO = 2;   // en cancha

// Goles promedio por minuto de partido (distribución Poisson aproximada)
const GOLES_POR_MINUTO = 0.25;

// EXP según nivel de torneo
const EXP_TABLA = {
  penales: {
    municipal: { gol: 3, fallo: 2 },
    regional:  { gol: 5, fallo: 2 },
    nacional:  { gol: 8, fallo: 2 }
  },
  super_penal: { anotador: 4, companero: 3, rival: 2, suplente: 1 },
  goles: {
    municipal: { entrenamiento: 5, clasificacion: 7, copa: 10 },
    regional:  { entrenamiento: 8, clasificacion: 12, copa: 15 },
    nacional:  { entrenamiento: 12, clasificacion: 18, copa: 25 }
  },
  resultados: {
    municipal: { ganado: 5, clasificar_copa: 15, campeon: 20, mvp: 30 },
    regional:  { ganado: 8, clasificar_copa: 30, campeon: 40, mvp: 60 },
    nacional:  { ganado: 12, clasificar_copa: 50, campeon: 100, mvp: 120 }
  }
};

const EXP_TIEMPO = {
  titular_por_segundo:  1 / 15,
  suplente_por_segundo: 1 / 60
};

// ============================================================
// FASE 1 — PENALES INDIVIDUALES
// ============================================================

/**
 * Simula los penales individuales de los 4 jugadores de un equipo
 * @param {Array} jugadores - Array de 4 jugadores [{id, nombre, habilidad?}]
 * @param {string} nivelTorneo - 'municipal' | 'regional' | 'nacional'
 * @param {PRNG} rng
 */
function simularPenalesIndividuales(jugadores, nivelTorneo, rng) {
  const tabla = EXP_TABLA.penales[nivelTorneo];
  const resultados = [];

  for (const jugador of jugadores) {
    const probGol = PROB_PENAL + (jugador.habilidad || 0) * 0.05;
    const metio = rng.bool(Math.min(probGol, 0.95));

    resultados.push({
      jugador_id: jugador.id,
      nombre: jugador.nombre,
      metio,
      exp: metio ? tabla.gol : tabla.fallo,
      descripcion: metio
        ? `⚽ ${jugador.nombre} convirtió el penal (+${tabla.gol} EXP)`
        : `❌ ${jugador.nombre} falló el penal (+${tabla.fallo} EXP)`
    });
  }

  return resultados;
}

// ============================================================
// FASE 1 — SUPER PENAL 2v2
// ============================================================

/**
 * Super Penal: 2 jugadores de cada equipo corren hacia el balón.
 * SOLO UN equipo puede anotar, o ninguno.
 * El DT elige quiénes corren; sin DT, la IA elige aleatoriamente.
 *
 * @param {Object} equipoA - {id, nombre, corredores: [{id, nombre}]}
 * @param {Object} equipoB - {id, nombre, corredores: [{id, nombre}]}
 * @param {Array} suplentesA - Jugadores que NO corrieron (equipo A)
 * @param {Array} suplentesB - Jugadores que NO corrieron (equipo B)
 * @param {PRNG} rng
 */
function simularSuperPenal(equipoA, equipoB, suplentesA, suplentesB, rng) {
  // Tres posibles resultados:
  // 0 = nadie anota, 1 = equipo A anota, 2 = equipo B anota
  const resultado = rng.int(0, 2); // 0: nadie, 1: A, 2: B

  const ganadorEquipo = resultado === 0 ? null : resultado === 1 ? equipoA : equipoB;
  const perdedorEquipo = resultado === 0 ? null : resultado === 1 ? equipoB : equipoA;

  const eventos = [];

  if (ganadorEquipo) {
    const ganadorCorredores = resultado === 1 ? equipoA.corredores : equipoB.corredores;
    const perdedorCorredores = resultado === 1 ? equipoB.corredores : equipoA.corredores;

    // Anotador (el primero en llegar al balón — random entre los 2)
    const anotadorIdx = rng.int(0, 1);
    const anotador = ganadorCorredores[anotadorIdx];
    const companero = ganadorCorredores[1 - anotadorIdx];

    eventos.push({
      tipo: 'super_penal',
      jugador_id: anotador.id,
      rol: 'anotador',
      exp: EXP_TABLA.super_penal.anotador,
      descripcion: `🚀 ${anotador.nombre} ANOTÓ el Super Penal (+${EXP_TABLA.super_penal.anotador} EXP)`
    });
    eventos.push({
      tipo: 'super_penal',
      jugador_id: companero.id,
      rol: 'companero_carrera',
      exp: EXP_TABLA.super_penal.companero,
      descripcion: `🏃 ${companero.nombre} corrió el SP (+${EXP_TABLA.super_penal.companero} EXP)`
    });

    // Rivales que corrieron y perdieron
    for (const rival of perdedorCorredores) {
      eventos.push({
        tipo: 'super_penal',
        jugador_id: rival.id,
        rol: 'rival_carrera',
        exp: EXP_TABLA.super_penal.rival,
        descripcion: `😤 ${rival.nombre} perdió la carrera del SP (+${EXP_TABLA.super_penal.rival} EXP)`
      });
    }
  } else {
    // Nadie anotó — todos los corredores obtienen EXP de rival_carrera
    const todosCorredores = [...equipoA.corredores, ...equipoB.corredores];
    for (const c of todosCorredores) {
      eventos.push({
        tipo: 'super_penal',
        jugador_id: c.id,
        rol: 'rival_carrera',
        exp: EXP_TABLA.super_penal.rival,
        descripcion: `😤 ${c.nombre} corrió el SP sin gol (+${EXP_TABLA.super_penal.rival} EXP)`
      });
    }
  }

  // Suplentes observando
  for (const s of [...(suplentesA || []), ...(suplentesB || [])]) {
    eventos.push({
      tipo: 'super_penal',
      jugador_id: s.id,
      rol: 'suplente_observando',
      exp: EXP_TABLA.super_penal.suplente,
      descripcion: `👀 ${s.nombre} observó el SP (+${EXP_TABLA.super_penal.suplente} EXP)`
    });
  }

  return {
    resultado,  // 0=nadie, 1=A, 2=B
    ganador_id: ganadorEquipo?.id || null,
    descripcion: resultado === 0
      ? '🤝 Super Penal: nadie anotó'
      : `🏆 Super Penal: ${ganadorEquipo.nombre} anotó`,
    eventos
  };
}

// ============================================================
// SIMULACIÓN DE PARTIDO (2×T minutos)
// ============================================================

/**
 * Simula un partido completo de fútbol robótico.
 *
 * @param {Object} equipoA - {id, nombre, titulares: [{id, nombre}], suplentes: [{id, nombre}]}
 * @param {Object} equipoB
 * @param {number} duracionMin - Duración en minutos (por mitad)
 * @param {string} nivelTorneo
 * @param {string} fase - 'entrenamiento' | 'clasificacion' | 'copa'
 * @param {PRNG} rng
 * @param {Object} opciones - {expActivo: true}
 */
function simularPartido(equipoA, equipoB, duracionMin, nivelTorneo, fase, rng, opciones = {}) {
  const duracionSegundos = duracionMin * 60 * 2; // 2 mitades
  const goles = [];
  const expEventos = [];

  let golesA = 0;
  let golesB = 0;

  // Distribuir goles según distribución Poisson aproximada
  const totalGoles = simularGolesPorPartido(duracionMin * 2, rng);
  const minutosGoles = generarMinutosGoles(totalGoles, duracionMin * 2, rng);

  for (const minuto of minutosGoles) {
    // ¿Quién anota? 50/50 base
    const equipoAnota = rng.bool(0.5) ? equipoA : equipoB;
    const titulares = minuto < duracionMin * 30 ? equipoAnota.titulares : equipoAnota.titulares; // simplificado

    const goleador = rng.pick(titulares);
    const esGolPenal = rng.bool(0.15); // 15% de goles son de penal

    if (equipoAnota === equipoA) golesA++;
    else golesB++;

    const expGol = obtenerExpGol(nivelTorneo, fase, esGolPenal);

    goles.push({
      minuto,
      equipo_id: equipoAnota.id,
      jugador_id: goleador.id,
      nombre_goleador: goleador.nombre,
      es_penal: esGolPenal,
      exp: expGol
    });

    expEventos.push({
      jugador_id: goleador.id,
      tipo: esGolPenal ? 'gol_penal_partido' : 'gol_partido',
      exp: expGol,
      minuto
    });
  }

  // EXP por tiempo en cancha
  const todosTitulares = [...equipoA.titulares, ...equipoB.titulares];
  const todosSuplentes = [...(equipoA.suplentes || []), ...(equipoB.suplentes || [])];

  for (const t of todosTitulares) {
    const exp = Math.floor(duracionSegundos * EXP_TIEMPO.titular_por_segundo);
    if (exp > 0) {
      expEventos.push({ jugador_id: t.id, tipo: 'tiempo_cancha_titular', exp });
    }
  }

  for (const s of todosSuplentes) {
    const exp = Math.floor(duracionSegundos * EXP_TIEMPO.suplente_por_segundo);
    if (exp > 0) {
      expEventos.push({ jugador_id: s.id, tipo: 'tiempo_cancha_suplente', exp });
    }
  }

  // Ganador
  const ganador = golesA > golesB ? equipoA : golesB > golesA ? equipoB : null;

  // EXP por victoria
  if (ganador) {
    const expVictoria = EXP_TABLA.resultados[nivelTorneo].ganado;
    for (const j of [...ganador.titulares, ...(ganador.suplentes || [])]) {
      expEventos.push({ jugador_id: j.id, tipo: 'partido_ganado', exp: expVictoria });
    }
  }

  // MVP: jugador con más goles + EXP del partido
  const mvpId = calcularMVP(goles, expEventos);

  return {
    equipo_a_id: equipoA.id,
    equipo_b_id: equipoB.id,
    goles_a: golesA,
    goles_b: golesB,
    ganador_id: ganador?.id || null,
    goles,
    exp_eventos: expEventos,
    mvp_jugador_id: mvpId,
    duracion_segundos: duracionSegundos,
    empate: golesA === golesB
  };
}

// ============================================================
// HELPERS
// ============================================================

function simularGolesPorPartido(totalMinutos, rng) {
  // Poisson aproximado: λ = goles_por_minuto * totalMinutos
  const lambda = GOLES_POR_MINUTO * totalMinutos;
  let goles = 0;
  let p = Math.exp(-lambda);
  let s = p;
  const u = rng.next();
  while (u > s) {
    goles++;
    p *= lambda / goles;
    s += p;
    if (goles > 20) break; // safety cap
  }
  return goles;
}

function generarMinutosGoles(cantidad, totalMinutos, rng) {
  const minutos = [];
  for (let i = 0; i < cantidad; i++) {
    minutos.push(rng.float(0, totalMinutos));
  }
  return minutos.sort((a, b) => a - b);
}

function obtenerExpGol(nivelTorneo, fase, esPenal) {
  const tabla = EXP_TABLA.goles[nivelTorneo];
  return esPenal ? Math.floor(tabla[fase] * 0.7) : tabla[fase];
}

function calcularMVP(goles, expEventos) {
  // MVP = jugador con mayor suma de EXP en el partido
  const acumulado = {};
  for (const e of expEventos) {
    acumulado[e.jugador_id] = (acumulado[e.jugador_id] || 0) + e.exp;
  }
  // Bonus por goles
  for (const g of goles) {
    acumulado[g.jugador_id] = (acumulado[g.jugador_id] || 0) + 5;
  }
  let mvpId = null, maxExp = 0;
  for (const [id, exp] of Object.entries(acumulado)) {
    if (exp > maxExp) { maxExp = exp; mvpId = id; }
  }
  return mvpId;
}

// ============================================================
// TORNEO COMPLETO — FASE 1: ENTRENAMIENTO
// ============================================================

function simularFaseEntrenamiento(equipo, nivelTorneo, dtDecision = null, seed = null) {
  const rng = new PRNG(seed);
  const { jugadores } = equipo;

  if (jugadores.length !== 4) throw new Error('El equipo debe tener exactamente 4 jugadores');

  // 1. Penales individuales (todos los 4)
  const resultadosPenales = simularPenalesIndividuales(jugadores, nivelTorneo, rng);

  // 2. El DT elige 2 para el Super Penal (si no hay DT, IA elige aleatoriamente)
  let corredoresSP;
  if (dtDecision?.corredoresSuperPenal?.length === 2) {
    corredoresSP = dtDecision.corredoresSuperPenal;
  } else {
    corredoresSP = rng.shuffle(jugadores).slice(0, 2);
  }

  const suplentesObservando = jugadores.filter(j => !corredoresSP.find(c => c.id === j.id));

  // Super Penal contra... (en entrenamiento es contra sí mismo / fantasma)
  const superPenal = simularSuperPenal(
    { id: equipo.id, nombre: equipo.nombre, corredores: corredoresSP },
    { id: 'fantasma', nombre: 'Equipo Fantasma', corredores: [
      { id: 'g1', nombre: 'Robot G1' },
      { id: 'g2', nombre: 'Robot G2' }
    ]},
    suplentesObservando,
    [],
    rng
  );

  // 3. Partido de Entrenamiento (DT define titulares después de penales)
  let titulares, suplentes;
  if (dtDecision?.titulares?.length === 2) {
    const tIds = new Set(dtDecision.titulares.map(t => t.id));
    titulares = jugadores.filter(j => tIds.has(j.id));
    suplentes = jugadores.filter(j => !tIds.has(j.id));
  } else {
    titulares = jugadores.slice(0, 2);
    suplentes = jugadores.slice(2, 4);
  }

  const rivalEntrenamiento = generarEquipoFantasma(rng);
  const partidoEntrenamiento = simularPartido(
    { ...equipo, titulares, suplentes },
    rivalEntrenamiento,
    2, nivelTorneo, 'entrenamiento', rng
  );

  return {
    fase: 'entrenamiento',
    penales: resultadosPenales,
    super_penal: superPenal,
    partido_entrenamiento: partidoEntrenamiento,
    seed: rng.seed
  };
}

// ============================================================
// TORNEO — CLASIFICACIÓN (16 equipos → 8 ganadores)
// ============================================================

function simularClasificacion(equipos, nivelTorneo, seed = null) {
  const rng = new PRNG(seed);
  const equiposMezclados = rng.shuffle(equipos);
  const partidos = [];
  const ganadores = [];

  for (let i = 0; i < equiposMezclados.length; i += 2) {
    const ea = equiposMezclados[i];
    const eb = equiposMezclados[i + 1];

    if (!ea || !eb) continue;

    const resultado = simularPartido(
      { id: ea.id, nombre: ea.nombre, titulares: ea.titulares || ea.jugadores?.slice(0,2) || [], suplentes: ea.suplentes || ea.jugadores?.slice(2,4) || [] },
      { id: eb.id, nombre: eb.nombre, titulares: eb.titulares || eb.jugadores?.slice(0,2) || [], suplentes: eb.suplentes || eb.jugadores?.slice(2,4) || [] },
      3, nivelTorneo, 'clasificacion', rng
    );

    let ganadorPartido;
    if (resultado.empate) {
      // Desempate por Super Penal
      const sp = simularSuperPenal(
        { id: ea.id, nombre: ea.nombre, corredores: (ea.titulares || []).slice(0,2) },
        { id: eb.id, nombre: eb.nombre, corredores: (eb.titulares || []).slice(0,2) },
        [], [], rng
      );
      ganadorPartido = sp.ganador_id === ea.id ? ea : eb;
      resultado.super_penal_desempate = sp;
      resultado.ganador_id = ganadorPartido.id;
    } else {
      ganadorPartido = resultado.ganador_id === ea.id ? ea : eb;
    }

    partidos.push({ ...resultado, equipo_a: ea, equipo_b: eb });
    ganadores.push(ganadorPartido);
  }

  return { partidos, ganadores, seed: rng.seed };
}

// ============================================================
// TORNEO — COPA (8 equipos → 2 semifinales → 1 final)
// ============================================================

function simularCopa(equipos, nivelTorneo, seed = null) {
  const rng = new PRNG(seed);

  if (equipos.length !== 8) throw new Error('La Copa requiere exactamente 8 equipos');

  const mezclados = rng.shuffle(equipos);
  // Dos llaves de 4
  const llave1 = mezclados.slice(0, 4);
  const llave2 = mezclados.slice(4, 8);

  function jugarLlave(llave, label) {
    // Semifinal
    const sf1 = jugarPartidoEliminatoria(llave[0], llave[1], nivelTorneo, 'copa', rng);
    const sf2 = jugarPartidoEliminatoria(llave[2], llave[3], nivelTorneo, 'copa', rng);

    const finalista1 = equipos.find(e => e.id === sf1.ganador_id);
    const finalista2 = equipos.find(e => e.id === sf2.ganador_id);

    const final = jugarPartidoEliminatoria(finalista1, finalista2, nivelTorneo, 'copa', rng);
    const campeon = equipos.find(e => e.id === final.ganador_id);

    return { semifinales: [sf1, sf2], final, campeon, label };
  }

  const copa1 = jugarLlave(llave1, 'Copa Llave 1');
  const copa2 = jugarLlave(llave2, 'Copa Llave 2');

  return {
    llaves: [copa1, copa2],
    campeones: [copa1.campeon, copa2.campeon],
    seed: rng.seed
  };
}

function jugarPartidoEliminatoria(ea, eb, nivelTorneo, fase, rng) {
  const resultado = simularPartido(
    { id: ea.id, nombre: ea.nombre, titulares: ea.titulares || [], suplentes: ea.suplentes || [] },
    { id: eb.id, nombre: eb.nombre, titulares: eb.titulares || [], suplentes: eb.suplentes || [] },
    3, nivelTorneo, fase, rng
  );

  if (resultado.empate) {
    const sp = simularSuperPenal(
      { id: ea.id, nombre: ea.nombre, corredores: ea.titulares?.slice(0,2) || [] },
      { id: eb.id, nombre: eb.nombre, corredores: eb.titulares?.slice(0,2) || [] },
      ea.suplentes || [], eb.suplentes || [], rng
    );
    resultado.ganador_id = sp.ganador_id || (rng.bool() ? ea.id : eb.id);
    resultado.super_penal_desempate = sp;
  }

  return { ...resultado, equipo_a: ea, equipo_b: eb };
}

// ============================================================
// HELPER: equipo fantasma para entrenamiento
// ============================================================

function generarEquipoFantasma(rng) {
  return {
    id: 'fantasma_' + rng.int(1000, 9999),
    nombre: 'Equipo Fantasma',
    titulares: [
      { id: 'f1', nombre: 'Robot F1', habilidad: rng.float(-0.5, 0.5) },
      { id: 'f2', nombre: 'Robot F2', habilidad: rng.float(-0.5, 0.5) }
    ],
    suplentes: [
      { id: 'f3', nombre: 'Robot F3' },
      { id: 'f4', nombre: 'Robot F4' }
    ]
  };
}

// ============================================================
// EXPORTAR (Node.js y browser)
// ============================================================

const Motor = {
  PRNG,
  EXP_TABLA,
  simularPenalesIndividuales,
  simularSuperPenal,
  simularPartido,
  simularFaseEntrenamiento,
  simularClasificacion,
  simularCopa,
  calcularMVP
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Motor;
} else if (typeof window !== 'undefined') {
  window.RSMVMotor = Motor;
}
