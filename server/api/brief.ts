import { generateStructured, ModelOutputError } from "../lib/claude.js";
import { handler, preflight } from "../lib/http.js";
import { normalizeBrief } from "../lib/normalize.js";
import { BRIEF_SYSTEM, briefPrompt } from "../lib/prompts.js";
import { Brief, BriefRequest } from "../lib/schemas.js";

export const POST = handler(BriefRequest, async (req) => {
  const make = async () =>
    normalizeBrief(await generateStructured({ system: BRIEF_SYSTEM, prompt: briefPrompt(req), schema: Brief, maxTokens: 2200 }));
  // The app's quiz gate needs exactly 3 usable questions; ask once more if the model gave fewer.
  const brief = await make();
  if (brief.quiz.length === 3) return brief;
  const again = await make();
  if (again.quiz.length === 3) return again;
  throw new ModelOutputError(`quiz had ${again.quiz.length} usable questions`);
});

export const OPTIONS = preflight;
