---
tags: [técnico, frontend, html, css, js]
created: 2026-04-12
---

# 🖥️ Frontend RSMV

[[HOME]] | [[RSMV - Stack Técnico]] | [[Backend API]]

---

## Setup Rápido

```bash
cd rsmv/frontend

# Con Node.js
npx serve .

# Con Python
python3 -m http.server 3000
```

Abrir: `http://localhost:3000`

---

## Estructura de Páginas

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Landing page principal |
| `pages/login.html` | Inicio de sesión |
| `pages/register.html` | Registro de usuario |
| `pages/dashboard.html` | Dashboard del jugador |
| `pages/torneos.html` | Lista y bracket de torneos |
| `pages/ranking.html` | Ranking global de jugadores |
| `pages/tienda.html` | Compra de Marecoin |

---

## JavaScript

### `js/api.js`
Cliente de la API backend.
- Maneja todos los requests HTTP
- Gestiona tokens JWT
- Centraliza URLs de endpoints

### `js/app.js`
Shell de la aplicación:
- Sistema de toasts (notificaciones)
- Modals
- Barras de progreso EXP
- Navegación

---

## CSS — Design System RSMV

El archivo `css/styles.css` contiene el design system completo:
- Variables CSS (colores, tipografía)
- Componentes base (botones, cards, inputs)
- Layout responsive (mobile-first)
- Animaciones

---

## Filosofía: Sin Build Step

- No hay Webpack, Vite, ni bundlers
- No hay React, Vue, Angular
- Deploy directo en cualquier CDN/servidor estático
- Funciona offline (sin compilación)
- Ideal para MVP rápidos

---

## Páginas del Usuario

### Dashboard
- EXP actual + barra de progreso al siguiente nivel
- Nivel actual y nombre
- Saldo Marecoin
- Próximo torneo
- Historial reciente

### Torneos
- Lista de torneos activos
- Bracket visual de eliminación
- Estado: pendiente / en curso / finalizado
- Botón de inscripción

### Ranking
- Top jugadores por EXP
- Filtro por nivel
- Búsqueda por nombre

### Tienda
- Paquetes de Marecoin disponibles
- Historial de compras
- Integración de pago (pendiente)

---

## Relacionado
- [[Backend API]]
- [[RSMV - Stack Técnico]]
- [[Deploy e Infraestructura]]
