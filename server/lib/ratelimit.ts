/**
 * Small per-IP limiter for the AI endpoints. The app key ships inside the public
 * app bundle, so it can't stop someone from using /api/brief as a free LLM. This
 * is per server instance (Vercel may run several), which is enough to blunt abuse.
 */
const WINDOW_MS = 10 * 60 * 1000;
// Per-endpoint budgets. A student stays far below them; NIH gets more because
// every radar load checks 15 researchers.
export const LIMITS = { ai: 60, email: 60, nih: 300 } as const;
const MAX_IPS = 5000;

const hits = new Map<string, number[]>();

export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

/** True when this IP may make another request to `bucket` now (and records it). */
export function allow(ip: string, bucket: keyof typeof LIMITS = "ai", now: number = Date.now()): boolean {
  const key = `${bucket}:${ip}`;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMITS[bucket]) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  if (!hits.has(key) && hits.size >= MAX_IPS) hits.delete(hits.keys().next().value!);
  hits.set(key, recent);
  return true;
}

/** Test hook. */
export function resetLimits(): void {
  hits.clear();
}
