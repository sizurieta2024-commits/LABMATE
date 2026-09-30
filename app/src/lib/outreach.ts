import { FOLLOW_UP_DAYS, WEEKLY_SEND_CAP } from "./config";
import type { Outreach, OutreachStatus } from "./types";

const DAY_MS = 86_400_000;

export function sentThisWeek(list: Outreach[], now: Date = new Date()): number {
  const cutoff = now.getTime() - 7 * DAY_MS;
  return list.filter((o) => o.sentAt && new Date(o.sentAt).getTime() >= cutoff).length;
}

export function canSend(list: Outreach[], now: Date = new Date()): boolean {
  return sentThisWeek(list, now) < WEEKLY_SEND_CAP;
}

export function markSent(o: Outreach, now: Date = new Date()): Outreach {
  return {
    ...o,
    status: "sent",
    sentAt: now.toISOString(),
    followUpAt: new Date(now.getTime() + FOLLOW_UP_DAYS * DAY_MS).toISOString(),
  };
}

export function followUpDue(o: Outreach, now: Date = new Date()): boolean {
  return o.status === "sent" && !!o.followUpAt && new Date(o.followUpAt).getTime() <= now.getTime();
}

export const STATUS_ORDER: OutreachStatus[] = ["drafted", "sent", "replied", "interview", "joined"];

export const STATUS_LABEL: Record<OutreachStatus, string> = {
  drafted: "Drafted",
  sent: "Sent",
  replied: "Replied",
  interview: "Interview",
  joined: "Joined",
};

export function nextStatus(s: OutreachStatus): OutreachStatus {
  const i = STATUS_ORDER.indexOf(s);
  return STATUS_ORDER[Math.min(i + 1, STATUS_ORDER.length - 1)];
}

export function mailtoUrl(subject: string, body: string, to = ""): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
