import { fetchBrief } from "./api";
import type { Brief, Paper, Profile } from "./types";

// Briefs take 10-40 s to write, so the lab page starts one for the paper a student
// is most likely to tap. It lives in memory only: nothing is cached or counted
// against the free limit unless the student opens it.
const pending = new Map<string, Promise<Brief>>();

export function prefetchBrief(paper: Paper, authorName: string, profile: Profile): void {
  if (pending.has(paper.id)) return;
  const p = fetchBrief(authorName, paper, profile);
  p.catch(() => pending.delete(paper.id)); // a failed prefetch just means a normal load later
  pending.set(paper.id, p);
}

/** Hands over a prefetched brief (once) if one is in flight or done. */
export function takePrefetched(workId: string): Promise<Brief> | undefined {
  const p = pending.get(workId);
  pending.delete(workId);
  return p;
}
