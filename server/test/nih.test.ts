import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../api/nih.js";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ results: [{ appl_id: 1 }] }), {
        status: 200,
      }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  delete process.env.LABMATE_APP_KEY;
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://x/api/nih", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );

describe("nih proxy", () => {
  it("builds the RePORTER search from the PI name and returns its results with CORS", async () => {
    const res = await post({
      firstName: "Scott",
      lastName: "Makeig",
      fiscalYears: [2025, 2026],
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(await res.json()).toEqual({ results: [{ appl_id: 1 }] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.reporter.nih.gov/v2/projects/search");
    const sent = JSON.parse(init.body);
    expect(sent.criteria).toEqual({
      pi_names: [{ first_name: "Scott", last_name: "Makeig" }],
      fiscal_years: [2025, 2026],
    });
    expect(sent.limit).toBe(25);
  });

  it("rejects bad input without calling NIH", async () => {
    expect(
      (await post({ firstName: "", lastName: "X", fiscalYears: [2026] }))
        .status,
    ).toBe(400);
    expect(
      (await post({ firstName: "A", lastName: "B", fiscalYears: [] })).status,
    ).toBe(400);
    expect(
      (
        await post({
          firstName: "A".repeat(200),
          lastName: "B",
          fiscalYears: [2026],
        })
      ).status,
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports an unreachable NIH as 502", async () => {
    fetchMock.mockRejectedValueOnce(new Error("down"));
    expect(
      (await post({ firstName: "A", lastName: "B", fiscalYears: [2026] }))
        .status,
    ).toBe(502);
  });

  it("requires the app key when one is configured", async () => {
    process.env.LABMATE_APP_KEY = "k";
    expect(
      (await post({ firstName: "A", lastName: "B", fiscalYears: [2026] }))
        .status,
    ).toBe(401);
  });
});
