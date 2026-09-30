/** Status codes worth retrying: rate limits and server-side hiccups. */
export const retryable = (status: number) => status === 429 || status >= 500;

/**
 * Calls `fn` until it returns a response that isn't retryable, waiting `delays`
 * between attempts. Network errors are retried too; the last one is rethrown.
 */
export async function withRetry(
  fn: () => Promise<Response>,
  delays: number[] = [700, 1800],
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fn();
      if (!retryable(res.status) || attempt >= delays.length) return res;
    } catch (e) {
      if (attempt >= delays.length) throw e;
    }
    await sleep(delays[attempt]);
  }
}

/** A message a student can act on, for an HTTP failure. */
export function friendlyError(status: number, serverMessage?: string): string {
  if (status === 429) return "Labmate is busy right now. Try again in a minute.";
  if (status >= 500) return "Something went wrong on our side. Try again in a moment.";
  return serverMessage ?? `Request failed (${status}).`;
}
