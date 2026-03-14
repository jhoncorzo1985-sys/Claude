# RSMV — Robot Soccer Mare Virtual

**Manager game de robots de fútbol | Marelab © 2025**

> Creado por Jhon Carlos Corzo Vega | [@marecolombia](https://instagram.com/marecolombia) | [marelab.co](https://marelab.co)

---

## ¿Qué es RSMV?

Robot Soccer Mare Virtual es un juego tipo Football Manager / Hattrick donde:
- Los usuarios son **jugadores, dueños de equipo o Directores Técnicos**
- La **IA simula todos los partidos** automáticamente
- Los usuarios acumulan **EXP** y toman decisiones estratégicas
- Hay **torneos reales con premios en dinero** (Colombia)
- Existe una **moneda virtual: Marecoin**

---

## Estructura del Proyecto

```
rsmv/
├── supabase/
│   └── schema.sql          # Schema completo de base de datos
├── backend/
│   ├── server.js           # Express API server
│   ├── config/supabase.js  # Cliente Supabase
│   ├── middleware/auth.js  # Auth JWT middleware
│   ├── routes/
│   │   ├── auth.js         # Register, login, logout, me
│   │   ├── jugadores.js    # Perfiles, ranking, historial EXP
│   │   ├── equipos.js      # CRUD equipos, DT, alineación
│   │   ├── torneos.js      # Torneos, bracket, inscripción
│   │   └── marecoin.js     # Saldo, historial, compras
│   └── services/
│       ├── marecoin.js     # Lógica económica del juego
│       ├── exp.js          # Tablas y asignación de EXP
│       └── email.js        # Emails automáticos (Resend)
├── frontend/
│   ├── index.html          # Landing page
│   ├── css/styles.css      # Design system RSMV
│   ├── js/
│   │   ├── api.js          # API client
│   │   └── app.js          # Shell: toasts, modals, EXP bars
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── dashboard.html  # Dashboard jugador
│       ├── torneos.html    # Lista y bracket de torneos
│       ├── ranking.html    # Ranking global
│       └── tienda.html     # Compra de Marecoin
└── simulator/
    ├── motor.js            # Motor de simulación (seed fijo)
    └── motor.test.js       # 18 tests validados ✓
```

---

## Setup Rápido

### 1. Base de datos (Supabase)
```bash
# Ejecutar en el SQL editor de Supabase
supabase/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Completar variables en .env
npm install
npm run dev
```

### 3. Frontend
```bash
# Servir estático (cualquier servidor HTTP)
cd frontend
npx serve .
# O con Python:
python3 -m http.server 3000
```

---

## Variables de Entorno (Backend)

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

## Arquitectura del Ecosistema

| Nivel | Escala |
|-------|--------|
| Jugadores | 1,024 |
| Equipos | 256 (4 jugadores c/u) |
| Academias | 16 (8 Liga A + 8 Liga B) |
| Torneos Municipales | 16 |
| Torneos Regionales | 2 |
| Torneo Nacional | 1 |

### Estructura de equipo
| Rol | Cantidad | Regla |
|-----|----------|-------|
| Jugador Titular | 2 | Desde el inicio |
| Jugador Suplente | 2 | Entran de cambio |
| Dueño/Licenciante | 1 | Compra la licencia |
| Director Técnico | 1 | No puede ser jugador del mismo equipo |

---

## Sistema EXP

**EXP es inmediato y NUNCA disminuye.**

### Niveles de Jugador
| Nivel | EXP |
|-------|-----|
| Local | 0–49 |
| Municipal | 50–149 |
| Regional | 150–299 |
| Nacional | 300–499 |
| Estrella RSMV | 500+ |

### Niveles de DT
| Nivel | EXP |
|-------|-----|
| Asistente | 0–49 |
| DT Local | 50–149 |
| DT Regional | 150–299 |
| DT Nacional | 300+ |

---

## Marecoin

La moneda del juego. Sin MC no hay información.

| Acción | Costo |
|--------|-------|
| Ver propio EXP | 3 MC |
| Ver EXP rival | 5 MC |
| IA-DT básica | 20 MC |
| IA-DT premium | 50 MC |

> ⚠️ **Nota legal**: Verificar regulación colombiana sobre monedas virtuales antes de activar pagos reales.

---

## Motor de Simulación

El motor (`simulator/motor.js`) incluye:
- ✅ PRNG con seed fijo para reproducibilidad
- ✅ Penales individuales (prob 0.60 base)
- ✅ Super Penal: UN ganador o NINGUNO (nunca ambos)
- ✅ Partido con distribución Poisson de goles
- ✅ EXP calculado por acción en tiempo real
- ✅ Clasificación y Copa con desempate por Super Penal

```bash
# Correr tests del motor
cd simulator
node motor.test.js
# → 18/18 tests pasados ✓
```

---

## Premios

| Posición | Premio |
|----------|--------|
| Nacional 1° | $4,000,000 COP |
| Nacional 2° | $2,500,000 COP |
| Regional Campeón (×2) | $400,000 COP c/u |
| Municipal Campeón (×16) | $100,000 COP c/u |

---

## Stack Técnico

- **Frontend**: HTML/CSS/JS vanilla (sin frameworks, sin build step)
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL + Auth + RLS)
- **Email**: Resend
- **Deploy**: Vercel (frontend) + Railway (backend)

---

## Contacto

- **Web**: [marelab.co](https://marelab.co)
- **Social**: [@marecolombia](https://instagram.com/marecolombia)
- **WhatsApp**: 315 2445278
- **Crowdfunding**: [vaki.co/vaki/grSrTLJbUrfbPiwhBj2A](https://vaki.co/vaki/grSrTLJbUrfbPiwhBj2A)
- **Meta Vaki**: $50,000,000 COP

---

*Hecho con ❤️ en Colombia 🇨🇴*
