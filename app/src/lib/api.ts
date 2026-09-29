import { API_URL, APP_KEY } from "./config";
import type { Brief, Draft, Paper, Profile } from "./types";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(APP_KEY ? { "x-labmate-key": APP_KEY } : {}) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

function studentPayload(p: Profile) {
  return {
    name: p.name,
    school: p.school.name,
    year: p.year,
    major: p.major,
    interests: p.interests,
    experience: p.experience,
  };
}

function paperPayload(p: Paper) {
  return { title: p.title, abstract: p.abstract.slice(0, 6000), year: p.year, venue: p.venue };
}

export function fetchBrief(professorName: string, paper: Paper, profile: Profile): Promise<Brief> {
  return post("/api/brief", { professorName, paper: paperPayload(paper), student: studentPayload(profile) });
}

export function fetchDraft(args: {
  professorName: string;
  paper: Paper;
  profile: Profile;
  briefSummary: string;
  studentTakeaway: string;
  grantNote?: string;
}): Promise<Draft> {
  return post("/api/draft", {
    professorName: args.professorName,
    paper: paperPayload(args.paper),
    student: studentPayload(args.profile),
    briefSummary: args.briefSummary,
    studentTakeaway: args.studentTakeaway,
    grantNote: args.grantNote,
  });
}
