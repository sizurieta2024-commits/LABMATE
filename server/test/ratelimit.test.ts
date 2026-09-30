import { beforeEach, describe, expect, it } from "vitest";
import { allow, resetLimits } from "../lib/ratelimit.js";

describe("rate limit", () => {
  beforeEach(resetLimits);

  it("limits each endpoint per IP over 10 minutes", () => {
    const t = 1_000_000;
    for (let i = 0; i < 60; i++) expect(allow("1.2.3.4", "ai", t + i)).toBe(true);
    expect(allow("1.2.3.4", "ai", t + 61)).toBe(false);
    expect(allow("1.2.3.4", "nih", t + 61)).toBe(true); // separate budget per endpoint
    expect(allow("5.6.7.8", "ai", t + 61)).toBe(true); // other IPs unaffected
    expect(allow("1.2.3.4", "ai", t + 10 * 60 * 1000 + 1)).toBe(true); // window slides
  });
});
