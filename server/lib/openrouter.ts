import { z } from "zod";

// Cheap default: ~$0.09 / $0.35 per million tokens, well under a cent per brief.
// The smaller qwen3-30b-a3b is half the price but paired key terms with the wrong
// definitions in every test run. Override with OPENROUTER_MODEL.
const DEFAULT_MODEL = "qwen/qwen3-235b-a22b-2507";
const URL = "https://openrouter.ai/api/v1/chat/completions";

/** Non-2xx from OpenRouter; `status` drives the HTTP error the app sees. */
export class UpstreamError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Zod → JSON Schema that strict structured-output providers accept. */
export function toStrictSchema(schema: z.ZodType): Record<string, unknown> {
  const clean = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(clean);
    if (!node || typeof node !== "object") return node;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "$schema") continue;
      // z.number().int() emits ±MAX_SAFE_INTEGER bounds; some providers reject them.
      if ((k === "minimum" || k === "maximum") && Math.abs(v as number) === Number.MAX_SAFE_INTEGER) continue;
      out[k] = clean(v);
    }
    return out;
  };
  return clean(z.toJSONSchema(schema)) as Record<string, unknown>;
}

const ATTEMPTS = 2;
const ATTEMPT_TIMEOUT_MS = 45_000;

type Opts<S extends z.ZodType> = {
  system: string;
  prompt: string;
  schema: S;
  onBadOutput: (detail: string) => Error;
};

/** Worth another try: a slow or flaky provider, not a bad key or bad request. */
function retryable(error: unknown): boolean {
  if (error instanceof UpstreamError) return error.status === 429 || error.status >= 500;
  return true; // timeouts, network errors, unparsable output
}

/**
 * One structured-output call through OpenRouter. The provider enforces the JSON
 * schema; we still validate with zod because small models occasionally drift.
 * A slow provider sometimes returns truncated JSON after a minute or more, so
 * each attempt is capped and retried once (OpenRouter re-routes the retry).
 */
export async function openRouterStructured<S extends z.ZodType>(opts: Opts<S>): Promise<z.infer<S>> {
  const avoid: string[] = [];
  for (let attempt = 1; ; attempt++) {
    try {
      return await callOnce(opts, avoid);
    } catch (error) {
      // Some providers occasionally pad JSON mode with whitespace until the token
      // limit; retry on a different one.
      if (error instanceof ProviderOutputError) avoid.push(error.provider);
      console.warn(`OpenRouter attempt ${attempt} failed: ${error instanceof Error ? error.message : error}`);
      if (attempt >= ATTEMPTS || !retryable(error)) {
        if (error instanceof Error && error.name === "TimeoutError") throw new UpstreamError(504, "AI took too long");
        throw error instanceof ProviderOutputError ? error.inner : error;
      }
    }
  }
}

class ProviderOutputError extends Error {
  constructor(
    public provider: string,
    public inner: Error,
  ) {
    super(inner.message);
  }
}

async function callOnce<S extends z.ZodType>(opts: Opts<S>, avoid: string[]): Promise<z.infer<S>> {
  const res = await fetch(URL, {
    method: "POST",
    signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
    headers: {
      authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "content-type": "application/json",
      "x-title": "Labmate",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "output", strict: true, schema: toStrictSchema(opts.schema) },
      },
      // Only providers that enforce the schema; fastest first (demo latency matters).
      provider: { require_parameters: true, sort: "throughput", ...(avoid.length ? { ignore: avoid } : {}) },
      temperature: 0.4,
      // A brief is ~1.5K tokens; the cap stops a runaway response early.
      max_tokens: 2500,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new UpstreamError(res.status, `OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { provider?: string; choices?: { message?: { content?: string }; finish_reason?: string }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  const bad = (detail: string) =>
    new ProviderOutputError(data.provider ?? "unknown", opts.onBadOutput(`${detail} (provider ${data.provider}, finish ${data.choices?.[0]?.finish_reason})`));

  let raw: unknown;
  try {
    raw = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw bad(`Not JSON: ${content.trim().slice(0, 120)}`);
  }
  const parsed = opts.schema.safeParse(raw);
  if (!parsed.success) throw bad(parsed.error.message.slice(0, 300));
  return parsed.data;
}
