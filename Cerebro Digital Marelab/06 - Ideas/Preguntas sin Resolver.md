---
tags: [ideas, preguntas, estrategia, decisiones-pendientes]
created: 2026-04-12
---

# ❓ Preguntas sin Resolver

[[HOME]] | [[Roadmap RSMV]] | [[Features Pendientes]]

---

## Preguntas de Negocio

### ¿Cuánto cuesta una licencia de equipo?
- ¿Pago único o por temporada?
- ¿Incluye participación en torneos o se paga aparte?
- Referencia: Hattrick cobra ~€4/mes

### ¿Cómo se estructuran los paquetes de Marecoin?
- Ejemplo: 100 MC por $15,000 COP
- ¿Hay bonus por volumen?
- ¿MC tiene fecha de expiración?

### ¿Los torneos son siempre con premios reales?
- ¿O hay torneos gratuitos de práctica?
- ¿Cómo se maneja la inscripción de equipos que no pueden pagar?

### ¿Cuál es el precio de inscripción a torneos?
- Municipal: ¿$20,000 COP por equipo?
- Regional: ¿$50,000 COP?
- Nacional: ¿$100,000 COP?

---

## Preguntas Técnicas

### ¿Cuándo se ejecuta la simulación?
- ¿En tiempo real mientras el usuario espera?
- ¿Programada (cron) a cierta hora?
- ¿Express mode: instantáneo?

### ¿Cómo se manejan los partidos simultáneos?
- 16 partidos municipales pueden correr al mismo tiempo
- ¿Necesitamos queue de trabajos? (Redis/BullMQ)

### ¿Qué pasa si un equipo no tiene DT?
- La IA toma todas las decisiones automáticamente
- ¿El equipo puede competir igual? ¿Con penalización?

### ¿Cómo se asignan los jugadores a equipos?
- ¿Registro libre? ¿El dueño invita?
- ¿Qué pasa si un equipo no tiene 4 jugadores al momento del torneo?

---

## Preguntas de UX/Diseño

### ¿Cuánto tiempo tarda un torneo completo?
- Modo evento: ¿días, semanas?
- Modo express: ¿horas?
- ¿El usuario recibe notificaciones de resultados?

### ¿Cómo ve el usuario un partido?
- ¿Solo resultado final?
- ¿Narración evento por evento?
- ¿Replay con animación?

### ¿Qué ve el usuario cuando no hay torneo activo?
- ¿Puede entrenar?
- ¿Puede ver estadísticas?
- ¿Puede interactuar con la comunidad?

---

## Preguntas Legales

### ¿Necesita Coljuegos?
- Si los torneos tienen premios en dinero, ¿es juego de azar?
- El argumento: es juego de **habilidad** (estrategia del DT)
- ¿Pero la simulación tiene aleatoriedad...?

### ¿Retención en premios?
- Premios > $1,000,000 COP generalmente tienen retención
- ¿Cómo manejamos esto operativamente?

---

## Relacionado
- [[Roadmap RSMV]]
- [[Features Pendientes]]
- [[Regulación Colombia]]
- [[Modelo de Negocio]]
