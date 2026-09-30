// Local dev server so you can run the API without Vercel:
//   cp .env.example .env && npm run dev
// Point the app at http://<your-computer-LAN-IP>:8787 (phone and laptop on the same Wi-Fi).
import { createServer } from "node:http";
import * as brief from "./api/brief.js";
import * as draft from "./api/draft.js";
import * as openalex from "./api/openalex.js";

type Handler = (r: Request) => Response | Promise<Response>;
const routes: Record<string, Partial<Record<string, Handler>>> = {
  "/api/brief": { POST: brief.POST, OPTIONS: brief.OPTIONS },
  "/api/draft": { POST: draft.POST, OPTIONS: draft.OPTIONS },
  "/api/openalex": { GET: openalex.GET, OPTIONS: openalex.OPTIONS },
};
const port = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const handle = routes[url.pathname]?.[req.method ?? "GET"];
  if (!handle) {
    res.writeHead(404).end("not found");
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
  });

  const started = Date.now();
  const response = await handle(request);
  console.log(`${req.method} ${url.pathname}${url.search.slice(0, 80)} -> ${response.status} (${Date.now() - started}ms)`);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, "0.0.0.0", () => {
  console.log(`Labmate API on http://0.0.0.0:${port}`);
  if (process.env.OPENROUTER_API_KEY) console.log(`AI via OpenRouter (${process.env.OPENROUTER_MODEL || "default Qwen"})`);
  else if (!process.env.ANTHROPIC_API_KEY) console.warn("⚠ No ANTHROPIC_API_KEY or OPENROUTER_API_KEY: briefs and drafts will fail");
  if (!process.env.OPENALEX_API_KEY) console.warn("⚠ OPENALEX_API_KEY not set: OpenAlex allows ~10 searches/day without it");
});
