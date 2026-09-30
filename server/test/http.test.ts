import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/claude.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/claude.js")>();
  return { ...actual, generateStructured: vi.fn() };
});

const { generateStructured, ModelRefusalError } = await import("../lib/claude.js");
const { POST } = await import("../api/brief.js");

const validBody = {
  professorName: "Ada Lovelace",
  paper: { title: "Engines of analysis", abstract: "We study engines." },
  student: { name: "Sam", school: "State University" },
};

const emptyBrief = { summary: "ok", whyItMatters: "", keyTerms: [], smartQuestions: [], quiz: [] };

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://x/api/brief", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.mocked(generateStructured).mockReset();
  delete process.env.LABMATE_APP_KEY;
});

describe("brief endpoint", () => {
  it("returns the model output for a valid request", async () => {
    vi.mocked(generateStructured).mockResolvedValue(emptyBrief);
    const res = await POST(post(validBody));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(emptyBrief);
    const call = vi.mocked(generateStructured).mock.calls[0][0];
    expect(call.prompt).toContain("Engines of analysis");
    expect(call.prompt).toContain("State University");
  });

  it("rejects invalid JSON and invalid shapes", async () => {
    expect((await POST(post("{nope"))).status).toBe(400);
    expect((await POST(post({ professorName: "x" }))).status).toBe(400);
    expect(generateStructured).not.toHaveBeenCalled();
  });

  it("enforces the shared app key when configured", async () => {
    process.env.LABMATE_APP_KEY = "secret";
    expect((await POST(post(validBody))).status).toBe(401);
    vi.mocked(generateStructured).mockResolvedValue(emptyBrief);
    expect((await POST(post(validBody, { "x-labmate-key": "secret" }))).status).toBe(200);
  });

  it("maps a model refusal to 422", async () => {
    vi.mocked(generateStructured).mockRejectedValue(new ModelRefusalError("no"));
    expect((await POST(post(validBody))).status).toBe(422);
  });
});
