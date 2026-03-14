/**
 * RSMV — Rutas de Autenticación
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { acreditar } = require('../services/marecoin');
const { emailBienvenida } = require('../services/email');

const schemaRegistro = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  nombre_completo: Joi.string().min(2).max(200).required(),
  ciudad: Joi.string().max(100).optional(),
  whatsapp: Joi.string().max(20).optional()
});

const schemaLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { error, value } = schemaRegistro.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: value.email,
      password: value.password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ error: 'Este email ya está registrado' });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Crear perfil
    await supabaseAdmin.from('perfiles').insert({
      id: userId,
      nombre_completo: value.nombre_completo,
      email: value.email,
      ciudad: value.ciudad || null,
      whatsapp: value.whatsapp || null,
      marecoin_saldo: 0
    });

    // 3. Crear registro de jugador (vacío, sin equipo)
    await supabaseAdmin.from('jugadores').insert({
      user_id: userId
    });

    // 4. Dar Marecoin de bienvenida (50 MC)
    await acreditar(userId, 50, 'ganancia_partido', 'Marecoin de bienvenida a RSMV');

    // 5. Email de bienvenida (no bloquea si falla)
    emailBienvenida(value.email, value.nombre_completo).catch(console.error);

    res.status(201).json({
      message: '¡Registro exitoso! Bienvenido a RSMV.',
      user: { id: userId, email: value.email, nombre: value.nombre_completo },
      marecoin_bienvenida: 50
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error en el registro. Intenta de nuevo.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { error, value } = schemaLogin.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const { data, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: value.email,
      password: value.password
    });

    if (loginError) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Cargar perfil completo
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const { data: jugador } = await supabaseAdmin
      .from('jugadores')
      .select('*, equipos(nombre)')
      .eq('user_id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        perfil,
        jugador
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token requerido' });

  try {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Token inválido' });

    res.json({ token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch (err) {
    res.status(500).json({ error: 'Error al refrescar sesión' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await supabaseAdmin.auth.admin.signOut(req.user.id);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const [{ data: perfil }, { data: jugador }, { data: dt }] = await Promise.all([
    supabaseAdmin.from('perfiles').select('*').eq('id', userId).single(),
    supabaseAdmin.from('jugadores').select('*, equipos(nombre, academia_id)').eq('user_id', userId).single(),
    supabaseAdmin.from('directores_tecnicos').select('*, equipos(nombre)').eq('user_id', userId).single()
  ]);

  res.json({ perfil, jugador, dt });
});

module.exports = router;
