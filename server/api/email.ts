// GET /api/email?name=Scott%20Makeig&institution=University%20of%20California%20San%20Diego
// → { email, source } from the professor's own papers, or { email: null }.
import { pickEmail, splitName, type EpmcResult } from "../lib/emailFinder.js";
import { json, preflight, requireAppKey } from "../lib/http.js";
import { allow, clientIp } from "../lib/ratelimit.js";

const UPSTREAM = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { at: number; body: unknown }>();

export async function GET(request: Request): Promise<Response> {
  const denied = requireAppKey(request);
  if (denied) return denied;
  if (!allow(clientIp(request), "email")) return json({ error: "Too many requests. Try again in a few minutes." }, 429);

  const url = new URL(request.url);
  const name = (url.searchParams.get("name") ?? "").trim();
  const institution = (url.searchParams.get("institution") ?? "").trim();
  if (!name || !institution || name.length > 100 || institution.length > 200) {
    return json({ error: "name and institution are required" }, 400);
  }
  const { first, last } = splitName(name);
  if (!first || !last || first === last) return json({ email: null });

  const cacheKey = `${name.toLowerCase()}|${institution.toLowerCase()}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return json(hit.body);

  const upstream = new URL(UPSTREAM);
  upstream.searchParams.set(
    "query",
    `AUTH:"${last.replace(/"/g, "")} ${first.charAt(0)}"`,
  );
  upstream.searchParams.set("resultType", "core");
  upstream.searchParams.set("format", "json");
  // 40 recent papers found the same address as 100 for 10 of 10 Michigan PIs (Sep 30), at about a third of the payload.
  upstream.searchParams.set("pageSize", "40");
  upstream.searchParams.set("sort", "P_PDATE_D desc");

  let results: EpmcResult[];
  try {
    const res = await fetch(upstream, {
      headers: { "user-agent": "Labmate (Shipaton 2026)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok)
      return json({ error: `Europe PMC returned ${res.status}` }, 502);
    const data = (await res.json()) as {
      resultList?: { result?: EpmcResult[] };
    };
    results = data.resultList?.result ?? [];
  } catch (e) {
    console.error("Europe PMC unreachable", e);
    return json({ error: "Europe PMC unreachable" }, 502);
  }

  const body = pickEmail(results, name, institution) ?? { email: null };
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(cacheKey, { at: Date.now(), body });
  return json(body);
}

export const OPTIONS = preflight;
