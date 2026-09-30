import { describe, expect, it } from "vitest";
import { pickEmail, type EpmcResult } from "../lib/emailFinder.js";

const paper = (
  year: string,
  authors: { firstName: string; lastName: string; affiliations: string[] }[],
  id = "1",
): EpmcResult => ({
  id,
  source: "MED",
  title: `Paper ${year}`,
  pubYear: year,
  authorList: {
    author: authors.map((a) => ({
      firstName: a.firstName,
      lastName: a.lastName,
      authorAffiliationDetailsList: {
        authorAffiliation: a.affiliations.map((affiliation) => ({
          affiliation,
        })),
      },
    })),
  },
});

const INST = "University of California San Diego";

describe("pickEmail", () => {
  it("returns the professor's email from their own affiliation, newest paper first", () => {
    const results = [
      paper(
        "2024",
        [
          {
            firstName: "Scott",
            lastName: "Makeig",
            affiliations: [
              "Swartz Center, University of California San Diego, La Jolla, CA, USA. smakeig@ucsd.edu.",
            ],
          },
        ],
        "a",
      ),
      paper(
        "2019",
        [
          {
            firstName: "Scott",
            lastName: "Makeig",
            affiliations: ["UC San Diego. old@ucsd.edu"],
          },
        ],
        "b",
      ),
    ];
    expect(pickEmail(results, "Scott Makeig", INST)).toEqual({
      email: "smakeig@ucsd.edu",
      source: {
        title: "Paper 2024",
        year: 2024,
        url: "https://europepmc.org/article/MED/a",
      },
    });
  });

  it("ignores co-authors' emails and people with the same last name but another first initial", () => {
    const results = [
      paper("2025", [
        {
          firstName: "Scott",
          lastName: "Makeig",
          affiliations: ["University of California San Diego"],
        },
        {
          firstName: "Ana",
          lastName: "Lee",
          affiliations: ["University of California San Diego. alee@ucsd.edu"],
        },
        {
          firstName: "Karl",
          lastName: "Makeig",
          affiliations: [
            "University of California San Diego. kmakeig@ucsd.edu",
          ],
        },
      ]),
    ];
    expect(pickEmail(results, "Scott Makeig", INST)).toBeNull();
  });

  it("ignores the right name at a different institution", () => {
    const results = [
      paper("2025", [
        {
          firstName: "Scott",
          lastName: "Makeig",
          affiliations: ["University of Toronto. s.makeig@utoronto.ca"],
        },
      ]),
    ];
    expect(pickEmail(results, "Scott Makeig", INST)).toBeNull();
  });

  it("prefers the email seen most often when several are listed", () => {
    const aff = (e: string) => [`University of California San Diego. ${e}`];
    const results = [
      paper(
        "2025",
        [
          {
            firstName: "S",
            lastName: "Makeig",
            affiliations: aff("scott@gmail.com"),
          },
        ],
        "a",
      ),
      paper(
        "2024",
        [
          {
            firstName: "S.",
            lastName: "Makeig",
            affiliations: aff("smakeig@ucsd.edu"),
          },
        ],
        "b",
      ),
      paper(
        "2023",
        [
          {
            firstName: "Scott",
            lastName: "Makeig",
            affiliations: aff("smakeig@ucsd.edu"),
          },
        ],
        "c",
      ),
    ];
    expect(pickEmail(results, "Scott Makeig", INST)?.email).toBe(
      "smakeig@ucsd.edu",
    );
  });

  it("skips correction notices", () => {
    const aff = ["University of California San Diego. smakeig@ucsd.edu"];
    const results = [
      { ...paper("2025", [{ firstName: "Scott", lastName: "Makeig", affiliations: aff }], "a"), title: "Correction to: Old paper" },
      paper("2023", [{ firstName: "Scott", lastName: "Makeig", affiliations: aff }], "b"),
    ];
    expect(pickEmail(results, "Scott Makeig", INST)?.source.url).toBe("https://europepmc.org/article/MED/b");
  });

  it("handles missing author data", () => {
    expect(
      pickEmail(
        [{ id: "x", source: "MED", title: "t", pubYear: "2025" }],
        "Scott Makeig",
        INST,
      ),
    ).toBeNull();
    expect(pickEmail([], "Scott Makeig", INST)).toBeNull();
  });
});
