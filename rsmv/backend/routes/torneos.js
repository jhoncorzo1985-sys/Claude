/**
 * RSMV — Rutas de Torneos
 * GET  /api/torneos            — Listar torneos activos
 * GET  /api/torneos/:id        — Detalle de torneo
 * POST /api/torneos            — Crear torneo (admin)
 * POST /api/torneos/:id/inscribir — Inscribir equipo
 * POST /api/torneos/:id/iniciar   — Iniciar torneo (simular)
 * GET  /api/torneos/:id/bracket   — Ver bracket
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { emailInicioTorneo } = require('../services/email');

// GET /api/torneos
router.get('/', async (req, res) => {
  const { tipo, estado } = req.query;

  let query = supabaseAdmin
    .from('torneos')
    .select(`
      id, nombre, tipo, estado, modo, fecha_inicio, premio_total,
      academias(nombre, ciudad),
      torneo_equipos(equipo_id, campeon, clasifico_copa)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (tipo) query = query.eq('tipo', tipo);
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Error cargando torneos' });

  res.json(data);
});

// GET /api/torneos/:id
router.get('/:id', async (req, res) => {
  const { data: torneo, error } = await supabaseAdmin
    .from('torneos')
    .select(`
      *,
      academias(nombre, ciudad, liga),
      torneo_equipos(
        equipo_id, clasifico_copa, campeon, posicion_final, premio_ganado,
        equipos(nombre, jugadores(nivel, exp_total, perfiles!jugadores_user_id_fkey(nombre_completo)))
      ),
      partidos(
        id, fase, equipo_a_id, equipo_b_id, goles_a, goles_b,
        ganador_id, estado,
        equipo_a:equipos!partidos_equipo_a_id_fkey(nombre),
        equipo_b:equipos!partidos_equipo_b_id_fkey(nombre)
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !torneo) return res.status(404).json({ error: 'Torneo no encontrado' });
  res.json(torneo);
});

// GET /api/torneos/:id/bracket
router.get('/:id/bracket', async (req, res) => {
  const { data: partidos, error } = await supabaseAdmin
    .from('partidos')
    .select(`
      id, fase, goles_a, goles_b, ganador_id, estado,
      super_penal_ganador,
      equipo_a:equipos!partidos_equipo_a_id_fkey(id, nombre),
      equipo_b:equipos!partidos_equipo_b_id_fkey(id, nombre),
      ganador:equipos!partidos_ganador_id_fkey(id, nombre)
    `)
    .eq('torneo_id', req.params.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'Error cargando bracket' });

  // Agrupar por fase
  const bracket = {};
  for (const p of partidos) {
    if (!bracket[p.fase]) bracket[p.fase] = [];
    bracket[p.fase].push(p);
  }

  res.json(bracket);
});

// POST /api/torneos — Crear torneo
router.post('/', requireAuth, async (req, res) => {
  const schema = Joi.object({
    nombre: Joi.string().required(),
    tipo: Joi.string().valid('municipal', 'regional', 'nacional').required(),
    modo: Joi.string().valid('evento', 'express').default('evento'),
    fecha_inicio: Joi.string().isoDate().optional(),
    premio_total: Joi.number().integer().min(0).default(0),
    academia_id: Joi.string().uuid().optional(),
    seed_simulacion: Joi.number().integer().optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { data: torneo, error: createError } = await supabaseAdmin
    .from('torneos')
    .insert(value)
    .select()
    .single();

  if (createError) return res.status(500).json({ error: 'Error creando torneo' });
  res.status(201).json(torneo);
});

// POST /api/torneos/:id/inscribir — Inscribir equipo
router.post('/:id/inscribir', requireAuth, async (req, res) => {
  const { equipo_id } = req.body;
  const torneoId = req.params.id;

  if (!equipo_id) return res.status(400).json({ error: 'equipo_id requerido' });

  const { data: torneo } = await supabaseAdmin
    .from('torneos')
    .select('estado, tipo')
    .eq('id', torneoId)
    .single();

  if (!torneo) return res.status(404).json({ error: 'Torneo no encontrado' });
  if (torneo.estado !== 'pendiente') {
    return res.status(400).json({ error: 'El torneo ya no acepta inscripciones' });
  }

  // Verificar que no esté ya inscrito
  const { data: yaInscrito } = await supabaseAdmin
    .from('torneo_equipos')
    .select('equipo_id')
    .eq('torneo_id', torneoId)
    .eq('equipo_id', equipo_id)
    .single();

  if (yaInscrito) return res.status(409).json({ error: 'El equipo ya está inscrito' });

  // Verificar límite de equipos
  const { count } = await supabaseAdmin
    .from('torneo_equipos')
    .select('equipo_id', { count: 'exact' })
    .eq('torneo_id', torneoId);

  const limites = { municipal: 16, regional: 16, nacional: 16 };
  if (count >= limites[torneo.tipo]) {
    return res.status(400).json({ error: `Torneo lleno (máximo ${limites[torneo.tipo]} equipos)` });
  }

  await supabaseAdmin.from('torneo_equipos').insert({ torneo_id: torneoId, equipo_id });

  // Notificar a jugadores del equipo
  const { data: jugadoresEquipo } = await supabaseAdmin
    .from('jugadores')
    .select('perfiles!jugadores_user_id_fkey(email, nombre_completo), equipos(nombre)')
    .eq('equipo_id', equipo_id);

  const torneoData = await supabaseAdmin.from('torneos').select('nombre, tipo, fecha_inicio').eq('id', torneoId).single();

  for (const j of jugadoresEquipo || []) {
    if (j.perfiles?.email) {
      emailInicioTorneo(j.perfiles.email, j.perfiles.nombre_completo, {
        nombre: torneoData.data?.nombre,
        tipo: torneoData.data?.tipo,
        fecha: torneoData.data?.fecha_inicio,
        equipoNombre: j.equipos?.nombre
      }).catch(console.error);
    }
  }

  res.json({ message: 'Equipo inscrito exitosamente' });
});

module.exports = router;
