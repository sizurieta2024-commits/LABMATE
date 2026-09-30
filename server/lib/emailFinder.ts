// Finds a professor's email in the author affiliations of their own published
// papers (Europe PMC lists corresponding authors' emails there). Real, public
// data only: if no paper lists one, we say so instead of guessing.

export type EpmcAuthor = {
  firstName?: string;
  lastName?: string;
  authorAffiliationDetailsList?: {
    authorAffiliation?: { affiliation?: string }[];
  };
};

export type EpmcResult = {
  id: string;
  source: string;
  title?: string;
  pubYear?: string;
  authorList?: { author?: EpmcAuthor[] };
};

export type EmailMatch = {
  email: string;
  source: { title: string; year: number | null; url: string };
};

// Correction/erratum notices repeat old author details; cite a real paper instead.
const NOTICE_RE = /^(correction|erratum|corrigendum|retraction|expression of concern)\b/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const STOP = new Set([
  "university",
  "of",
  "the",
  "at",
  "and",
  "college",
  "institute",
  "school",
  "inc",
  "campus",
]);

export function splitName(displayName: string): {
  first: string;
  last: string;
} {
  const parts = displayName
    .replace(/,?\s+(Jr\.?|Sr\.?|II|III|IV|PhD|MD)$/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return { first: parts[0] ?? "", last: parts[parts.length - 1] ?? "" };
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

/** Most of the institution's distinctive words appear in the affiliation. */
function affiliationMatches(affiliation: string, institution: string): boolean {
  const inst = tokens(institution);
  if (inst.length === 0) return false;
  const aff = new Set(tokens(affiliation));
  return inst.filter((t) => aff.has(t)).length / inst.length >= 0.6;
}

function sameAuthor(a: EpmcAuthor, first: string, last: string): boolean {
  const aLast = (a.lastName ?? "").toLowerCase();
  const aFirst = (a.firstName ?? "").toLowerCase();
  return (
    aLast === last.toLowerCase() &&
    aFirst.charAt(0) === first.charAt(0).toLowerCase()
  );
}

/**
 * The email that the named author lists most often (ties: most recent paper)
 * in affiliations at `institution`, or null.
 */
export function pickEmail(
  results: EpmcResult[],
  displayName: string,
  institution: string,
): EmailMatch | null {
  const { first, last } = splitName(displayName);
  if (!first || !last) return null;

  const seen = new Map<string, { count: number; newest: EmailMatch }>();
  for (const r of results) {
    if (NOTICE_RE.test(r.title ?? "")) continue;
    const year = r.pubYear ? Number(r.pubYear) : null;
    for (const author of r.authorList?.author ?? []) {
      if (!sameAuthor(author, first, last)) continue;
      for (const { affiliation = "" } of author.authorAffiliationDetailsList
        ?.authorAffiliation ?? []) {
        if (!affiliationMatches(affiliation, institution)) continue;
        for (const raw of affiliation.match(EMAIL_RE) ?? []) {
          const email = raw.toLowerCase().replace(/\.+$/, "");
          const match: EmailMatch = {
            email,
            source: {
              title: r.title ?? "Published paper",
              year,
              url: `https://europepmc.org/article/${r.source}/${r.id}`,
            },
          };
          const prev = seen.get(email);
          if (!prev) seen.set(email, { count: 1, newest: match });
          else {
            prev.count += 1;
            if ((year ?? 0) > (prev.newest.source.year ?? 0))
              prev.newest = match;
          }
        }
      }
    }
  }

  let best: { count: number; newest: EmailMatch } | null = null;
  for (const entry of seen.values()) {
    if (
      !best ||
      entry.count > best.count ||
      (entry.count === best.count &&
        (entry.newest.source.year ?? 0) > (best.newest.source.year ?? 0))
    ) {
      best = entry;
    }
  }
  return best?.newest ?? null;
}
