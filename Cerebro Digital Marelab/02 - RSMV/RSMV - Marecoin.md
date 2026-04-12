---
tags: [rsmv, marecoin, economia, moneda]
created: 2026-04-12
---

# 💰 Marecoin (MC)

[[HOME]] | [[RSMV - Qué Es]] | [[RSMV - Sistema EXP]] | [[Modelo de Negocio]]

---

## Qué es Marecoin

> **Marecoin (MC)** es la moneda virtual de RSMV.  
> Sin MC, no hay información.

Marecoin no es solo dinero del juego — es la llave de acceso a la **información estratégica**. Está diseñada para crear un mercado de conocimiento dentro del juego.

---

## Filosofía de Diseño

La información tiene valor real en un juego de estrategia. Por eso, en RSMV:

- Ver el EXP de un rival **cuesta MC**
- Usar la IA como DT **cuesta MC**
- Tener MC te da **ventaja competitiva**

---

## Tarifas (MC)

| Acción | Costo |
|--------|-------|
| 👁️ Ver mi propio EXP | 3 MC |
| 🔍 Ver EXP de un rival | 5 MC |
| 🤖 IA-DT básica (1 partido) | 20 MC |
| 🧠 IA-DT premium (torneo completo) | 50 MC |

---

## Cómo Conseguir Marecoin

| Fuente | Cantidad |
|--------|----------|
| Compra directa (pesos COP) | Variable |
| Premio por partido ganado | Automático |
| Premio por torneo | Por posición |
| Bonos de bienvenida | Al registrarse |

---

## Tipos de Transacción

| Tipo | Descripción |
|------|-------------|
| `compra` | Usuario compra MC con dinero real |
| `ganancia_partido` | Ganancia automática por jugar |
| `ganancia_torneo` | Premio por posición en torneo |
| `gasto_informacion` | Pago por ver estadísticas |
| `premio` | Premios especiales |

---

## Reglas Económicas

1. El saldo **nunca puede ser negativo** (constraint en DB)
2. Cada transacción guarda saldo anterior y nuevo (auditable)
3. Las tarifas son **configurables** en la tabla `marecoin_tarifas`
4. Los premios van directo al saldo del usuario

---

## Nota Legal Importante

> ⚠️ Verificar regulación colombiana sobre monedas virtuales antes de activar pagos reales.

La conversión MC ↔ COP debe cumplir con normativas de la Superintendencia Financiera de Colombia.

---

## Estructura en Base de Datos

```
marecoin_transacciones
├── user_id
├── tipo (compra / ganancia / gasto / premio)
├── cantidad (+entrada / -salida)
├── saldo_anterior
├── saldo_nuevo
├── descripcion
└── referencia_id (partido, torneo, etc.)

marecoin_tarifas
├── accion (ver_propio_exp, activar_ia_dt_basica, etc.)
├── costo (en MC)
├── activo (boolean)
```

---

## Relacionado
- [[RSMV - Sistema EXP]]
- [[Modelo de Negocio]]
- [[Regulación Colombia]]
- [[Base de Datos Schema]]
