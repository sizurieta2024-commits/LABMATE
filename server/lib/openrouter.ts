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

/**
 * One structured-output call through OpenRouter. The provider enforces the JSON
 * schema; we still validate with zod because small models occasionally drift.
 */
export async function openRouterStructured<S extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: S;
  onBadOutput: (detail: string) => Error;
}): Promise<z.infer<S>> {
  const res = await fetch(URL, {
    method: "POST",
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
      provider: { require_parameters: true, sort: "throughput" },
      temperature: 0.4,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new UpstreamError(res.status, `OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";

  let raw: unknown;
  try {
    raw = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw opts.onBadOutput(`Not JSON: ${content.slice(0, 200)}`);
  }
  const parsed = opts.schema.safeParse(raw);
  if (!parsed.success) throw opts.onBadOutput(parsed.error.message.slice(0, 300));
  return parsed.data;
}
