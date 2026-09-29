import { generateStructured } from "../lib/claude.js";
import { handler, preflight } from "../lib/http.js";
import { BRIEF_SYSTEM, briefPrompt } from "../lib/prompts.js";
import { Brief, BriefRequest } from "../lib/schemas.js";

export const POST = handler(BriefRequest, (req) =>
  generateStructured({ system: BRIEF_SYSTEM, prompt: briefPrompt(req), schema: Brief }),
);

export const OPTIONS = preflight;
