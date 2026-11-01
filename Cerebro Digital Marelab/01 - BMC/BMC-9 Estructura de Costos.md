---
tags: [bmc, costos, gastos, finanzas, presupuesto]
created: 2026-04-12
bloque: BMC-9
---

# 📊 BMC-9 — Estructura de Costos

[[BMC-8 Socios Clave]] ← [[BMC Marelab]] → [[BMC-1 Segmentos de Clientes]]

---

## Pregunta Central

> **¿Cuáles son los costos más importantes del modelo?**
> ¿Qué recursos y actividades son los más costosos?

---

## Tipo de Modelo de Costos

RSMV es un modelo **híbrido**:
- **Impulsado por valor** (premios premium atraen jugadores premium)
- **Impulsado por costos** (infraestructura escala con usuarios)

---

## Costos Fijos (cada mes, sin importar usuarios)

| Costo | Monto estimado COP | Notas |
|-------|-------------------|-------|
| Railway (backend) | $50,000 – $200,000 | Según tráfico |
| Supabase (DB) | $0 – $150,000 | Free tier hasta cierto punto |
| Vercel (frontend) | $0 | Free tier para proyectos pequeños |
| Dominio marelab.co | ~$5,000 / mes | Amortizado anual |
| Resend (email) | $0 – $30,000 | Free tier 100 emails/día |
| **Total fijo** | **~$55,000 – $385,000 COP/mes** | |

---

## Costos Variables (escalan con el negocio)

| Costo | Driver | Estimado |
|-------|--------|----------|
| Premios torneos | Por ciclo | $7,700,000 COP/ciclo |
| Procesamiento pagos (Wompi) | % de ventas MC | ~3.5% de ingresos MC |
| Soporte y comunidad | Tiempo fundador | Costo de oportunidad |
| Marketing (ads) | Por campaña | Variable |

---

## Costo por Ciclo Completo de Torneos

| Item | COP |
|------|-----|
| Premios Municipales (16 × $100k) | $1,600,000 |
| Premios Regionales (2 × $400k) | $800,000 |
| Premio Nacional 1° | $4,000,000 |
| Premio Nacional 2° | $2,500,000 |
| **Total premios** | **$8,900,000** |

> Este es el costo más grande y más visible del negocio.
> Los premios son la **razón por la que los jugadores pagan**.

---

## Estructura de Costos vs. Ingresos

```
INGRESOS (estimado escala completa)
    Marecoin:          $10,000,000 / mes
    Licencias equipo:   $3,000,000 / ciclo
    Inscripciones:        $520,000 / ciclo
    ─────────────────────────────────
    TOTAL:            ~$13,500,000 / ciclo

COSTOS
    Infraestructura:      $385,000 / mes
    Premios:            $8,900,000 / ciclo
    Pagos (3.5%):         $350,000 / ciclo
    ─────────────────────────────────
    TOTAL:             ~$9,635,000 / ciclo

MARGEN ESTIMADO:       ~$3,865,000 / ciclo
```

---

## Economías de Escala

Con más usuarios, los costos fijos se distribuyen mejor:

| Usuarios activos | Costo fijo / usuario |
|-----------------|---------------------|
| 100 | $3,850 COP |
| 500 | $770 COP |
| 1,024 | $376 COP |

**A más usuarios, el modelo se vuelve más rentable.**

---

## Costos del Crowdfunding

El primer ciclo de torneos necesita capital previo:
- Sin Vaki: no hay premios → no hay jugadores → no hay negocio
- Con Vaki ($50M COP): hay capital para 5+ ciclos completos

Ver: [[Crowdfunding Vaki]]

---

## Preguntas Financieras Abiertas

- [ ] ¿A qué precio exacto vendo los paquetes de Marecoin?
- [ ] ¿Cuánto cobro por licencia de equipo?
- [ ] ¿Qué pasarela de pagos uso y cuánto cobra?
- [ ] ¿Cuándo soy rentable sin crowdfunding?

Ver: [[Preguntas sin Resolver]]

---

## Conectado con
- [[BMC-5 Fuentes de Ingresos]] — ingresos vs. costos
- [[BMC-8 Socios Clave]] — proveedores que generan costos
- [[Crowdfunding Vaki]] — capital inicial para cubrir costos
- [[Regulación Colombia]] — costos legales y tributarios
