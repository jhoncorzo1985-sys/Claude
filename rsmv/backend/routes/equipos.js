/**
 * RSMV — Rutas de Equipos y DTs
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

const schemaEquipo = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  academia_id: Joi.string().uuid().required()
});

// GET /api/equipos — Listar equipos
router.get('/', async (req, res) => {
  const { academia_id, liga } = req.query;

  let query = supabaseAdmin
    .from('equipos')
    .select(`
      id, nombre, activo,
      academias(nombre, ciudad, liga),
      perfiles!equipos_dueno_user_id_fkey(nombre_completo),
      jugadores(id, nivel, exp_total)
    `)
    .eq('activo', true);

  if (academia_id) query = query.eq('academia_id', academia_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Error cargando equipos' });

  res.json(data);
});

// GET /api/equipos/:id — Detalle de un equipo
router.get('/:id', async (req, res) => {
  const { data: equipo, error } = await supabaseAdmin
    .from('equipos')
    .select(`
      *,
      academias(nombre, ciudad, liga),
      perfiles!equipos_dueno_user_id_fkey(nombre_completo, ciudad),
      directores_tecnicos!directores_tecnicos_equipo_id_fkey(
        exp_dt, nivel,
        perfiles!directores_tecnicos_user_id_fkey(nombre_completo)
      ),
      jugadores(
        id, rol, exp_total, nivel, goles_partido, goles_penales,
        partidos_jugados, partidos_ganados,
        perfiles!jugadores_user_id_fkey(nombre_completo, ciudad)
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
  res.json(equipo);
});

// POST /api/equipos — Crear equipo (requiere ser dueño/licenciante)
router.post('/', requireAuth, async (req, res) => {
  const { error: valError, value } = schemaEquipo.validate(req.body);
  if (valError) return res.status(400).json({ error: valError.details[0].message });

  const userId = req.user.id;

  // Verificar que no tenga equipo ya
  const { data: equipoExistente } = await supabaseAdmin
    .from('equipos')
    .select('id')
    .eq('dueno_user_id', userId)
    .single();

  if (equipoExistente) {
    return res.status(409).json({ error: 'Ya eres dueño de un equipo. Un dueño por equipo.' });
  }

  // Verificar nombre único
  const { data: nombreTomado } = await supabaseAdmin
    .from('equipos')
    .select('id')
    .eq('nombre', value.nombre)
    .single();

  if (nombreTomado) {
    return res.status(409).json({ error: 'Este nombre de equipo ya está tomado' });
  }

  const { data: equipo, error } = await supabaseAdmin
    .from('equipos')
    .insert({ ...value, dueno_user_id: userId })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Error creando equipo' });

  // Actualizar perfil como dueño
  await supabaseAdmin.from('perfiles').update({ es_dueno: true, equipo_id: equipo.id }).eq('id', userId);
  await supabaseAdmin.from('jugadores').update({ equipo_id: equipo.id }).eq('user_id', userId);

  res.status(201).json(equipo);
});

// POST /api/equipos/:id/unirse — Un jugador se une a un equipo
router.post('/:id/unirse', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const equipoId = req.params.id;

  // Verificar que el equipo existe
  const { data: equipo } = await supabaseAdmin
    .from('equipos')
    .select('id, dt_id')
    .eq('id', equipoId)
    .single();

  if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });

  // Verificar que no sea el DT del mismo equipo
  if (equipo.dt_id === userId) {
    return res.status(400).json({ error: 'El DT no puede ser jugador del mismo equipo' });
  }

  // Contar jugadores actuales
  const { count } = await supabaseAdmin
    .from('jugadores')
    .select('id', { count: 'exact' })
    .eq('equipo_id', equipoId);

  if (count >= 4) {
    return res.status(409).json({ error: 'El equipo ya tiene 4 jugadores (máximo permitido)' });
  }

  // Asignar jugador al equipo
  const { error } = await supabaseAdmin
    .from('jugadores')
    .update({ equipo_id: equipoId, rol: count < 2 ? 'titular' : 'suplente' })
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: 'Error uniéndose al equipo' });

  await supabaseAdmin.from('perfiles').update({ equipo_id: equipoId }).eq('id', userId);

  res.json({ message: 'Te uniste al equipo exitosamente', rol: count < 2 ? 'titular' : 'suplente' });
});

// POST /api/equipos/:id/asignar-dt — Asignar DT al equipo
router.post('/:id/asignar-dt', requireAuth, async (req, res) => {
  const { dt_user_id } = req.body;
  const equipoId = req.params.id;
  const userId = req.user.id;

  if (!dt_user_id) return res.status(400).json({ error: 'dt_user_id requerido' });

  // Solo el dueño puede asignar DT
  const { data: equipo } = await supabaseAdmin
    .from('equipos')
    .select('dueno_user_id')
    .eq('id', equipoId)
    .single();

  if (!equipo || equipo.dueno_user_id !== userId) {
    return res.status(403).json({ error: 'Solo el dueño puede asignar el DT' });
  }

  // DT no puede ser jugador del mismo equipo
  const { data: jugadorEnEquipo } = await supabaseAdmin
    .from('jugadores')
    .select('id')
    .eq('user_id', dt_user_id)
    .eq('equipo_id', equipoId)
    .single();

  if (jugadorEnEquipo) {
    return res.status(400).json({ error: 'El DT no puede ser jugador del mismo equipo. Regla RSMV.' });
  }

  // Asignar DT
  await supabaseAdmin.from('equipos').update({ dt_user_id }).eq('id', equipoId);

  // Crear o actualizar registro DT
  const { data: dtExistente } = await supabaseAdmin
    .from('directores_tecnicos')
    .select('id')
    .eq('user_id', dt_user_id)
    .single();

  if (dtExistente) {
    await supabaseAdmin.from('directores_tecnicos')
      .update({ equipo_id: equipoId })
      .eq('user_id', dt_user_id);
  } else {
    await supabaseAdmin.from('directores_tecnicos')
      .insert({ user_id: dt_user_id, equipo_id: equipoId });
  }

  await supabaseAdmin.from('perfiles')
    .update({ es_dt: true, equipo_id: equipoId })
    .eq('id', dt_user_id);

  res.json({ message: 'DT asignado correctamente' });
});

// PATCH /api/equipos/:id/alineacion — DT ajusta titulares/suplentes
router.patch('/:id/alineacion', requireAuth, async (req, res) => {
  const { titulares } = req.body; // Array de 2 user_ids
  const equipoId = req.params.id;
  const userId = req.user.id;

  if (!Array.isArray(titulares) || titulares.length !== 2) {
    return res.status(400).json({ error: 'Se requieren exactamente 2 titulares' });
  }

  // Verificar que sea el DT del equipo
  const { data: equipo } = await supabaseAdmin
    .from('equipos')
    .select('dt_user_id, dueno_user_id')
    .eq('id', equipoId)
    .single();

  if (!equipo || (equipo.dt_user_id !== userId && equipo.dueno_user_id !== userId)) {
    return res.status(403).json({ error: 'Solo el DT o dueño puede modificar la alineación' });
  }

  // Actualizar roles
  const { data: jugadores } = await supabaseAdmin
    .from('jugadores')
    .select('id, user_id')
    .eq('equipo_id', equipoId);

  for (const j of jugadores) {
    const esTitular = titulares.includes(j.user_id);
    await supabaseAdmin.from('jugadores')
      .update({ rol: esTitular ? 'titular' : 'suplente' })
      .eq('id', j.id);
  }

  res.json({ message: 'Alineación actualizada' });
});

module.exports = router;
