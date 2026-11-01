---
tags: [técnico, seguridad, auth, jwt, supabase]
created: 2026-04-12
---

# 🔐 Autenticación y Seguridad

[[HOME]] | [[Backend API]] | [[Base de Datos Schema]]

---

## Sistema de Auth

RSMV usa **Supabase Auth** con JWT.

### Flujo
```
Usuario → login → Supabase Auth
                  → JWT token
                  → Backend lo verifica en middleware
                  → Acceso a rutas protegidas
```

---

## Middleware JWT (Backend)

```javascript
// backend/middleware/auth.js
// Verifica JWT en cada request protegido
// Extrae user_id para RLS de Supabase
```

Todas las rutas `autenticadas` pasan por este middleware antes de llegar al controlador.

---

## Rate Limiting

| Contexto | Límite |
|----------|--------|
| API general | 200 req / 15 min |
| Rutas de Auth | 20 req / hora |

Protege contra:
- Ataques de fuerza bruta
- Spam de registros
- DoS básico

---

## Headers de Seguridad (`helmet`)

`helmet()` configura automáticamente:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`
- Y más...

---

## CORS — Orígenes Permitidos

```javascript
origin: [
  'http://localhost:3000',      // Desarrollo
  'https://rsmv.marelab.co',   // Producción
  'https://marelab.co'         // Web principal
]
```

Solo estos dominios pueden hacer requests al backend.

---

## RLS en Supabase

Row Level Security garantiza que:

- Un usuario **solo ve sus propias transacciones** de Marecoin
- Solo el propio jugador puede **editar su perfil**
- El historial de EXP es **privado** por defecto
- Los datos de jugadores son **públicos** (para el ranking)

---

## Consideraciones de Seguridad Activas

### Ya implementado:
- [x] JWT verificación en backend
- [x] RLS en base de datos
- [x] Rate limiting por ruta
- [x] CORS whitelist
- [x] Helmet headers
- [x] Saldo Marecoin nunca negativo (constraint DB)
- [x] EXP nunca disminuye (constraint DB)

### Pendiente / A revisar:
- [ ] Validación de moneda virtual (regulación COP)
- [ ] 2FA para usuarios con Marecoin alto
- [ ] Auditoría de logs de seguridad
- [ ] Revisión antes de activar pagos reales

---

## Relacionado
- [[Backend API]]
- [[Base de Datos Schema]]
- [[Regulación Colombia]]
