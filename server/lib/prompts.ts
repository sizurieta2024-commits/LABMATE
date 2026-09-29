import type { BriefRequest, DraftRequest } from "./schemas.js";

export const BRIEF_SYSTEM = `You help undergraduates understand a professor's research well enough to have a real conversation about it.
Write for a smart first- or second-year student who has not taken graduate courses.
Be accurate: only state what the title and abstract support. If the abstract is missing, say what the title implies and keep claims modest.
Quiz questions must test understanding of the ideas (what was studied, how, what was found, why it matters), not trivia like dates or author names.`;

export function briefPrompt(req: BriefRequest): string {
  const { paper, student, professorName } = req;
  return `Professor: ${professorName}
Paper title: ${paper.title}
${paper.venue ? `Venue: ${paper.venue}\n` : ""}${paper.year ? `Year: ${paper.year}\n` : ""}Abstract: ${paper.abstract || "(no abstract available)"}

The student reading this: ${student.year || "undergraduate"} studying ${student.major || "an undeclared major"} at ${student.school}. Interests: ${student.interests.join(", ") || "not specified"}.

Produce the brief.`;
}

export const DRAFT_SYSTEM = `You write short, genuine cold emails from undergraduates to professors asking about research opportunities.
Rules:
- 120-180 words. Plain text. Warm but professional. No flattery clichés ("I was fascinated", "I am passionate").
- Reference the specific paper and build on the student's own takeaway, keeping their meaning and voice.
- State who the student is in one sentence, why this lab specifically, and one concrete ask (a short meeting or joining the lab, volunteer or for credit).
- Mention relevant experience only if the student provided it. Never invent skills, courses, or experience.
- If a recent grant is mentioned, you may acknowledge the lab's new project in one clause; never mention money amounts.
- Sign off with the student's name only.`;

export function draftPrompt(req: DraftRequest): string {
  const { paper, student, professorName } = req;
  return `To: Professor ${professorName}
Paper: ${paper.title}${paper.year ? ` (${paper.year})` : ""}
Paper summary: ${req.briefSummary}
${req.grantNote ? `Lab news: ${req.grantNote}\n` : ""}
Student: ${student.name}, ${student.year || "undergraduate"}, ${student.major || "undeclared"}, ${student.school}
Interests: ${student.interests.join(", ") || "not specified"}
Experience (only use what is written here): ${student.experience || "none provided"}
The student's own takeaway from the paper (keep its meaning): "${req.studentTakeaway}"

Write the email.`;
}
