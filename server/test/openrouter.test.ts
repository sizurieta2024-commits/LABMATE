import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { openRouterStructured, toStrictSchema, UpstreamError } from "../lib/openrouter.js";
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

describe("openRouterStructured", () => {
  const schema = z.object({ subject: z.string() });
  const opts = { system: "s", prompt: "p", schema, onBadOutput: (d: string) => new Error(d) };
  const reply = (content: string, status = 200) =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retries once when the first answer isn't valid JSON", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetch = vi.fn().mockResolvedValueOnce(reply('{"subj')).mockResolvedValueOnce(reply('{"subject":"Hi"}'));
    vi.stubGlobal("fetch", fetch);
    expect(await openRouterStructured(opts)).toEqual({ subject: "Hi" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("retries on a different provider after bad output", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad = new Response(JSON.stringify({ provider: "Slowco", choices: [{ message: { content: "{   " } }] }));
    const fetch = vi.fn().mockResolvedValueOnce(bad).mockResolvedValueOnce(reply('{"subject":"Hi"}'));
    vi.stubGlobal("fetch", fetch);
    await openRouterStructured(opts);
    const second = JSON.parse(fetch.mock.calls[1][1].body);
    expect(second.provider.ignore).toEqual(["Slowco"]);
  });

  it("does not retry a bad key", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetch = vi.fn().mockResolvedValue(new Response("nope", { status: 401 }));
    vi.stubGlobal("fetch", fetch);
    await expect(openRouterStructured(opts)).rejects.toBeInstanceOf(UpstreamError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
