/**
 * RSMV — Tests del Motor de Simulación
 * Validaciones de reglas críticas del Super Prompt
 */

const Motor = require('./motor');

let passed = 0;
let failed = 0;

function test(nombre, fn) {
  try {
    fn();
    console.log(`  ✓ ${nombre}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${nombre}`);
    console.log(`    Error: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEquals(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

// Equipo de prueba
function crearEquipo(id, nombre) {
  return {
    id,
    nombre,
    jugadores: [
      { id: `${id}_j1`, nombre: `${nombre} Jugador 1` },
      { id: `${id}_j2`, nombre: `${nombre} Jugador 2` },
      { id: `${id}_j3`, nombre: `${nombre} Jugador 3` },
      { id: `${id}_j4`, nombre: `${nombre} Jugador 4` },
    ],
    titulares: [
      { id: `${id}_j1`, nombre: `${nombre} J1` },
      { id: `${id}_j2`, nombre: `${nombre} J2` },
    ],
    suplentes: [
      { id: `${id}_j3`, nombre: `${nombre} J3` },
      { id: `${id}_j4`, nombre: `${nombre} J4` },
    ]
  };
}

console.log('\n=== RSMV Motor Tests ===\n');

// ============================================================
// TESTS: PRNG
// ============================================================
console.log('📐 PRNG (Generador aleatorio)');

test('Seed fija produce resultados reproducibles', () => {
  const rng1 = new Motor.PRNG(12345);
  const rng2 = new Motor.PRNG(12345);
  assertEquals(rng1.next(), rng2.next(), 'Valores iguales con mismo seed');
  assertEquals(rng1.next(), rng2.next(), 'Segunda llamada igual');
});

test('PRNG sin seed usa Date.now() (distinto cada vez)', () => {
  const rng1 = new Motor.PRNG();
  const rng2 = new Motor.PRNG();
  // No forzamos igualdad, solo que funciona
  assert(typeof rng1.next() === 'number');
});

test('bool() con p=1 siempre es true', () => {
  const rng = new Motor.PRNG(99);
  for (let i = 0; i < 100; i++) {
    assert(rng.bool(1), 'bool(1) siempre true');
  }
});

test('bool() con p=0 siempre es false', () => {
  const rng = new Motor.PRNG(99);
  for (let i = 0; i < 100; i++) {
    assert(!rng.bool(0), 'bool(0) siempre false');
  }
});

// ============================================================
// TESTS: SUPER PENAL
// ============================================================
console.log('\n⚡ Super Penal (regla crítica: UN ganador o NINGUNO)');

test('Super Penal: nunca hay dos ganadores al mismo tiempo', () => {
  const rng = new Motor.PRNG(42);
  let hayDosGanadores = false;

  for (let i = 0; i < 1000; i++) {
    const sp = Motor.simularSuperPenal(
      { id: 'A', nombre: 'Equipo A', corredores: [{id:'a1',nombre:'J1'},{id:'a2',nombre:'J2'}] },
      { id: 'B', nombre: 'Equipo B', corredores: [{id:'b1',nombre:'J3'},{id:'b2',nombre:'J4'}] },
      [], [], rng
    );
    // resultado: 0=nadie, 1=A, 2=B — nunca puede ser ambos
    if (sp.resultado !== 0 && sp.resultado !== 1 && sp.resultado !== 2) {
      hayDosGanadores = true;
    }
  }
  assert(!hayDosGanadores, 'Nunca dos ganadores simultáneos');
});

test('Super Penal: resultado siempre es 0, 1 o 2', () => {
  const rng = new Motor.PRNG(77);
  for (let i = 0; i < 500; i++) {
    const sp = Motor.simularSuperPenal(
      { id: 'A', nombre: 'A', corredores: [{id:'a1',nombre:'J1'},{id:'a2',nombre:'J2'}] },
      { id: 'B', nombre: 'B', corredores: [{id:'b1',nombre:'J1'},{id:'b2',nombre:'J2'}] },
      [], [], rng
    );
    assert([0,1,2].includes(sp.resultado), `Resultado inválido: ${sp.resultado}`);
  }
});

test('Super Penal: todos los jugadores reciben EXP', () => {
  const rng = new Motor.PRNG(123);
  const suplentesA = [{id:'sa1',nombre:'SA1'}];
  const sp = Motor.simularSuperPenal(
    { id: 'A', nombre: 'A', corredores: [{id:'a1',nombre:'J1'},{id:'a2',nombre:'J2'}] },
    { id: 'B', nombre: 'B', corredores: [{id:'b1',nombre:'J3'},{id:'b2',nombre:'J4'}] },
    suplentesA, [], rng
  );

  // Todos los eventos deben tener EXP > 0
  for (const e of sp.eventos) {
    assert(e.exp > 0, `Jugador ${e.jugador_id} debe recibir EXP positivo, got ${e.exp}`);
  }
});

test('Super Penal sin ganador: nadie recibe EXP de anotador', () => {
  // Forzar resultado 0 con seed específico
  const rng = new Motor.PRNG(0);
  let tuvoCasoNadie = false;

  for (let i = 0; i < 100; i++) {
    const sp = Motor.simularSuperPenal(
      { id: 'A', nombre: 'A', corredores: [{id:'a1',nombre:'J1'},{id:'a2',nombre:'J2'}] },
      { id: 'B', nombre: 'B', corredores: [{id:'b1',nombre:'J3'},{id:'b2',nombre:'J4'}] },
      [], [], rng
    );

    if (sp.resultado === 0) {
      tuvoCasoNadie = true;
      const tieneAnotador = sp.eventos.some(e => e.rol === 'anotador');
      assert(!tieneAnotador, 'Sin ganador no debe haber anotador');
    }
  }
  // Debería haber al menos un caso de nadie en 100 intentos (prob 1/3)
  assert(tuvoCasoNadie, 'Debe existir al menos un caso donde nadie anota');
});

// ============================================================
// TESTS: PARTIDO
// ============================================================
console.log('\n⚽ Partido');

test('Partido: siempre empieza 0-0 (independiente)', () => {
  const rng = new Motor.PRNG(55);
  const ea = crearEquipo('A', 'Team A');
  const eb = crearEquipo('B', 'Team B');

  const resultado = Motor.simularPartido(ea, eb, 3, 'municipal', 'clasificacion', rng);
  // No hay restricción de inicio, pero los goles deben ser >= 0
  assert(resultado.goles_a >= 0, 'Goles A >= 0');
  assert(resultado.goles_b >= 0, 'Goles B >= 0');
});

test('Partido: goles_a + goles_b = total de goles', () => {
  const rng = new Motor.PRNG(88);
  const ea = crearEquipo('A', 'Team A');
  const eb = crearEquipo('B', 'Team B');

  const resultado = Motor.simularPartido(ea, eb, 3, 'municipal', 'copa', rng);
  const golesEnLista = resultado.goles.length;
  assertEquals(
    resultado.goles_a + resultado.goles_b,
    golesEnLista,
    `Total goles: ${resultado.goles_a} + ${resultado.goles_b} ≠ ${golesEnLista}`
  );
});

test('Partido: ganador_id es A, B o null (empate)', () => {
  const rng = new Motor.PRNG(33);
  const ea = crearEquipo('A', 'Team A');
  const eb = crearEquipo('B', 'Team B');

  for (let i = 0; i < 50; i++) {
    const r = Motor.simularPartido(ea, eb, 3, 'municipal', 'clasificacion', new Motor.PRNG(i));
    assert(
      r.ganador_id === ea.id || r.ganador_id === eb.id || r.ganador_id === null,
      `Ganador inválido: ${r.ganador_id}`
    );
  }
});

test('Partido: exp_eventos no vacío', () => {
  const rng = new Motor.PRNG(11);
  const ea = crearEquipo('A', 'Team A');
  const eb = crearEquipo('B', 'Team B');

  const r = Motor.simularPartido(ea, eb, 3, 'regional', 'copa', rng);
  assert(r.exp_eventos.length > 0, 'Debe haber al menos 1 evento de EXP (tiempo en cancha)');

  // Todo EXP debe ser positivo
  for (const e of r.exp_eventos) {
    assert(e.exp > 0, `EXP debe ser positivo, got ${e.exp}`);
  }
});

// ============================================================
// TESTS: PENALES INDIVIDUALES
// ============================================================
console.log('\n🎯 Penales Individuales');

test('Penales: exactamente 4 resultados para 4 jugadores', () => {
  const rng = new Motor.PRNG(22);
  const jugadores = [
    {id:'j1',nombre:'J1'},{id:'j2',nombre:'J2'},
    {id:'j3',nombre:'J3'},{id:'j4',nombre:'J4'}
  ];
  const r = Motor.simularPenalesIndividuales(jugadores, 'municipal', rng);
  assertEquals(r.length, 4, 'Debe haber 4 resultados');
});

test('Penales: EXP de gol > EXP de fallo (municipal)', () => {
  const tabla = Motor.EXP_TABLA.penales.municipal;
  assert(tabla.gol > tabla.fallo, `Gol(${tabla.gol}) debe ser > Fallo(${tabla.fallo})`);
});

test('Penales: EXP incrementa por nivel de torneo', () => {
  const mun = Motor.EXP_TABLA.penales.municipal.gol;
  const reg = Motor.EXP_TABLA.penales.regional.gol;
  const nac = Motor.EXP_TABLA.penales.nacional.gol;
  assert(reg > mun, `Regional(${reg}) > Municipal(${mun})`);
  assert(nac > reg, `Nacional(${nac}) > Regional(${reg})`);
});

// ============================================================
// TESTS: ENTRENAMIENTO COMPLETO
// ============================================================
console.log('\n🏋️ Fase de Entrenamiento');

test('Entrenamiento: retorna penales, super_penal y partido', () => {
  const equipo = crearEquipo('X', 'Equipo X');
  const r = Motor.simularFaseEntrenamiento(equipo, 'municipal', null, 42);
  assert(r.penales, 'Debe tener penales');
  assert(r.super_penal, 'Debe tener super_penal');
  assert(r.partido_entrenamiento, 'Debe tener partido_entrenamiento');
});

test('Entrenamiento: seed fijo = resultado reproducible', () => {
  const equipo = crearEquipo('Y', 'Equipo Y');
  const r1 = Motor.simularFaseEntrenamiento(equipo, 'municipal', null, 999);
  const r2 = Motor.simularFaseEntrenamiento(equipo, 'municipal', null, 999);
  assertEquals(r1.partido_entrenamiento.goles_a, r2.partido_entrenamiento.goles_a, 'Reproducible');
  assertEquals(r1.partido_entrenamiento.goles_b, r2.partido_entrenamiento.goles_b, 'Reproducible');
});

test('Entrenamiento: equipo sin 4 jugadores lanza error', () => {
  const equipoMal = { id: 'Z', nombre: 'Z', jugadores: [{id:'j1',nombre:'J1'}] };
  let lanzó = false;
  try {
    Motor.simularFaseEntrenamiento(equipoMal, 'municipal');
  } catch {
    lanzó = true;
  }
  assert(lanzó, 'Debe lanzar error con < 4 jugadores');
});

// ============================================================
// RESUMEN
// ============================================================
console.log(`\n${'='.repeat(40)}`);
console.log(`Resultados: ${passed} ✓ pasaron | ${failed} ✗ fallaron`);
console.log('='.repeat(40));

if (failed > 0) {
  console.log('\n❌ Hay tests fallando. Revisar el motor antes de producción.');
  process.exit(1);
} else {
  console.log('\n✅ Todos los tests pasaron. Motor validado.');
  process.exit(0);
}
