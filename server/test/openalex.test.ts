import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCache, GET } from "../api/openalex.js";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ results: [] }), { status: 200 }));
  process.env.OPENALEX_API_KEY = "oa-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  clearCache();
  delete process.env.OPENALEX_API_KEY;
  delete process.env.LABMATE_APP_KEY;
});

const get = (qs: string, headers: Record<string, string> = {}) =>
  GET(new Request(`http://x/api/openalex?${qs}`, { headers }));

describe("openalex proxy", () => {
  it("forwards allowed paths with the server's API key", async () => {
    const res = await get("path=/works&search=crispr&per_page=5");
    expect(res.status).toBe(200);
    const called = new URL(fetchMock.mock.calls[0][0]);
    expect(called.origin + called.pathname).toBe("https://api.openalex.org/works");
    expect(called.searchParams.get("search")).toBe("crispr");
    expect(called.searchParams.get("api_key")).toBe("oa-key");
    expect(called.searchParams.has("path")).toBe(false);
  });

  it("allows single entities and rejects anything else", async () => {
    expect((await get("path=/authors/A5023888391")).status).toBe(200);
    expect((await get("path=/works/W123")).status).toBe(200);
    expect((await get("path=/funders")).status).toBe(400);
    expect((await get("path=/works/../authors")).status).toBe(400);
    expect((await get("")).status).toBe(400);
  });

  it("never lets the client supply its own api_key", async () => {
    await get("path=/works&api_key=evil");
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("api_key")).toBe("oa-key");
  });

  it("caches identical queries regardless of parameter order", async () => {
    await get("path=/works&a=1&b=2");
    const second = await get("path=/works&b=2&a=1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.headers.get("x-labmate-cache")).toBe("HIT");
  });

  it("does not cache upstream errors", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429 }));
    expect((await get("path=/works&q=1")).status).toBe(429);
    expect((await get("path=/works&q=1")).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("requires the app key when configured", async () => {
    process.env.LABMATE_APP_KEY = "k";
    expect((await get("path=/works")).status).toBe(401);
    expect((await get("path=/works", { "x-labmate-key": "k" })).status).toBe(200);
  });
});
