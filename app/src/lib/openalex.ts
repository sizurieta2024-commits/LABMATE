// OpenAlex: free, open index of scholarly works (https://openalex.org).
import type { AuthorDetails, Institution, Paper } from "./types";

const BASE = "https://api.openalex.org";
const EMAIL = process.env.EXPO_PUBLIC_OPENALEX_EMAIL;
const API_KEY = process.env.EXPO_PUBLIC_OPENALEX_API_KEY;

export function shortId(url: string): string {
  return url.slice(url.lastIndexOf("/") + 1);
}

export function reconstructAbstract(index: Record<string, number[]> | null | undefined): string {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const p of positions) words[p] = word;
  }
  return words.filter(Boolean).join(" ");
}

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  if (EMAIL) url.searchParams.set("mailto", EMAIL);
  if (API_KEY) url.searchParams.set("api_key", API_KEY);
  const res = await fetch(url.toString());
  if (!res.ok) throw new OpenAlexError(res.status, `OpenAlex ${res.status} for ${path}`);
  return (await res.json()) as T;
}

export class OpenAlexError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ---- Raw API shapes (only the fields we select) ----

export type RawAuthorship = {
  author_position: "first" | "middle" | "last";
  author: { id: string | null; display_name: string };
  institutions: { id: string | null; display_name?: string; lineage?: string[] }[];
};

export type RawWork = {
  id: string;
  title: string | null;
  publication_year: number | null;
  publication_date: string | null;
  cited_by_count: number;
  authorships: RawAuthorship[];
  abstract_inverted_index?: Record<string, number[]> | null;
  primary_location?: { source?: { display_name?: string } | null } | null;
  doi?: string | null;
};

type List<T> = { results: T[] };

// ---- Queries ----

export async function searchInstitutions(query: string): Promise<Institution[]> {
  if (query.trim().length < 2) return [];
  const data = await get<
    List<{ id: string; display_name: string; country_code?: string; geo?: { city?: string } }>
  >("/institutions", {
    search: query,
    filter: "type:education",
    per_page: 8,
    select: "id,display_name,country_code,geo",
  });
  return data.results.map((r) => ({
    id: shortId(r.id),
    name: r.display_name,
    city: r.geo?.city,
    country: r.country_code,
  }));
}

/** Recent works at an institution matching a research interest. */
export async function searchWorksAtInstitution(institutionId: string, interest: string): Promise<RawWork[]> {
  const since = `${new Date().getFullYear() - 3}-01-01`;
  const params = (instFilter: string) => ({
    search: interest,
    filter: `${instFilter}:${institutionId},from_publication_date:${since}`,
    per_page: 200,
    select: "id,title,publication_year,publication_date,cited_by_count,authorships",
  });
  try {
    // lineage also covers child institutions (e.g. a university's medical school)
    return (await get<List<RawWork>>("/works", params("authorships.institutions.lineage"))).results;
  } catch (e) {
    if (e instanceof OpenAlexError && e.status === 400) {
      return (await get<List<RawWork>>("/works", params("institutions.id"))).results;
    }
    throw e;
  }
}

export async function getAuthor(authorId: string): Promise<AuthorDetails> {
  const a = await get<{
    id: string;
    display_name: string;
    works_count: number;
    cited_by_count: number;
    summary_stats?: { h_index?: number };
    topics?: { display_name: string }[];
    last_known_institutions?: { display_name: string }[];
  }>(`/authors/${authorId}`, {
    select: "id,display_name,works_count,cited_by_count,summary_stats,topics,last_known_institutions",
  });
  return {
    id: shortId(a.id),
    name: a.display_name,
    worksCount: a.works_count,
    citedBy: a.cited_by_count,
    hIndex: a.summary_stats?.h_index,
    topics: (a.topics ?? []).slice(0, 5).map((t) => t.display_name),
    institution: a.last_known_institutions?.[0]?.display_name,
  };
}

function toPaper(w: RawWork): Paper {
  return {
    id: shortId(w.id),
    title: w.title ?? "Untitled",
    year: w.publication_year ?? undefined,
    abstract: reconstructAbstract(w.abstract_inverted_index),
    venue: w.primary_location?.source?.display_name ?? undefined,
    citedBy: w.cited_by_count,
    doi: w.doi ?? undefined,
  };
}

const PAPER_FIELDS =
  "id,title,publication_year,publication_date,cited_by_count,authorships,abstract_inverted_index,primary_location,doi";

export async function getRecentPapers(authorId: string, count = 5): Promise<Paper[]> {
  const data = await get<List<RawWork>>("/works", {
    filter: `author.id:${authorId},type:article`,
    sort: "publication_date:desc",
    per_page: count,
    select: PAPER_FIELDS,
  });
  return data.results.map(toPaper);
}

export async function getPaper(workId: string): Promise<Paper> {
  return toPaper(await get<RawWork>(`/works/${workId}`, { select: PAPER_FIELDS }));
}
