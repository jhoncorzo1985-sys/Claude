// Prueba humo: arranca el servidor, lista las herramientas y comprueba el error de cuenta sin configurar.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const t = new StdioClientTransport({ command: "node", args: ["src/index.js"], env: { PATH: process.env.PATH } });
const c = new Client({ name: "selftest", version: "0" });
await c.connect(t);
const { tools } = await c.listTools();
console.log("tools:", tools.map((x) => x.name).join(", "));
const r = await c.callTool({ name: "ig_get_profile", arguments: { account: "personal" } });
console.log("sin token →", r.isError ? "error controlado OK:" : "INESPERADO", r.content[0].text);
const p = await c.callTool({ name: "ig_publish", arguments: { account: "marelab", kind: "image", media_url: "https://example.com/a.jpg" } });
console.log("publish sin config →", p.isError ? "error controlado OK" : "INESPERADO");
await c.close();
