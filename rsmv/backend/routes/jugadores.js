/**
 * RSMV — Rutas de Jugadores
 * GET  /api/jugadores/:id           — Ver perfil (cuesta MC si es rival)
 * GET  /api/jugadores/:id/historial — Historial EXP (cuesta MC)
 * GET  /api/jugadores/ranking       — Ranking general
 */

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { cobrar, puedePagar } = require('../services/marecoin');

// GET /api/jugadores/ranking
router.get('/ranking', async (req, res) => {
  const { limit = 50, nivel } = req.query;

  let query = supabaseAdmin
    .from('jugadores')
    .select(`
      id, exp_total, nivel, goles_partido, goles_penales,
      partidos_ganados, mvp_torneos,
      perfiles!jugadores_user_id_fkey(nombre_completo, ciudad),
      equipos(nombre)
    `)
    .order('exp_total', { ascending: false })
    .limit(parseInt(limit));

  if (nivel) query = query.eq('nivel', nivel);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Error obteniendo ranking' });

  res.json(data);
});

// GET /api/jugadores/:id — Ver perfil de jugador
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Determinar si es el propio perfil
  const { data: jugadorTarget } = await supabaseAdmin
    .from('jugadores')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!jugadorTarget) return res.status(404).json({ error: 'Jugador no encontrado' });

  const esPropioJugador = jugadorTarget.user_id === userId;

  // Si es rival, cobrar MC
  if (!esPropioJugador) {
    try {
      await cobrar(userId, 'ver_exp_rival', `Ver EXP de jugador ${id}`);
    } catch (err) {
      if (err.code === 'MARECOIN_INSUFICIENTE') {
        return res.status(402).json({
          error: 'Marecoin insuficiente',
          saldo: err.saldoActual,
          costo: err.costoRequerido,
          message: 'Necesitas más Marecoin para ver las estadísticas de este jugador'
        });
      }
      throw err;
    }
  } else {
    // Ver propio EXP también tiene costo (3 MC)
    try {
      await cobrar(userId, 'ver_propio_exp', 'Ver mis estadísticas');
    } catch (err) {
      if (err.code === 'MARECOIN_INSUFICIENTE') {
        return res.status(402).json({
          error: 'Marecoin insuficiente',
          saldo: err.saldoActual,
          costo: err.costoRequerido,
          message: 'Necesitas 3 Marecoin para ver tus estadísticas'
        });
      }
      throw err;
    }
  }

  // Obtener datos completos
  const { data: jugador, error } = await supabaseAdmin
    .from('jugadores')
    .select(`
      *,
      perfiles!jugadores_user_id_fkey(nombre_completo, ciudad, avatar_url),
      equipos(nombre, academia_id, academias(nombre, ciudad, liga))
    `)
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: 'Error cargando datos del jugador' });

  res.json({ jugador, esPropio: esPropioJugador });
});

// GET /api/jugadores/:id/historial — Historial de EXP
router.get('/:id/historial', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { limit = 20, page = 1 } = req.query;
  const userId = req.user.id;

  // Verificar que sea el propio jugador
  const { data: jugador } = await supabaseAdmin
    .from('jugadores')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!jugador || jugador.user_id !== userId) {
    return res.status(403).json({ error: 'Solo puedes ver tu propio historial de EXP' });
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { data, error } = await supabaseAdmin
    .from('exp_log')
    .select('*, partidos(fase, equipo_a_id, equipo_b_id, goles_a, goles_b)')
    .eq('jugador_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) return res.status(500).json({ error: 'Error cargando historial' });

  res.json(data);
});

// GET /api/jugadores/:id/puede-pagar — Verificar saldo sin cobrar
router.get('/:id/puede-pagar', requireAuth, async (req, res) => {
  const { accion } = req.query;
  if (!accion) return res.status(400).json({ error: 'Parámetro accion requerido' });

  const resultado = await puedePagar(req.user.id, accion);
  res.json(resultado);
});

module.exports = router;
