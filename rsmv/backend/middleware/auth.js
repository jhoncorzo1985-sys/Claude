const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware de autenticación — verifica JWT de Supabase
 * Adjunta req.user con datos del perfil completo
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Cargar perfil completo
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = { ...user, perfil };
    next();
  } catch (err) {
    console.error('Error en autenticación:', err);
    res.status(500).json({ error: 'Error interno de autenticación' });
  }
}

/**
 * Middleware opcional — no bloquea si no hay token
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  try {
    await requireAuth(req, res, next);
  } catch {
    next();
  }
}

module.exports = { requireAuth, optionalAuth };
