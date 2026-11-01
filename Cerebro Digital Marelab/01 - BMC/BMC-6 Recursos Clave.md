---
tags: [bmc, recursos, activos, ip, tecnología]
created: 2026-04-12
bloque: BMC-6
---

# 🔑 BMC-6 — Recursos Clave

[[BMC-5 Fuentes de Ingresos]] ← [[BMC Marelab]] → [[BMC-7 Actividades Clave]]

---

## Pregunta Central

> **¿Qué recursos necesitamos para entregar nuestra propuesta de valor?**
> ¿Cuáles son los activos más críticos del negocio?

---

## Recurso 1 — Motor de Simulación (IP Propia)

**Tipo:** Intelectual / Tecnológico
**Criticidad:** CRÍTICA — sin esto no hay juego

El motor es la pieza más valiosa de Marelab:
- Construido desde cero por Jhon Carlos
- Algoritmo PRNG xorshift32 con seed fijo
- 18/18 tests pasados
- Reproducible y auditable

Ver detalles: [[RSMV - Motor de Simulación]]

**Barrera de entrada:** Alta. Replicar este motor toma meses.

---

## Recurso 2 — Plataforma Tecnológica

**Tipo:** Tecnológico
**Criticidad:** ALTA

| Componente | Recurso |
|------------|---------|
| Base de datos | Supabase (PostgreSQL + RLS + Auth) |
| Backend API | Node.js + Express en Railway |
| Frontend | HTML/CSS/JS en Vercel |
| Email | Resend |
| Simulación | motor.js (propio) |

Ver detalles: [[RSMV - Stack Técnico]] | [[Deploy e Infraestructura]]

---

## Recurso 3 — Marca Marelab / RSMV

**Tipo:** Intelectual / Marca
**Criticidad:** ALTA

- Nombre "Marelab" = identidad de empresa
- "RSMV" = identidad del producto
- "@marecolombia" = presencia en redes
- "marelab.co" = dominio web
- Concepto único: fútbol robótico manager con dinero real

La marca aún está en construcción. Cada torneo la fortalece.

---

## Recurso 4 — Comunidad de Jugadores

**Tipo:** Humano / Red
**Criticidad:** ALTA (sin jugadores no hay juego)

La comunidad ES el producto:
- 1,024 jugadores = escala completa del juego
- Sin masa crítica, los torneos no funcionan
- Cada jugador activo atrae otros jugadores

**Estado actual:** En construcción vía Vaki y redes

---

## Recurso 5 — Fundador y Equipo

**Tipo:** Humano
**Criticidad:** CRÍTICA en etapa actual

[[Marelab - Fundador]] — Jhon Carlos Corzo Vega:
- Visión del producto
- Desarrollo técnico
- Operación de torneos
- Relación con la comunidad

**Riesgo:** Dependencia de una sola persona (single point of failure)
**Mitigación:** Documentar todo en este Cerebro Digital

---

## Recurso 6 — Capital (Crowdfunding)

**Tipo:** Financiero
**Criticidad:** ALTA para lanzamiento

Meta Vaki: $50,000,000 COP
Ver: [[Crowdfunding Vaki]]

Sin capital:
- No se pueden pagar premios del primer ciclo
- No se puede invertir en marketing

---

## Mapa de Criticidad

```
CRÍTICO          ALTO              MEDIO
Motor de         Plataforma        Capital inicial
simulación       tecnológica
                 Marca RSMV
Fundador         Comunidad
```

---

## Conectado con
- [[BMC-7 Actividades Clave]] — qué hacemos con estos recursos
- [[RSMV - Motor de Simulación]] — el recurso más valioso
- [[RSMV - Stack Técnico]] — la plataforma técnica
- [[Marelab - Fundador]] — el recurso humano central
