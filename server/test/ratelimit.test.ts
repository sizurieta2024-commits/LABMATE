import { beforeEach, describe, expect, it } from "vitest";
import { allow, resetLimits } from "../lib/ratelimit.js";

describe("rate limit", () => {
  beforeEach(resetLimits);

  it("allows 40 requests per 10 minutes per IP", () => {
    const t = 1_000_000;
    for (let i = 0; i < 40; i++) expect(allow("1.2.3.4", t + i)).toBe(true);
    expect(allow("1.2.3.4", t + 41)).toBe(false);
    expect(allow("5.6.7.8", t + 41)).toBe(true); // other IPs unaffected
    expect(allow("1.2.3.4", t + 10 * 60 * 1000 + 1)).toBe(true); // window slides
  });
});
