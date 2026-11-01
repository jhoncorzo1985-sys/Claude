---
tags: [bmc, socios, alianzas, partners]
created: 2026-04-12
bloque: BMC-8
---

# 🤜 BMC-8 — Socios Clave

[[BMC-7 Actividades Clave]] ← [[BMC Marelab]] → [[BMC-9 Estructura de Costos]]

---

## Pregunta Central

> **¿Quiénes son nuestros socios y proveedores clave?**
> ¿Qué alianzas necesitamos para que el modelo funcione?

---

## Tipos de Alianza

| Tipo | Propósito |
|------|-----------|
| Optimización | Reducir costos o mejorar eficiencia |
| Reducción de riesgo | Mitigar incertidumbre |
| Recursos especiales | Acceder a lo que no tenemos |

---

## Socios Actuales

### Supabase
**Rol:** Proveedor de infraestructura de datos
**Qué nos da:**
- PostgreSQL managed
- Auth JWT
- Row Level Security
- Realtime
- Tier gratuito generoso para MVP

**Dependencia:** ALTA — toda la data vive ahí

---

### Vaki
**Rol:** Plataforma de crowdfunding
**Qué nos da:**
- Acceso a inversores colombianos
- Credibilidad como proyecto local
- Procesamiento de pagos en COP

**Dependencia:** MEDIA — solo para fundraising inicial

---

### Resend
**Rol:** Proveedor de email transaccional
**Qué nos da:**
- API de emails
- Alta entregabilidad
- Gratis hasta 100 emails/día

**Dependencia:** BAJA — reemplazable por SendGrid u otros

---

### Railway
**Rol:** Hosting del backend
**Qué nos da:**
- Deploy simple de Node.js
- Escalado automático
- Variables de entorno seguras

**Dependencia:** MEDIA — reemplazable por Render, Fly.io

---

### Vercel
**Rol:** Hosting del frontend
**Qué nos da:**
- CDN global gratis
- Deploy automático desde git
- Preview deployments

**Dependencia:** BAJA — cualquier CDN sirve para HTML estático

---

## Socios Estratégicos Futuros (No Actuales)

### Academias de Robótica Colombia
**Por qué importan:**
- Generan comunidad orgánica de usuarios reales
- Dan credibilidad institucional
- Pueden co-organizar torneos
- Son el Segmento D del canvas → [[BMC-1 Segmentos de Clientes]]

**Cómo acercarlos:**
- Ofrecer academia "oficial" en el juego con su nombre real
- Co-crear torneos presenciales + RSMV

---

### Pasarela de Pagos (PSE / Wompi / PayU)
**Por qué importa:**
- Sin esto no hay venta de Marecoin real
- Sin MC real no hay ingresos → [[BMC-5 Fuentes de Ingresos]]

**Opciones:**
- Wompi (Bancolombia — lo más fácil en Colombia)
- PayU (más global)
- Bold (startup colombiana)

---

### Patrocinadores / Marcas
**Por qué importan:**
- Pueden financiar premios de torneos
- A cambio de visibilidad en la plataforma
- Ideal: marcas tech, gaming, educación

---

## Mapa de Dependencia

```
CRÍTICO          IMPORTANTE        NICE-TO-HAVE
Supabase         Railway           Resend
                 Pasarela pagos    Vercel
                 Vaki (ahora)
```

---

## Plan de Redundancia

| Riesgo | Mitigación |
|--------|------------|
| Supabase sube precios | Presupuestar costo real desde el inicio |
| Railway cae | Configurar Railway + backup en Render |
| Vaki falla | Tener PayPal / Stripe como alternativa |

---

## Conectado con
- [[BMC-9 Estructura de Costos]] — cuánto nos cuestan estos socios
- [[Deploy e Infraestructura]] — detalles técnicos de los socios tech
- [[Crowdfunding Vaki]] — el socio de fundraising
- [[Regulación Colombia]] — pasarela de pagos y cumplimiento
