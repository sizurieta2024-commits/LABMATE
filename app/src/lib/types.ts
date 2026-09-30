export type Institution = {
  id: string; // short OpenAlex id, e.g. "I97018004"
  name: string;
  city?: string;
  country?: string;
};

export type Profile = {
  userId: string;
  name: string;
  school: Institution;
  year: string;
  major: string;
  interests: string[];
  experience: string;
};

export type PaperRef = {
  id: string; // short OpenAlex work id, e.g. "W2741809807"
  title: string;
  year?: number;
};

export type Researcher = {
  id: string; // short OpenAlex author id, e.g. "A5023888391"
  name: string;
  score: number;
  matchedPapers: number;
  lastAuthorPapers: number;
  matchedInterests: string[];
  latestPaper: PaperRef;
};

export type Grant = {
  source: "NIH" | "NSF";
  title: string;
  amount: number | null;
  date: string; // ISO date the award was issued
  daysAgo: number;
  url: string;
};

export type Paper = PaperRef & {
  abstract: string;
  venue?: string;
  citedBy: number;
  doi?: string;
};

export type AuthorDetails = {
  id: string;
  name: string;
  worksCount: number;
  citedBy: number;
  hIndex?: number;
  topics: string[];
  institution?: string;
};

export type Brief = {
  summary: string;
  whyItMatters: string;
  keyTerms: { term: string; definition: string }[];
  smartQuestions: string[];
  quiz: { question: string; options: string[]; answerIndex: number; explanation: string }[];
};

export type Draft = { subject: string; body: string };

/** A professor's email as listed in their own published paper. */
export type EmailLookup = { email: string; source: { title: string; year: number | null; url: string } } | { email: null };

export type OutreachStatus = "drafted" | "sent" | "replied" | "interview" | "joined";

export type Outreach = {
  id: string;
  researcherId: string;
  researcherName: string;
  paperTitle: string;
  subject: string;
  body: string;
  status: OutreachStatus;
  createdAt: string;
  sentAt?: string;
  followUpAt?: string;
  to?: string; // the professor's address, when known
};
