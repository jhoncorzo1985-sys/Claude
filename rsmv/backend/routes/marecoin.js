/**
 * RSMV — Rutas de Marecoin
 * GET  /api/marecoin/saldo      — Ver saldo actual
 * GET  /api/marecoin/historial  — Historial de transacciones
 * GET  /api/marecoin/tarifas    — Listar tarifas
 * POST /api/marecoin/comprar    — Comprar MC con pesos COP
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getSaldo, getHistorial, acreditar } = require('../services/marecoin');
const { supabaseAdmin } = require('../config/supabase');

// GET /api/marecoin/saldo
router.get('/saldo', requireAuth, async (req, res) => {
  try {
    const saldo = await getSaldo(req.user.id);
    res.json({ saldo, moneda: 'MC', usuario: req.user.id });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo saldo' });
  }
});

// GET /api/marecoin/historial
router.get('/historial', requireAuth, async (req, res) => {
  const { limit = 50 } = req.query;
  try {
    const historial = await getHistorial(req.user.id, parseInt(limit));
    res.json(historial);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
});

// GET /api/marecoin/tarifas
router.get('/tarifas', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('marecoin_tarifas')
    .select('accion, costo, descripcion')
    .eq('activo', true)
    .order('costo', { ascending: true });

  if (error) return res.status(500).json({ error: 'Error cargando tarifas' });
  res.json(data);
});

// POST /api/marecoin/comprar — Simulación de compra (MVP)
// NOTA: Integrar con PSE/PayU/Wompi antes de producción.
// NOTA LEGAL: Verificar regulación colombiana de monedas virtuales.
router.post('/comprar', requireAuth, async (req, res) => {
  const PAQUETES = [
    { id: 'starter',    mc: 100,  cop: 5000,    nombre: 'Starter' },
    { id: 'jugador',    mc: 300,  cop: 12000,   nombre: 'Jugador' },
    { id: 'campeon',    mc: 1000, cop: 35000,   nombre: 'Campeón' },
    { id: 'leyenda',    mc: 5000, cop: 150000,  nombre: 'Leyenda RSMV' }
  ];

  const { paquete_id } = req.body;
  if (!paquete_id) return res.status(400).json({ error: 'paquete_id requerido', paquetes: PAQUETES });

  const paquete = PAQUETES.find(p => p.id === paquete_id);
  if (!paquete) return res.status(400).json({ error: 'Paquete no válido', paquetes: PAQUETES });

  // MVP: acreditar directamente (sin pasarela de pago real aún)
  // TODO: Integrar Wompi/PayU aquí antes de producción
  try {
    const resultado = await acreditar(
      req.user.id,
      paquete.mc,
      'compra',
      `Compra paquete ${paquete.nombre} — ${paquete.mc} MC`,
    );

    res.json({
      message: `¡Compraste ${paquete.mc} Marecoin!`,
      paquete: paquete.nombre,
      mc_acreditados: paquete.mc,
      saldo_nuevo: resultado.saldoNuevo,
      nota: 'MVP: pago simulado. Integración PSE/Wompi pendiente.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error procesando compra' });
  }
});

module.exports = router;
