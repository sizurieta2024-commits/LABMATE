import { z } from "zod";

// ---- Requests (sent by the app) ----

export const StudentProfile = z.object({
  name: z.string().min(1).max(80),
  school: z.string().min(1).max(160),
  year: z.string().max(40).default(""),
  major: z.string().max(80).default(""),
  interests: z.array(z.string().max(60)).max(8).default([]),
  experience: z.string().max(600).default(""),
});
export type StudentProfile = z.infer<typeof StudentProfile>;

export const Paper = z.object({
  title: z.string().min(1).max(500),
  abstract: z.string().max(6000).default(""),
  year: z.number().int().optional(),
  venue: z.string().max(200).optional(),
});
export type Paper = z.infer<typeof Paper>;

export const BriefRequest = z.object({
  professorName: z.string().min(1).max(120),
  paper: Paper,
  student: StudentProfile,
});
export type BriefRequest = z.infer<typeof BriefRequest>;

export const DraftRequest = z.object({
  professorName: z.string().min(1).max(120),
  paper: Paper,
  student: StudentProfile,
  briefSummary: z.string().max(2000),
  // The student's own words: what caught their interest. Required so every
  // email carries something the student actually thought, not just AI text.
  studentTakeaway: z.string().min(20).max(600),
  grantNote: z.string().max(200).optional(),
});
export type DraftRequest = z.infer<typeof DraftRequest>;

// ---- Model outputs (structured outputs) ----

export const Brief = z.object({
  summary: z
    .string()
    .describe("Plain-English summary of the paper for an undergrad, 80-120 words, no jargon without explanation."),
  whyItMatters: z.string().describe("One or two sentences on why this work matters in the real world."),
  keyTerms: z
    .array(z.object({ term: z.string(), definition: z.string() }))
    .describe("Exactly 3 key terms from the paper with one-sentence plain definitions."),
  smartQuestions: z
    .array(z.string())
    .describe("Exactly 3 thoughtful questions a curious undergrad could ask the professor about this work."),
  quiz: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).describe("Exactly 4 answer options."),
        answerIndex: z.number().int().describe("0-based index of the correct option."),
        explanation: z.string().describe("One sentence explaining the correct answer."),
      }),
    )
    .describe("Exactly 3 multiple-choice questions that check real understanding of the paper, answerable from the summary."),
});
export type Brief = z.infer<typeof Brief>;

export const Draft = z.object({
  subject: z.string().describe("Specific email subject line, under 80 characters."),
  body: z.string().describe("Email body, 120-180 words, plain text, no placeholders except the signature name."),
});
export type Draft = z.infer<typeof Draft>;
