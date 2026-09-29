import { API_URL, APP_KEY } from "./config";
// Note: openalex.ts imports serverFetch from here; keep this module free of openalex imports.
import type { Brief, Draft, Paper, Profile } from "./types";

/** fetch() against the Labmate server, with a helpful message when it's unreachable. */
export async function serverFetch(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(APP_KEY ? { "x-labmate-key": APP_KEY } : {}), ...(init.headers as Record<string, string>) },
    });
  } catch {
    throw new Error(
      `Can't reach the Labmate server at ${API_URL}. Is it running, and is EXPO_PUBLIC_API_URL set to your computer's LAN IP (not localhost)?`,
    );
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await serverFetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
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
