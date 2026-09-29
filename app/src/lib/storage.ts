import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Brief, Outreach, Profile } from "./types";

const K = {
  profile: "labmate.profile",
  outreach: "labmate.outreach",
  briefsUsed: "labmate.briefsUsed",
  brief: (workId: string) => `labmate.brief.${workId}`,
};

async function read<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
const write = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value));

export const loadProfile = () => read<Profile | null>(K.profile, null);
export const saveProfile = (p: Profile) => write(K.profile, p);

export const loadOutreach = () => read<Outreach[]>(K.outreach, []);
export const saveOutreach = (list: Outreach[]) => write(K.outreach, list);

export async function upsertOutreach(item: Outreach): Promise<Outreach[]> {
  const list = await loadOutreach();
  const next = [item, ...list.filter((o) => o.id !== item.id)];
  await saveOutreach(next);
  return next;
}

export const loadBriefsUsed = () => read<number>(K.briefsUsed, 0);
export async function incrementBriefsUsed(): Promise<number> {
  const n = (await loadBriefsUsed()) + 1;
  await write(K.briefsUsed, n);
  return n;
}

export const loadCachedBrief = (workId: string) => read<Brief | null>(K.brief(workId), null);
export const cacheBrief = (workId: string, brief: Brief) => write(K.brief(workId), brief);

export function newId(prefix = "lm"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
