import type { expenses, invoices, opportunities, opportunityStatusEvents } from "@/db/schema";
import type { OutreachStatus } from "@/lib/outreach";

export type AnalyticsPeriod = "year" | "q1" | "q2" | "q3" | "q4";

export function periodBounds(year: number, period: AnalyticsPeriod) {
  const quarter = period === "year" ? null : Number(period.slice(1)) - 1;
  const startMonth = quarter === null ? 0 : quarter * 3;
  const endMonth = quarter === null ? 12 : startMonth + 3;
  return {
    start: `${year}-${String(startMonth + 1).padStart(2, "0")}-01`,
    end: endMonth === 12 ? `${year + 1}-01-01` : `${year}-${String(endMonth + 1).padStart(2, "0")}-01`,
    months: Array.from({ length: endMonth - startMonth }, (_, index) => startMonth + index),
  };
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function inPeriod(value: string | Date | null, start: string, end: string) {
  if (!value) return false;
  const key = typeof value === "string" ? value.slice(0, 10) : dateKey(value);
  return key >= start && key < end;
}

const stages = ["contacted", "replied", "interviewing", "proposal", "won"] as const;
type Stage = (typeof stages)[number];
const stageRank: Partial<Record<OutreachStatus, number>> = { contacted: 0, replied: 1, interviewing: 2, proposal: 3, won: 4 };

function addImpliedMilestones(status: OutreachStatus, at: string, milestones: Partial<Record<Stage, string>>) {
  const rank = stageRank[status];
  if (rank === undefined) return;
  for (let index = 0; index <= rank; index += 1) {
    const stage = stages[index];
    if (!milestones[stage] || at < milestones[stage]!) milestones[stage] = at;
  }
}

export function outreachAnalytics(
  rows: (typeof opportunities.$inferSelect)[],
  events: (typeof opportunityStatusEvents.$inferSelect)[],
  year: number,
  period: AnalyticsPeriod,
  today: string,
) {
  const bounds = periodBounds(year, period);
  const eventsByOpportunity = new Map<string, typeof events>();
  for (const event of events) {
    const existing = eventsByOpportunity.get(event.opportunityId) ?? [];
    existing.push(event);
    eventsByOpportunity.set(event.opportunityId, existing);
  }
  const enriched = rows.map((row) => {
    const milestones: Partial<Record<Stage, string>> = {};
    if (row.contactedDate) milestones.contacted = row.contactedDate;
    for (const event of (eventsByOpportunity.get(row.id) ?? []).toSorted((a, b) => a.changedAt.getTime() - b.changedAt.getTime())) {
      addImpliedMilestones(event.toStatus, dateKey(event.changedAt), milestones);
    }
    addImpliedMilestones(row.status, dateKey(row.updatedAt), milestones);
    return { row, milestones };
  });
  const cohort = enriched.filter(({ milestones }) => inPeriod(milestones.contacted ?? null, bounds.start, bounds.end));
  const reached = (stage: Stage) => cohort.filter(({ milestones }) => Boolean(milestones[stage])).length;
  const funnel = stages.map((stage, index) => {
    const count = reached(stage);
    const previous = index === 0 ? count : reached(stages[index - 1]);
    return { stage, count, ofContacted: cohort.length ? count / cohort.length : null, fromPrevious: previous ? count / previous : null };
  });
  const activity = {
    targets: enriched.filter(({ row }) => inPeriod(row.createdAt, bounds.start, bounds.end)).length,
    contacted: enriched.filter(({ milestones }) => inPeriod(milestones.contacted ?? null, bounds.start, bounds.end)).length,
    replied: enriched.filter(({ milestones }) => inPeriod(milestones.replied ?? null, bounds.start, bounds.end)).length,
    interviewing: enriched.filter(({ milestones }) => inPeriod(milestones.interviewing ?? null, bounds.start, bounds.end)).length,
    proposals: enriched.filter(({ milestones }) => inPeriod(milestones.proposal ?? null, bounds.start, bounds.end)).length,
    wins: enriched.filter(({ milestones }) => inPeriod(milestones.won ?? null, bounds.start, bounds.end)).length,
  };
  const monthNames = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
  const monthly = bounds.months.map((month) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return {
      label: monthNames.format(new Date(Date.UTC(year, month, 1))),
      targets: enriched.filter(({ row }) => dateKey(row.createdAt).startsWith(prefix)).length,
      contacted: enriched.filter(({ milestones }) => milestones.contacted?.startsWith(prefix)).length,
      replied: enriched.filter(({ milestones }) => milestones.replied?.startsWith(prefix)).length,
      wins: enriched.filter(({ milestones }) => milestones.won?.startsWith(prefix)).length,
    };
  });
  const sourceMap = new Map<string, { source: string; contacted: number; replies: number; proposals: number; wins: number }>();
  for (const item of cohort) {
    const source = item.row.source.trim().replace(/\s+/g, " ") || "Unspecified";
    const key = source.toLocaleLowerCase();
    const value = sourceMap.get(key) ?? { source, contacted: 0, replies: 0, proposals: 0, wins: 0 };
    value.contacted += 1;
    if (item.milestones.replied) value.replies += 1;
    if (item.milestones.proposal) value.proposals += 1;
    if (item.milestones.won) value.wins += 1;
    sourceMap.set(key, value);
  }
  const sources = [...sourceMap.values()].toSorted((a, b) => b.contacted - a.contacted || b.replies - a.replies || a.source.localeCompare(b.source));
  const outcomes = {
    active: cohort.filter(({ row }) => !["won", "lost", "ghosted"].includes(row.status)).length,
    won: cohort.filter(({ row }) => row.status === "won").length,
    lost: cohort.filter(({ row }) => row.status === "lost").length,
    ghosted: cohort.filter(({ row }) => row.status === "ghosted").length,
  };
  const weekEnd = new Date(`${today}T00:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const weekEndKey = dateKey(weekEnd);
  const openRows = rows.filter((row) => !["won", "lost", "ghosted"].includes(row.status));
  const followUps = {
    overdue: openRows.filter((row) => row.followUpDate && row.followUpDate < today).length,
    today: openRows.filter((row) => row.followUpDate === today).length,
    upcoming: openRows.filter((row) => row.followUpDate && row.followUpDate > today && row.followUpDate <= weekEndKey).length,
    missing: openRows.filter((row) => row.status === "lead" && !row.followUpDate).length,
  };
  return { activity, funnel, monthly, sources, outcomes, followUps, cohortSize: cohort.length };
}

export function invoiceAnalytics(
  invoiceRows: (typeof invoices.$inferSelect)[],
  expenseRows: (typeof expenses.$inferSelect)[],
  year: number,
  period: AnalyticsPeriod,
  usdToEur: number,
) {
  const bounds = periodBounds(year, period);
  const selectedInvoices = invoiceRows.filter((row) => inPeriod(row.issueDate, bounds.start, bounds.end));
  const selectedExpenses = expenseRows.filter((row) => inPeriod(row.expenseDate, bounds.start, bounds.end));
  const euros = (cents: number, currency: "EUR" | "USD") => Math.round(cents * (currency === "USD" ? usdToEur : 1));
  const included = selectedInvoices.filter((row) => row.status !== "rejected");
  const invoiced = included.reduce((sum, row) => sum + euros(row.totalCents, row.currency), 0);
  const paid = selectedInvoices.filter((row) => row.status === "paid").reduce((sum, row) => sum + euros(row.totalCents, row.currency), 0);
  const outstanding = selectedInvoices.filter((row) => row.status === "sent").reduce((sum, row) => sum + euros(row.totalCents, row.currency), 0);
  const expensesTotal = selectedExpenses.reduce((sum, row) => sum + row.totalCents, 0);
  const monthly = bounds.months.map((month) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthInvoices = selectedInvoices.filter((row) => row.issueDate.startsWith(prefix));
    return {
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1))),
      invoiced: monthInvoices.filter((row) => row.status !== "rejected").reduce((sum, row) => sum + euros(row.totalCents, row.currency), 0),
      paid: monthInvoices.filter((row) => row.status === "paid").reduce((sum, row) => sum + euros(row.totalCents, row.currency), 0),
      expenses: selectedExpenses.filter((row) => row.expenseDate.startsWith(prefix)).reduce((sum, row) => sum + row.totalCents, 0),
    };
  });
  return { invoiced, paid, outstanding, expenses: expensesTotal, margin: paid - expensesTotal, monthly };
}
