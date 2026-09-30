/**
 * Small per-IP limiter for the AI endpoints. The app key ships inside the public
 * app bundle, so it can't stop someone from using /api/brief as a free LLM. This
 * is per server instance (Vercel may run several), which is enough to blunt abuse.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 40; // a student briefing papers and drafting emails stays far below this
const MAX_IPS = 5000;

const hits = new Map<string, number[]>();

export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

/** True when this IP may make another request now (and records it). */
export function allow(ip: string, now: number = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  if (!hits.has(ip) && hits.size >= MAX_IPS) hits.delete(hits.keys().next().value!);
  hits.set(ip, recent);
  return true;
}

/** Test hook. */
export function resetLimits(): void {
  hits.clear();
}
