# Marelab Instagram MCP

Conector MCP propio (Instagram API with Instagram Login) para **@jhoncorzo1985** (`personal`) y **@marecolombia** (`marelab`).

## Herramientas
| Herramienta | Qué hace |
|---|---|
| `ig_get_profile` | Seguidores, siguiendo, publicaciones, bio |
| `ig_list_media` | Últimas publicaciones con likes/comentarios |
| `ig_media_insights` | Alcance, guardados, compartidos, vistas de una pieza |
| `ig_account_insights` | Alcance, visitas al perfil, interacciones (N días) |
| `ig_list_comments` | Comentarios de una pieza |
| `ig_reply_comment` | Responde comentario (**vista previa hasta `confirm=true`**) |
| `ig_publish` | Publica imagen/reel/historia por URL pública (**vista previa hasta `confirm=true`**) |

Nada se publica ni se responde sin `confirm=true`, que solo se usa tras tu aprobación explícita.

## Puesta en marcha (una vez por cuenta, ~20 min)
1. La cuenta debe ser **profesional** (Creador o Empresa) — en Instagram: Configuración → Tipo de cuenta.
2. Crea una app en https://developers.facebook.com/apps (tipo *Business*) y agrega el producto **Instagram → API setup with Instagram login**.
3. Añade tu cuenta como *Instagram tester* (o Admin/Developer de la app) y acepta la invitación en Instagram.
4. Genera el **token** de la cuenta y copia el **Instagram user ID** (ambos aparecen en el panel de la app). Permisos: `instagram_business_basic`, `instagram_business_manage_insights`, `instagram_business_manage_comments`, `instagram_business_content_publish`.
5. `cp .env.example .env` y pega los valores. **Los tokens nunca se pegan en el chat ni se suben a git.**
6. `npm install && npm test`.
7. Desde la raíz del repo, `.mcp.json` ya registra el servidor; reinicia Claude Code y aparece como `instagram`.

Los tokens de larga duración duran ~60 días; renuévalos antes de que venzan.
