#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = process.env.IG_GRAPH_BASE || "https://graph.instagram.com/v21.0";
const ACCOUNTS = {
  personal: { handle: "@jhoncorzo1985", token: process.env.IG_TOKEN_PERSONAL, id: process.env.IG_USER_ID_PERSONAL },
  marelab: { handle: "@marecolombia", token: process.env.IG_TOKEN_MARELAB, id: process.env.IG_USER_ID_MARELAB },
};
const accountSchema = z.enum(["personal", "marelab"]).describe("personal = @jhoncorzo1985, marelab = @marecolombia");

function acct(name) {
  const a = ACCOUNTS[name];
  if (!a?.token || !a?.id) {
    throw new Error(`Cuenta '${name}' sin configurar: faltan IG_TOKEN_${name.toUpperCase()} / IG_USER_ID_${name.toUpperCase()}`);
  }
  return a;
}

async function graph(a, path, { method = "GET", params = {} } = {}) {
  const url = new URL(`${BASE}/${path.replace(/^\//, "")}`);
  const body = new URLSearchParams();
  const all = { ...params, access_token: a.token };
  for (const [k, v] of Object.entries(all)) {
    if (v === undefined || v === null) continue;
    (method === "GET" ? url.searchParams : body).set(k, String(v));
  }
  const res = await fetch(url, { method, body: method === "GET" ? undefined : body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(`Instagram API ${res.status}: ${e.message || res.statusText} (code ${e.code ?? "?"})`);
  }
  return json;
}

const ok = (data) => ({ content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] });
const wrap = (fn) => async (args) => {
  try { return ok(await fn(args)); }
  catch (err) { return { isError: true, content: [{ type: "text", text: String(err.message || err) }] }; }
};

const server = new McpServer({ name: "marelab-instagram", version: "0.1.0" });

server.tool("ig_get_profile", "Perfil y seguidores actuales de la cuenta.",
  { account: accountSchema },
  wrap(async ({ account }) => {
    const a = acct(account);
    return graph(a, a.id, { params: { fields: "username,name,biography,followers_count,follows_count,media_count,website" } });
  }));

server.tool("ig_list_media", "Últimas publicaciones con métricas básicas (likes, comentarios).",
  { account: accountSchema, limit: z.number().int().min(1).max(50).default(12) },
  wrap(async ({ account, limit }) => {
    const a = acct(account);
    return graph(a, `${a.id}/media`, { params: { limit, fields: "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count" } });
  }));

server.tool("ig_media_insights", "Alcance, guardados, compartidos, vistas e interacciones de UNA publicación.",
  { account: accountSchema, media_id: z.string() },
  wrap(async ({ account, media_id }) => {
    const a = acct(account);
    return graph(a, `${media_id}/insights`, { params: { metric: "reach,saved,shares,total_interactions,views" } });
  }));

server.tool("ig_account_insights", "Insights de la cuenta (alcance, visitas al perfil, cuentas que interactuaron) en los últimos N días.",
  { account: accountSchema, days: z.number().int().min(1).max(30).default(7) },
  wrap(async ({ account, days }) => {
    const a = acct(account);
    const until = Math.floor(Date.now() / 1000);
    const since = until - days * 86400;
    return graph(a, `${a.id}/insights`, { params: { metric: "reach,profile_views,accounts_engaged,total_interactions", period: "day", metric_type: "total_value", since, until } });
  }));

server.tool("ig_list_comments", "Comentarios de una publicación.",
  { account: accountSchema, media_id: z.string(), limit: z.number().int().min(1).max(50).default(25) },
  wrap(async ({ account, media_id, limit }) => {
    const a = acct(account);
    return graph(a, `${media_id}/comments`, { params: { limit, fields: "id,text,username,timestamp,like_count" } });
  }));

server.tool("ig_reply_comment", "Responde un comentario. Por seguridad NO envía a menos que confirm=true; sin confirm devuelve vista previa.",
  { account: accountSchema, comment_id: z.string(), message: z.string().min(1).max(2200), confirm: z.boolean().default(false) },
  wrap(async ({ account, comment_id, message, confirm }) => {
    const a = acct(account);
    if (!confirm) return `VISTA PREVIA (no enviado) → responder a ${comment_id} desde ${a.handle}:\n${message}\n\nVuelve a llamar con confirm=true tras la aprobación de Jhon.`;
    return graph(a, `${comment_id}/replies`, { method: "POST", params: { message } });
  }));

server.tool("ig_publish", "Publica imagen, reel o historia por URL pública de media. Por seguridad NO publica a menos que confirm=true; sin confirm devuelve vista previa.",
  {
    account: accountSchema,
    kind: z.enum(["image", "reel", "story_image", "story_video"]),
    media_url: z.string().url().describe("URL pública directa al archivo (JPEG, o MP4 para video)"),
    caption: z.string().max(2200).default(""),
    confirm: z.boolean().default(false),
  },
  wrap(async ({ account, kind, media_url, caption, confirm }) => {
    const a = acct(account);
    if (!confirm) return `VISTA PREVIA (no publicado)\nCuenta: ${a.handle}\nTipo: ${kind}\nMedia: ${media_url}\nCaption:\n${caption}\n\nVuelve a llamar con confirm=true tras la aprobación explícita de Jhon.`;
    const params = { caption };
    if (kind === "image") params.image_url = media_url;
    else if (kind === "reel") { params.media_type = "REELS"; params.video_url = media_url; }
    else if (kind === "story_image") { params.media_type = "STORIES"; params.image_url = media_url; delete params.caption; }
    else { params.media_type = "STORIES"; params.video_url = media_url; delete params.caption; }
    const container = await graph(a, `${a.id}/media`, { method: "POST", params });
    for (let i = 0; i < 30; i++) {
      const st = await graph(a, container.id, { params: { fields: "status_code" } });
      if (st.status_code === "FINISHED") break;
      if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new Error(`El contenedor falló: ${st.status_code}`);
      await new Promise((r) => setTimeout(r, 4000));
    }
    return graph(a, `${a.id}/media_publish`, { method: "POST", params: { creation_id: container.id } });
  }));

await server.connect(new StdioServerTransport());
