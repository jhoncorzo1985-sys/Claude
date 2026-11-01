---
tags: [técnico, deploy, infraestructura, vercel, railway, supabase]
created: 2026-04-12
---

# 🚀 Deploy e Infraestructura

[[HOME]] | [[Backend API]] | [[Frontend]] | [[Marelab - Contacto y Redes]]

---

## Stack de Deploy

| Componente | Plataforma |
|------------|-----------|
| Frontend | **Vercel** |
| Backend API | **Railway** |
| Base de Datos | **Supabase** |
| Email | **Resend** |

---

## Frontend → Vercel

```bash
# Deploy automático desde git
# Conectar repo a Vercel
# Branch main → producción
# PRs → preview deploys

URL: https://rsmv.marelab.co
```

**Por qué Vercel:**
- CDN global gratuito
- Deploy automático
- Preview por PR
- Perfectamente compatible con HTML/CSS/JS vanilla

---

## Backend → Railway

```bash
# Conectar repo a Railway
# Auto-detect Node.js
# Variables de entorno en el panel

URL: api.rsmv.marelab.co (o similar)
PORT: 3001
```

**Por qué Railway:**
- Fácil deploy de Node.js
- Escalado automático
- Variables de entorno seguras
- Logs en tiempo real

---

## Base de Datos → Supabase

```bash
# Crear proyecto en supabase.com
# Ejecutar schema.sql en SQL Editor
# Copiar claves al .env del backend
```

**Por qué Supabase:**
- PostgreSQL managed
- Auth integrado (JWT)
- RLS nativo
- Realtime gratis
- Tier gratuito generoso

---

## Email → Resend

```bash
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=noreply@marelab.co
```

**Emails automáticos:**
- Bienvenida al registrarse
- Confirmación de inscripción a torneo
- Notificación de resultados
- Alerta de premiación

---

## URLs de Producción

| Servicio | URL |
|----------|-----|
| Landing RSMV | rsmv.marelab.co |
| API | api.rsmv.marelab.co |
| Web Marelab | marelab.co |
| Supabase Dashboard | app.supabase.com |

---

## Checklist de Deploy

```
[ ] Schema SQL ejecutado en Supabase
[ ] Variables .env configuradas en Railway
[ ] CORS actualizado con URLs de producción
[ ] Frontend conectado al backend de Railway
[ ] Dominio rsmv.marelab.co apuntando a Vercel
[ ] Health check respondiendo OK
[ ] Tests del motor pasando (18/18)
```

---

## Relacionado
- [[Backend API]]
- [[Frontend]]
- [[Base de Datos Schema]]
- [[Marelab - Contacto y Redes]]
