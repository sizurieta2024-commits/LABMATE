// Fresh grant money is a strong "this lab is probably hiring" signal.
// NIH RePORTER: https://api.reporter.nih.gov (keyless)  ·  NSF Awards: https://resources.research.gov/common/webapi/awardapisearch-v1.htm (keyless)
import { serverFetch } from "./api";
import type { Grant } from "./types";

const DAY_MS = 86_400_000;
// True in the browser build; React Native has no DOM.
const IS_WEB = typeof document !== "undefined";

export function splitName(displayName: string): { first: string; last: string } {
  const parts = displayName
    .replace(/,?\s+(Jr\.?|Sr\.?|II|III|IV|PhD|MD)$/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return { first: parts[0] ?? "", last: parts[parts.length - 1] ?? "" };
}

const STOP = new Set(["university", "of", "the", "at", "and", "college", "institute", "school", "inc", "campus"]);
function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

/** Loose match between OpenAlex and NIH/NSF organization names. */
export function orgMatches(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = new Set(tokens(b));
  if (ta.length === 0 || tb.size === 0) return false;
  const shared = ta.filter((t) => tb.has(t)).length;
  return shared / Math.min(ta.length, tb.size) >= 0.6;
}

export function daysAgo(isoDate: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(isoDate).getTime()) / DAY_MS));
}

/** NSF dates are MM/DD/YYYY. */
export function nsfDateToIso(d: string): string {
  const [m, day, y] = d.split("/");
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

type NihProject = {
  appl_id?: number;
  project_title?: string;
  award_amount?: number | null;
  award_notice_date?: string | null;
  organization?: { org_name?: string };
};

async function nihGrants(name: string, institution: string, now: Date): Promise<Grant[]> {
  const { first, last } = splitName(name);
  const y = now.getFullYear();
  const fiscalYears = [y - 1, y, y + 1];
  // NIH sends no CORS headers, so browsers (the web build) go through our server.
  const res = IS_WEB
    ? await serverFetch("/api/nih", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName: first, lastName: last, fiscalYears }),
      })
    : await fetch("https://api.reporter.nih.gov/v2/projects/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          criteria: { pi_names: [{ first_name: first, last_name: last }], fiscal_years: fiscalYears },
          offset: 0,
          limit: 25,
          sort_field: "award_notice_date",
          sort_order: "desc",
        }),
      });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: NihProject[] };
  return (data.results ?? [])
    .filter((p) => p.award_notice_date && orgMatches(institution, p.organization?.org_name ?? ""))
    .map((p) => ({
      source: "NIH" as const,
      title: p.project_title ?? "NIH project",
      amount: p.award_amount ?? null,
      date: p.award_notice_date!.slice(0, 10),
      daysAgo: daysAgo(p.award_notice_date!, now),
      url: p.appl_id ? `https://reporter.nih.gov/project-details/${p.appl_id}` : "https://reporter.nih.gov",
    }));
}

type NsfAward = { id?: string; title?: string; date?: string; fundsObligatedAmt?: string; awardeeName?: string };

async function nsfGrants(name: string, institution: string, now: Date): Promise<Grant[]> {
  const { first, last } = splitName(name);
  const start = new Date(now.getTime() - 400 * DAY_MS);
  // api.nsf.gov now redirects unreliably; research.gov is the current host.
  const url = new URL("https://www.research.gov/awardapi-service/v1/awards.json");
  url.searchParams.set("pdPIName", `${first} ${last}`);
  url.searchParams.set("dateStart", `${start.getMonth() + 1}/${start.getDate()}/${start.getFullYear()}`);
  url.searchParams.set("printFields", "id,title,date,fundsObligatedAmt,awardeeName");
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as { response?: { award?: NsfAward[] } };
  return (data.response?.award ?? [])
    .filter((a) => a.date && orgMatches(institution, a.awardeeName ?? ""))
    .map((a) => {
      const iso = nsfDateToIso(a.date!);
      return {
        source: "NSF" as const,
        title: a.title ?? "NSF award",
        amount: a.fundsObligatedAmt ? Number(a.fundsObligatedAmt) : null,
        date: iso,
        daysAgo: daysAgo(iso, now),
        url: a.id ? `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${a.id}` : "https://www.nsf.gov/awardsearch/",
      };
    });
}

/** Most recent NIH or NSF award in the last ~13 months, or null. */
export async function latestGrant(name: string, institution: string, now: Date = new Date()): Promise<Grant | null> {
  const results = await Promise.allSettled([nihGrants(name, institution, now), nsfGrants(name, institution, now)]);
  const all = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((g) => g.daysAgo <= 400)
    .sort((a, b) => a.daysAgo - b.daysAgo);
  return all[0] ?? null;
}

export function formatMoney(amount: number | null): string {
  if (amount == null) return "";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}
