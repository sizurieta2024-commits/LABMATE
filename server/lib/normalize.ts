import type { Brief } from "./schemas.js";

/**
 * Makes a brief safe for the app whatever the model returned. The app's quiz
 * gate assumes exactly 3 questions (4 means it can never be passed), and small
 * models often ignore "exactly N" in the schema descriptions.
 */
export function normalizeBrief(b: Brief, random: () => number = Math.random): Brief {
  const quiz = b.quiz
    .filter((q) => q.options.length >= 2 && q.answerIndex >= 0 && q.answerIndex < q.options.length)
    .slice(0, 3)
    .map((q) => {
      // Shuffle so the correct answer isn't always in the same slot.
      const order = q.options.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return { ...q, options: order.map((i) => q.options[i]), answerIndex: order.indexOf(q.answerIndex) };
    });
  return {
    ...b,
    keyTerms: b.keyTerms.slice(0, 3).map((k) => ({
      term: k.term,
      // "Term: definition" → "definition"
      definition: k.definition.replace(new RegExp(`^\\s*${k.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:–-]\\s*`, "i"), ""),
    })),
    smartQuestions: b.smartQuestions.slice(0, 3),
    quiz,
  };
}
