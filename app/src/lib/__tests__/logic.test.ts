import { describe, expect, it } from "vitest";
import { daysAgo, formatMoney, nsfDateToIso, orgMatches, splitName } from "../grants";
import { reconstructAbstract, shortId, type RawWork } from "../openalex";
import { canSend, followUpDue, mailtoUrl, markSent, nextStatus } from "../outreach";
import { rankResearchers } from "../ranking";
import type { Outreach } from "../types";

const INST = "I100";
const now = new Date("2026-09-29T12:00:00Z");

function work(id: string, year: number, authors: [string, string, "first" | "middle" | "last", string?][]): RawWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Paper ${id}`,
    publication_year: year,
    publication_date: `${year}-06-01`,
    cited_by_count: 0,
    authorships: authors.map(([aid, name, pos, inst = INST]) => ({
      author_position: pos,
      author: { id: `https://openalex.org/${aid}`, display_name: name },
      institutions: [{ id: `https://openalex.org/${inst}` }],
    })),
  };
}

describe("rankResearchers", () => {
  it("ranks lab leads (last authors) at the institution above others", () => {
    const tagged = [
      { interest: "neuro", work: work("W1", 2026, [["A1", "Student One", "first"], ["A2", "Prof Two", "last"]]) },
      { interest: "neuro", work: work("W2", 2025, [["A3", "Other Place", "last", "I999"], ["A2", "Prof Two", "middle"]]) },
      { interest: "neuro", work: work("W3", 2024, [["A4", "Prof Four", "last"]]) },
    ];
    const ranked = rankResearchers(tagged, INST, now);
    expect(ranked.map((r) => r.id)).toEqual(["A2", "A4"]); // A1 filtered (1 paper, not last); A3 other institution
    expect(ranked[0].matchedPapers).toBe(2);
    expect(ranked[0].latestPaper.id).toBe("W1");
  });

  it("does not double count a paper matched by two interests, but rewards breadth", () => {
    const w = work("W1", 2026, [["A1", "Prof", "last"]]);
    const ranked = rankResearchers([{ interest: "a", work: w }, { interest: "b", work: w }], INST, now);
    expect(ranked[0].matchedPapers).toBe(1);
    expect(ranked[0].matchedInterests).toEqual(["a", "b"]);
    expect(ranked[0].score).toBe(5.6); // 3 (last) × 1.5 (this year) × 1.25 (2 interests), 1 decimal
  });

  it("ignores consortium papers with huge author lists", () => {
    const big = work("W1", 2026, Array.from({ length: 40 }, (_, i) => [`A${i}`, `Author ${i}`, i === 39 ? "last" : "middle"] as [string, string, "last" | "middle"]));
    expect(rankResearchers([{ interest: "x", work: big }], INST, now)).toHaveLength(0);
  });

  it("matches child institutions through lineage", () => {
    const w = work("W1", 2026, [["A1", "Prof", "last", "I555"]]);
    w.authorships[0].institutions[0].lineage = ["https://openalex.org/I555", `https://openalex.org/${INST}`];
    expect(rankResearchers([{ interest: "x", work: w }], INST, now)).toHaveLength(1);
  });
});

describe("openalex helpers", () => {
  it("rebuilds abstracts from the inverted index", () => {
    expect(reconstructAbstract({ world: [1], Hello: [0], again: [3], hello: [2] })).toBe("Hello world hello again");
    expect(reconstructAbstract(null)).toBe("");
  });
  it("shortens ids", () => expect(shortId("https://openalex.org/A5023888391")).toBe("A5023888391"));
});

describe("grant helpers", () => {
  it("splits names and drops suffixes", () => {
    expect(splitName("Jennifer A. Doudna")).toEqual({ first: "Jennifer", last: "Doudna" });
    expect(splitName("Martin Luther King Jr.")).toEqual({ first: "Martin", last: "King" });
  });
  it("matches organization names across databases", () => {
    expect(orgMatches("University of California, Berkeley", "UNIVERSITY OF CALIFORNIA BERKELEY")).toBe(true);
    expect(orgMatches("University of Michigan–Ann Arbor", "UNIVERSITY OF MICHIGAN AT ANN ARBOR")).toBe(true);
    expect(orgMatches("Stanford University", "UNIVERSITY OF MICHIGAN AT ANN ARBOR")).toBe(false);
  });
  it("formats dates and money", () => {
    expect(nsfDateToIso("8/5/2026")).toBe("2026-08-05");
    expect(daysAgo("2026-09-10", now)).toBe(19);
    expect(formatMoney(2_140_000)).toBe("$2.1M");
    expect(formatMoney(450_000)).toBe("$450K");
    expect(formatMoney(null)).toBe("");
  });
});

describe("outreach rules", () => {
  const base: Outreach = {
    id: "o1", researcherId: "A1", researcherName: "Prof X", paperTitle: "P", subject: "S", body: "B",
    status: "drafted", createdAt: now.toISOString(),
  };

  it("caps sends at 5 per rolling week", () => {
    const sent = Array.from({ length: 5 }, (_, i) => markSent({ ...base, id: `o${i}` }, now));
    expect(canSend(sent.slice(0, 4), now)).toBe(true);
    expect(canSend(sent, now)).toBe(false);
    const nextWeek = new Date(now.getTime() + 8 * 86_400_000);
    expect(canSend(sent, nextWeek)).toBe(true);
  });

  it("flags follow-ups after 7 days", () => {
    const s = markSent(base, now);
    expect(followUpDue(s, new Date(now.getTime() + 6 * 86_400_000))).toBe(false);
    expect(followUpDue(s, new Date(now.getTime() + 7 * 86_400_000))).toBe(true);
    expect(nextStatus("joined")).toBe("joined");
  });

  it("builds a mailto url", () => {
    expect(mailtoUrl("Hi & bye", "a b")).toBe("mailto:?subject=Hi%20%26%20bye&body=a%20b");
    expect(mailtoUrl("S", "B", "akil@umich.edu")).toBe("mailto:akil@umich.edu?subject=S&body=B");
    expect(mailtoUrl("S", "B", "not an email")).toBe("mailto:?subject=S&body=B");
  });
});
