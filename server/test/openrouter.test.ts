import { describe, expect, it } from "vitest";
import { toStrictSchema } from "../lib/openrouter.js";
import { Brief } from "../lib/schemas.js";

describe("toStrictSchema", () => {
  it("emits a strict schema without $schema or safe-integer bounds", () => {
    const s = toStrictSchema(Brief);
    const text = JSON.stringify(s);
    expect(s.$schema).toBeUndefined();
    expect(s.additionalProperties).toBe(false);
    expect(text).not.toContain(String(Number.MAX_SAFE_INTEGER));
    expect(s.required).toEqual(["summary", "whyItMatters", "keyTerms", "smartQuestions", "quiz"]);
  });
});
