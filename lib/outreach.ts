export const outreachStatuses = ["lead", "contacted", "replied", "interviewing", "proposal", "won", "lost", "ghosted"] as const;

export type OutreachStatus = (typeof outreachStatuses)[number];
export type FollowUpFilter = "all" | "overdue" | "today" | "upcoming" | "none";
export type FollowUpState = Exclude<FollowUpFilter, "all">;

export const outreachStatusLabels: Record<OutreachStatus, string> = {
  lead: "Lead",
  contacted: "Contacted",
  replied: "Replied",
  interviewing: "Interviewing",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
  ghosted: "Ghosted",
};

export const outreachSourceSuggestions = ["LinkedIn", "Wellfound", "Company website", "Direct research", "Cold email", "Job board", "Referral", "Community", "Other"];

export function todayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function addWorkdaysIso(start: Date, workdays: number) {
  const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  let added = 0;
  while (added < workdays) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return todayIso(date);
}

export function followUpState(value: string | null, today = todayIso()): FollowUpState {
  if (!value) return "none";
  if (value < today) return "overdue";
  if (value === today) return "today";
  return "upcoming";
}

export function contactedDateAfterStatusChange(previous: OutreachStatus, next: OutreachStatus, current: string | null, today = todayIso()) {
  if (current) return current;
  return previous === "lead" && next === "contacted" ? today : null;
}
