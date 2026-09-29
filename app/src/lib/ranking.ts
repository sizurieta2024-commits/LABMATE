import { shortId, type RawWork } from "./openalex";
import type { Researcher } from "./types";

// Last author is usually the lab head (PI) in the sciences.
const POSITION_WEIGHT = { last: 3, first: 1, middle: 0.5 } as const;

type Tagged = { work: RawWork; interest: string };

function atInstitution(inst: RawWork["authorships"][number]["institutions"][number], institutionId: string) {
  if (!inst.id) return false;
  return shortId(inst.id) === institutionId || (inst.lineage ?? []).some((l) => shortId(l) === institutionId);
}

/**
 * Turns interest-matched works into a ranked list of researchers at one
 * institution. Pure function: easy to test, no network.
 */
export function rankResearchers(
  tagged: Tagged[],
  institutionId: string,
  now: Date = new Date(),
  limit = 40,
): Researcher[] {
  const byAuthor = new Map<
    string,
    Researcher & { latestDate: string; seenWorks: Set<string> }
  >();
  const thisYear = now.getFullYear();

  for (const { work, interest } of tagged) {
    for (const a of work.authorships) {
      if (!a.author.id || !a.institutions.some((i) => atInstitution(i, institutionId))) continue;
      const id = shortId(a.author.id);
      let r = byAuthor.get(id);
      if (!r) {
        r = {
          id,
          name: a.author.display_name,
          score: 0,
          matchedPapers: 0,
          lastAuthorPapers: 0,
          matchedInterests: [],
          latestPaper: { id: shortId(work.id), title: work.title ?? "Untitled", year: work.publication_year ?? undefined },
          latestDate: "",
          seenWorks: new Set(),
        };
        byAuthor.set(id, r);
      }
      if (!r.matchedInterests.includes(interest)) r.matchedInterests.push(interest);
      const workId = shortId(work.id);
      if (r.seenWorks.has(workId)) continue; // same paper matched two interests
      r.seenWorks.add(workId);

      const age = thisYear - (work.publication_year ?? thisYear - 3);
      const recency = age <= 0 ? 1.5 : age === 1 ? 1.2 : 1;
      r.score += POSITION_WEIGHT[a.author_position] * recency;
      r.matchedPapers += 1;
      if (a.author_position === "last") r.lastAuthorPapers += 1;

      const date = work.publication_date ?? "";
      if (date > r.latestDate) {
        r.latestDate = date;
        r.latestPaper = { id: workId, title: work.title ?? "Untitled", year: work.publication_year ?? undefined };
      }
    }
  }

  return [...byAuthor.values()]
    .map(({ latestDate: _d, seenWorks: _s, ...r }) => ({
      ...r,
      // Researchers matching several interests are a better fit.
      score: Math.round(r.score * (1 + 0.25 * (r.matchedInterests.length - 1)) * 10) / 10,
    }))
    // Mostly-middle-author people are usually students/postdocs, not lab heads.
    .filter((r) => r.lastAuthorPapers > 0 || r.matchedPapers >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
