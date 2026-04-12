---
tags: [rsmv, stack, técnico, tecnología]
created: 2026-04-12
---

# 💻 RSMV — Stack Técnico

[[HOME]] | [[Backend API]] | [[Frontend]] | [[Deploy e Infraestructura]]

---

## Resumen del Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + CSS + JS vanilla |
| Backend | Node.js + Express |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Email | Resend |
| Deploy Frontend | Vercel |
| Deploy Backend | Railway |

---

## Por Qué Vanilla (sin frameworks)

- Sin build step → deploy instantáneo
- Sin dependencias de framework
- Funciona en cualquier servidor estático
- Más fácil de mantener para equipo pequeño

---

## Frontend

```
frontend/
├── index.html          ← Landing page
├── css/styles.css      ← Design system RSMV
├── js/
│   ├── api.js          ← Cliente de la API
│   └── app.js          ← Shell: toasts, modals, barras EXP
└── pages/
    ├── login.html
    ├── register.html
    ├── dashboard.html  ← Dashboard del jugador
    ├── torneos.html    ← Lista y bracket
    ├── ranking.html    ← Ranking global
    └── tienda.html     ← Compra de Marecoin
```

---

## Backend

```
backend/
├── server.js           ← Express + cors + helmet + rate limiting
├── config/supabase.js  ← Cliente Supabase
├── middleware/auth.js  ← Verificación JWT
├── routes/
│   ├── auth.js         ← Register, login, logout, me
│   ├── jugadores.js    ← Perfiles, ranking, historial EXP
│   ├── equipos.js      ← CRUD equipos, DT, alineación
│   ├── torneos.js      ← Torneos, bracket, inscripción
│   └── marecoin.js     ← Saldo, historial, compras
└── services/
    ├── marecoin.js     ← Lógica económica
    ├── exp.js          ← Tablas y asignación de EXP
    └── email.js        ← Emails automáticos (Resend)
```

---

## Seguridad Backend

- `helmet()` — headers HTTP seguros
- `cors` — whitelist de orígenes
- `express-rate-limit` — 200 req/15min global
- Rate limit estricto en auth: 20 req/hora
- JWT middleware en todas las rutas protegidas
- RLS (Row Level Security) en Supabase

---

## Simulator

```
simulator/
├── motor.js        ← Motor completo de simulación
└── motor.test.js   ← 18 tests automatizados
```

---

## Endpoints de la API

| Ruta | Descripción |
|------|-------------|
| `GET /health` | Estado del servidor |
| `POST /api/auth/register` | Registro |
| `POST /api/auth/login` | Login |
| `GET /api/jugadores` | Lista jugadores |
| `GET /api/equipos` | Lista equipos |
| `GET /api/torneos` | Lista torneos |
| `GET /api/marecoin/saldo` | Saldo del usuario |

---

## Relacionado
- [[Backend API]]
- [[Frontend]]
- [[Base de Datos Schema]]
- [[Autenticación y Seguridad]]
- [[Deploy e Infraestructura]]
