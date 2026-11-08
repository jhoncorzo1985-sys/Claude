# Estado del proyecto (2026-11-08)

## Hecho
- Skill `instagram-10k` (estrategia, embudo comercial, calendario, métricas)
- Línea base: @jhoncorzo1985 = 1.444 · @marecolombia = 3.010 seguidores
- Conector MCP propio en `mcp/instagram-mcp/` (probado en vacío)
- Equipo de 5 agentes en `.claude/agents/` + cola `plan/cola/` + `politica-autonomia.md`
- Modelos: estratega=opus; creador/comunidad/analista=sonnet; publicador=haiku
- Cuenta de Instagram @jhoncorzo1985 es profesional ✔
- App en Meta: nombre "Marelab Comercial" (Meta no permite "Instagram" en el nombre)

## Pendiente (en este orden)
1. Terminar configuración de la cuenta de Meta (verificación por correo/celular)
2. Crear la app "Marelab Comercial" → producto Instagram con inicio de sesión de Instagram
3. Agregar @jhoncorzo1985 como tester, generar token y copiar el ID de usuario
4. Guardarlos en `mcp/instagram-mcp/.env` (nunca en el chat ni en git) → `npm install && npm test`
5. Escribir "listo" → prueba de lectura (debe mostrar 1.444 seguidores)
6. Resolver hosting con URL pública para imágenes/videos (Vercel Blob)
7. Primer ciclo supervisado con una pieza → luego horario automático
8. Repetir 3–4 para @marecolombia

## Preguntas abiertas
- ¿Las 3 primeras publicaciones repetidas en ambos perfiles son Collab o copias?
- Oferta principal a empujar primero (colegios, Robot Soccer Mare, Hotmart)
- Horas/semana disponibles
