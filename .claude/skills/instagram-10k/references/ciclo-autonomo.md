# Ciclo autónomo del equipo (lo que corre solo)

| Cuándo | Qué corre | Agente(s) |
|---|---|---|
| Domingo | Plan de la semana en cola (borrador) | ig-estratega → ig-creador |
| Cada día, 2–3 ventanas | Publicar lo que tocó | ig-publicador |
| Cada día, 2 veces | Responder comentarios seguros | ig-comunidad |
| Viernes | Métricas + reporte comercial | ig-analista → ig-estratega (ajuste) |

Orquestación (sesión principal o tarea programada): invocar los subagentes en ese orden con el Agent tool; el director (sesión principal) resume al final en 10 líneas y avisa a Jhon solo de errores, escalaciones y el reporte semanal.

## Requisitos para operar de verdad
1. Tokens en `.env` del MCP (ver `mcp/instagram-mcp/README.md`), cuentas profesionales.
2. Hosting de media con URL pública (Instagram solo publica desde URL pública): Vercel Blob/Storage o un bucket público.
3. Tarea programada que lance el ciclo (cron). Se activa cuando 1 y 2 estén verificados.
4. Primer ciclo supervisado: se corre una pieza con Jhon mirando antes de dejar todo en piloto automático.
