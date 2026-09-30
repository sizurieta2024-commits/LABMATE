import { generateStructured } from "../lib/claude.js";
import { handler, preflight } from "../lib/http.js";
import { DRAFT_SYSTEM, draftPrompt } from "../lib/prompts.js";
import { Draft, DraftRequest } from "../lib/schemas.js";

export const POST = handler(DraftRequest, (req) =>
  generateStructured({ system: DRAFT_SYSTEM, prompt: draftPrompt(req), schema: Draft, maxTokens: 800 }),
);

export const OPTIONS = preflight;
