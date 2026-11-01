---
tags: [técnico, backend, api, express, nodejs]
created: 2026-04-12
---

# 🔧 Backend API — RSMV

[[HOME]] | [[RSMV - Stack Técnico]] | [[Autenticación y Seguridad]]

---

## Setup Rápido

```bash
cd rsmv/backend
cp .env.example .env
# Completar variables en .env
npm install
npm run dev
```

---

## Variables de Entorno

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
PORT=3001
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=noreply@marelab.co
APP_URL=https://rsmv.marelab.co
```

---

## Dependencias Principales

| Paquete | Uso |
|---------|-----|
| `express` | Framework web |
| `cors` | Manejo de CORS |
| `helmet` | Headers de seguridad |
| `express-rate-limit` | Rate limiting |
| `@supabase/supabase-js` | Cliente Supabase |
| `dotenv` | Variables de entorno |
| `resend` | Emails transaccionales |

---

## Rutas de la API

### Auth (`/api/auth`)
```
POST   /api/auth/register    → Crear cuenta
POST   /api/auth/login       → Iniciar sesión
POST   /api/auth/logout      → Cerrar sesión
GET    /api/auth/me          → Perfil actual
```

### Jugadores (`/api/jugadores`)
```
GET    /api/jugadores            → Lista todos
GET    /api/jugadores/:id        → Perfil específico
GET    /api/jugadores/ranking    → Ranking global
GET    /api/jugadores/:id/exp    → Historial EXP
```

### Equipos (`/api/equipos`)
```
GET    /api/equipos              → Lista equipos
POST   /api/equipos              → Crear equipo
GET    /api/equipos/:id          → Equipo específico
PUT    /api/equipos/:id          → Actualizar
DELETE /api/equipos/:id          → Eliminar
POST   /api/equipos/:id/dt       → Asignar DT
PUT    /api/equipos/:id/alineacion → Cambiar alineación
```

### Torneos (`/api/torneos`)
```
GET    /api/torneos              → Lista torneos
GET    /api/torneos/:id          → Torneo específico
GET    /api/torneos/:id/bracket  → Bracket del torneo
POST   /api/torneos/:id/inscribir → Inscribir equipo
```

### Marecoin (`/api/marecoin`)
```
GET    /api/marecoin/saldo       → Saldo actual
GET    /api/marecoin/historial   → Historial transacciones
POST   /api/marecoin/comprar     → Comprar MC
POST   /api/marecoin/gastar      → Gastar MC (info)
```

---

## Health Check

```bash
curl http://localhost:3001/health
# → { "status": "ok", "service": "RSMV API", "empresa": "Marelab" }
```

---

## Rate Limiting

| Ruta | Límite |
|------|--------|
| `/api/*` (global) | 200 req / 15 min |
| `/api/auth/*` | 20 req / hora |

---

## Relacionado
- [[Autenticación y Seguridad]]
- [[Base de Datos Schema]]
- [[Deploy e Infraestructura]]
- [[RSMV - Stack Técnico]]
