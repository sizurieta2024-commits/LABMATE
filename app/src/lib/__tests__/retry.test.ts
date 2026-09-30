import { describe, expect, it, vi } from "vitest";
import { friendlyError, withRetry } from "../retry";

const res = (status: number) => new Response("{}", { status });
const noSleep = () => Promise.resolve();

describe("withRetry", () => {
  it("retries 503s and returns the first good response", async () => {
    const fn = vi.fn().mockResolvedValueOnce(res(503)).mockResolvedValueOnce(res(200));
    expect((await withRetry(fn, [1, 1], noSleep)).status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 400", async () => {
    const fn = vi.fn().mockResolvedValue(res(400));
    expect((await withRetry(fn, [1, 1], noSleep)).status).toBe(400);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the last delay and returns the failure", async () => {
    const fn = vi.fn().mockResolvedValue(res(429));
    expect((await withRetry(fn, [1, 1], noSleep)).status).toBe(429);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("retries network errors, then rethrows", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(withRetry(fn, [1], noSleep)).rejects.toThrow("offline");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("friendlyError", () => {
  it("hides server internals", () => {
    expect(friendlyError(502, "upstream error 502")).toMatch(/our side/);
    expect(friendlyError(429)).toMatch(/busy/);
    expect(friendlyError(400, "invalid request")).toBe("invalid request");
  });
});
