/**
 * RSMV — Robot Soccer Mare Virtual
 * Backend API Server
 * Marelab © 2025 — Jhon Carlos Corzo Vega
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// SEGURIDAD Y MIDDLEWARE
// ============================================================

app.use(helmet());

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://rsmv.marelab.co',
    'https://marelab.co'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  message: { error: 'Demasiadas solicitudes. Intenta en unos minutos.' }
});
app.use('/api', limiter);

// Rate limiting más estricto para auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: { error: 'Demasiados intentos de autenticación. Espera una hora.' }
});

// ============================================================
// RUTAS
// ============================================================

const authRoutes     = require('./routes/auth');
const jugadoresRoutes = require('./routes/jugadores');
const equiposRoutes  = require('./routes/equipos');
const torneosRoutes  = require('./routes/torneos');
const marecoinRoutes = require('./routes/marecoin');

app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/equipos',   equiposRoutes);
app.use('/api/torneos',   torneosRoutes);
app.use('/api/marecoin',  marecoinRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RSMV API',
    version: '1.0.0',
    empresa: 'Marelab',
    timestamp: new Date().toISOString()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    name: 'RSMV API — Robot Soccer Mare Virtual',
    description: 'Manager game de robots de fútbol. Colombia 🇨🇴',
    empresa: 'Marelab',
    founder: 'Jhon Carlos Corzo Vega',
    web: 'https://marelab.co',
    version: '1.0.0-mvp',
    endpoints: {
      auth: '/api/auth',
      jugadores: '/api/jugadores',
      equipos: '/api/equipos',
      torneos: '/api/torneos',
      marecoin: '/api/marecoin'
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  RSMV API — Robot Soccer Mare Virtual  ║
║  Puerto: ${PORT}                          ║
║  Marelab © 2025                        ║
╚════════════════════════════════════════╝
  `);
  console.log(`🤖 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
