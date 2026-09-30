import { describe, expect, it } from "vitest";
import { normalizeBrief } from "../lib/normalize.js";
import type { Brief } from "../lib/schemas.js";

const q = (answerIndex: number) => ({ question: "Q", options: ["a", "b", "c", "d"], answerIndex, explanation: "E" });
const base: Brief = {
  summary: "S",
  whyItMatters: "W",
  keyTerms: Array.from({ length: 10 }, (_, i) => ({ term: `Term ${i}`, definition: `Term ${i}: meaning ${i}` })),
  smartQuestions: ["1", "2", "3", "4", "5"],
  quiz: [q(0), q(1), q(2), q(3)],
};

describe("normalizeBrief", () => {
  it("trims to 3 of each so the quiz gate can be passed", () => {
    const b = normalizeBrief(base);
    expect(b.keyTerms).toHaveLength(3);
    expect(b.smartQuestions).toHaveLength(3);
    expect(b.quiz).toHaveLength(3);
  });

  it("drops a repeated term prefix from definitions", () => {
    expect(normalizeBrief(base).keyTerms[0].definition).toBe("meaning 0");
  });

  it("shuffles options but keeps the answer pointing at the same text", () => {
    const b = normalizeBrief(base, () => 0);
    base.quiz.slice(0, 3).forEach((orig, i) => {
      expect(b.quiz[i].options[b.quiz[i].answerIndex]).toBe(orig.options[orig.answerIndex]);
    });
    expect(b.quiz[0].options).not.toEqual(base.quiz[0].options);
  });

  it("drops questions whose answer index is out of range", () => {
    expect(normalizeBrief({ ...base, quiz: [q(9), q(0)] }).quiz).toHaveLength(1);
  });
  it("drops blank options and leaked field names, keeping the right answer", () => {
    const leaky = { question: "Q", options: ["Right", " ", "Wrong", "answerIndex"], answerIndex: 0, explanation: "E" };
    const b = normalizeBrief({ ...base, quiz: [leaky] }, () => 0);
    expect(b.quiz[0].options).toHaveLength(2);
    expect(b.quiz[0].options).not.toContain("answerIndex");
    expect(b.quiz[0].options[b.quiz[0].answerIndex]).toBe("Right");
  });

  it("drops a question whose correct answer was itself junk", () => {
    const junk = { question: "Q", options: ["a", "b", "explanation"], answerIndex: 2, explanation: "E" };
    expect(normalizeBrief({ ...base, quiz: [junk] }).quiz).toHaveLength(0);
  });
});
