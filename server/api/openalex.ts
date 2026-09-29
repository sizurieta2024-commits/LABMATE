// Proxy for the OpenAlex API. Since Feb 2026 OpenAlex requires an API key
// (keyless calls get ~100 credits/day), and the key must not ship inside the app.
// The app calls /api/openalex?path=/works&search=...; we add the key, cache, and forward.
import { json, preflight, requireAppKey } from "../lib/http.js";

const UPSTREAM = "https://api.openalex.org";
const ALLOWED_PATH = /^\/(works|authors|institutions)(\/[WAI]\d+)?$/;
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 500;

const cache = new Map<string, { at: number; status: number; body: string }>();

export async function GET(request: Request): Promise<Response> {
  const denied = requireAppKey(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "";
  if (!ALLOWED_PATH.test(path)) return json({ error: "path not allowed" }, 400);

  const upstream = new URL(UPSTREAM + path);
  for (const [k, v] of url.searchParams) {
    if (k !== "path" && k !== "api_key") upstream.searchParams.set(k, v);
  }
  upstream.searchParams.sort();
  const cacheKey = upstream.toString();

  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return proxied(hit.status, hit.body, "HIT");

  const key = process.env.OPENALEX_API_KEY;
  if (key) upstream.searchParams.set("api_key", key);

  let res: Response;
  try {
    res = await fetch(upstream, { headers: { "user-agent": "Labmate (Shipaton 2026)" } });
  } catch {
    return json({ error: "OpenAlex unreachable" }, 502);
  }
  const body = await res.text();
  if (res.ok) {
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { at: Date.now(), status: res.status, body });
  }
  return proxied(res.status, body, "MISS");
}

function proxied(status: number, body: string, cacheState: string): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "x-labmate-cache": cacheState,
      // Let Vercel's CDN reuse identical queries across users.
      ...(status === 200 ? { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } : {}),
    },
  });
}

export const OPTIONS = preflight;

/** Test hook. */
export function clearCache(): void {
  cache.clear();
}
