import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // Resolves ANTHROPIC_API_KEY from the environment.
  client ??= new Anthropic();
  return client;
}

export class ModelRefusalError extends Error {}
export class ModelOutputError extends Error {}
export class MissingKeyError extends Error {}

/**
 * One structured-output call to Claude. Low effort keeps the demo snappy;
 * `fallbacks: "default"` re-runs a request on another model if a safety
 * classifier declines it, so a false positive doesn't break the app.
 */
export async function generateStructured<S extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: S;
}): Promise<z.infer<S>> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new MissingKeyError("Server is missing ANTHROPIC_API_KEY");
  }
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(opts.schema) },
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new ModelRefusalError(response.stop_details?.explanation ?? "Request declined");
  }
  if (response.parsed_output == null) {
    throw new ModelOutputError(`No parsable output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output as z.infer<S>;
}
