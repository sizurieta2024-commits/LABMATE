// Local dev server so you can run the API without Vercel:
//   ANTHROPIC_API_KEY=... npm run dev
// Point the app at http://<your-computer-LAN-IP>:8787 (phone and laptop on the same Wi-Fi).
import { createServer } from "node:http";
import * as brief from "./api/brief.js";
import * as draft from "./api/draft.js";

type Route = { POST: (r: Request) => Promise<Response>; OPTIONS: () => Response };
const routes: Record<string, Route> = { "/api/brief": brief, "/api/draft": draft };
const port = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const route = routes[url.pathname];
  if (!route) {
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
  const response = req.method === "OPTIONS" ? route.OPTIONS() : await route.POST(request);
  console.log(`${req.method} ${url.pathname} -> ${response.status} (${Date.now() - started}ms)`);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, "0.0.0.0", () => console.log(`Labmate API on http://0.0.0.0:${port}`));
