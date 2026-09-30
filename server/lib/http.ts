import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { MissingKeyError, ModelOutputError, ModelRefusalError } from "./claude.js";
import { UpstreamError } from "./openrouter.js";
import { allow, clientIp } from "./ratelimit.js";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-labmate-key",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Light abuse protection: the app sends a shared key (set in both the app's
 * and the server's env). Not a real secret once the app ships, but it keeps
 * random traffic off the Claude bill.
 */
export function requireAppKey(request: Request): Response | null {
  const expected = process.env.LABMATE_APP_KEY;
  if (!expected || request.headers.get("x-labmate-key") === expected) return null;
  return json({ error: "unauthorized" }, 401);
}

export function handler<Req extends z.ZodType>(
  schema: Req,
  run: (input: z.infer<Req>) => Promise<unknown>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const denied = requireAppKey(request);
    if (denied) return denied;
    if (!allow(clientIp(request))) return json({ error: "Too many requests. Try again in a few minutes." }, 429);

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: "invalid request", issues: z.flattenError(parsed.error) }, 400);
    }

    try {
      return json(await run(parsed.data));
    } catch (error) {
      if (error instanceof MissingKeyError) return json({ error: error.message }, 500);
      if (error instanceof ModelRefusalError) return json({ error: "declined", detail: error.message }, 422);
      if (error instanceof ModelOutputError) return json({ error: "bad model output", detail: error.message }, 502);
      if (error instanceof UpstreamError) {
        console.error(error.message);
        if (error.status === 429) return json({ error: "busy, try again shortly" }, 429);
        if (error.status === 401 || error.status === 402) return json({ error: "server misconfigured" }, 500);
        if (error.status === 504) return json({ error: "The AI took too long. Please try again." }, 504);
        return json({ error: `upstream error ${error.status}` }, 502);
      }
      if (error instanceof Anthropic.RateLimitError) return json({ error: "busy, try again shortly" }, 429);
      if (error instanceof Anthropic.AuthenticationError) return json({ error: "server misconfigured" }, 500);
      if (error instanceof Anthropic.APIError) return json({ error: `upstream error ${error.status}` }, 502);
      console.error(error);
      return json({ error: "internal error" }, 500);
    }
  };
}
