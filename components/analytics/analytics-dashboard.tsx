import { ArrowDownRight, ArrowUpRight, Clock3 } from "lucide-react";

import type { invoiceAnalytics, outreachAnalytics } from "@/lib/analytics";
import { formatMoney } from "@/lib/invoices/calculations";
import { cn } from "@/lib/utils";

type OutreachData = ReturnType<typeof outreachAnalytics>;
type InvoiceData = ReturnType<typeof invoiceAnalytics>;

function percentage(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function Kpi({ label, value, detail, tone = "default" }: { label: string; value: string | number; detail?: string; tone?: "default" | "peach" | "success" }) {
  return <div className="min-w-0 border-r px-4 py-3 last:border-r-0">
    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={cn("mt-1 font-mono text-lg font-semibold", tone === "peach" && "text-peach", tone === "success" && "text-success")}>{value}</p>
    {detail && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{detail}</p>}
  </div>;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-xs font-semibold uppercase tracking-wider text-peach">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>;
}

function ActivityChart({ rows }: { rows: OutreachData["monthly"] }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.targets, row.contacted, row.replied, row.wins]));
  const series = [{ key: "targets", label: "Added", color: "bg-muted-foreground/55" }, { key: "contacted", label: "Contacted", color: "bg-peach" }, { key: "replied", label: "Replied", color: "bg-primary" }, { key: "wins", label: "Won", color: "bg-success" }] as const;
  return <section className="rounded-md border bg-surface">
    <div className="flex items-center justify-between border-b px-3 py-2"><h3 className="text-xs font-semibold">Outreach activity</h3><div className="flex gap-3">{series.map((item) => <span key={item.key} className="flex items-center gap-1 text-[10px] text-muted-foreground"><i className={cn("size-1.5 rounded-full", item.color)} />{item.label}</span>)}</div></div>
    <div className="flex h-56 items-end gap-2 px-4 pb-3 pt-5">
      {rows.map((row) => <div key={row.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
        <div className="flex min-h-0 flex-1 items-end justify-center gap-0.5">{series.map((item) => <div key={item.key} title={`${item.label}: ${row[item.key]}`} className={cn("w-full max-w-3 rounded-t-[2px]", item.color)} style={{ height: `${Math.max(row[item.key] ? 3 : 0, row[item.key] / max * 100)}%` }} />)}</div>
        <span className="text-center text-[10px] text-muted-foreground">{row.label}</span>
      </div>)}
    </div>
  </section>;
}

function Funnel({ rows }: { rows: OutreachData["funnel"] }) {
  const labels = { contacted: "Contacted", replied: "Responded", interviewing: "Interviewed", proposal: "Proposal", won: "Won" };
  return <section className="rounded-md border bg-surface">
    <div className="border-b px-3 py-2"><h3 className="text-xs font-semibold">Contacted-cohort funnel</h3></div>
    <div className="divide-y">{rows.map((row) => <div key={row.stage} className="grid grid-cols-[88px_1fr_44px_58px] items-center gap-3 px-3 py-2.5 text-xs">
      <span>{labels[row.stage]}</span><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(row.ofContacted ?? 0) * 100}%` }} /></div><span className="text-right font-mono">{row.count}</span><span className="text-right font-mono text-muted-foreground">{percentage(row.fromPrevious)}</span>
    </div>)}</div>
  </section>;
}

function Workload({ data }: { data: OutreachData["followUps"] }) {
  const rows = [{ label: "Overdue", value: data.overdue, tone: "text-destructive" }, { label: "Due today", value: data.today, tone: "text-warning" }, { label: "Next 7 days", value: data.upcoming, tone: "text-foreground" }, { label: "Leads without date", value: data.missing, tone: "text-muted-foreground" }];
  return <section className="rounded-md border bg-surface"><div className="flex items-center gap-2 border-b px-3 py-2"><Clock3 className="size-3.5 text-peach" /><h3 className="text-xs font-semibold">Current follow-ups</h3></div><div className="divide-y">{rows.map((row) => <div key={row.label} className="flex h-9 items-center justify-between px-3 text-xs"><span className="text-muted-foreground">{row.label}</span><span className={cn("font-mono font-medium", row.tone)}>{row.value}</span></div>)}</div></section>;
}

function Outcomes({ data, total }: { data: OutreachData["outcomes"]; total: number }) {
  const rows = [{ label: "Active", value: data.active, color: "bg-peach" }, { label: "Won", value: data.won, color: "bg-success" }, { label: "Lost", value: data.lost, color: "bg-destructive" }, { label: "Ghosted", value: data.ghosted, color: "bg-muted-foreground" }];
  return <section className="rounded-md border bg-surface"><div className="border-b px-3 py-2"><h3 className="text-xs font-semibold">Cohort outcomes</h3></div><div className="space-y-3 p-3">{rows.map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-[11px]"><span className="text-muted-foreground">{row.label}</span><span className="font-mono">{row.value}</span></div><div className="h-1.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", row.color)} style={{ width: `${total ? row.value / total * 100 : 0}%` }} /></div></div>)}</div></section>;
}

function Sources({ rows }: { rows: OutreachData["sources"] }) {
  return <section className="overflow-hidden rounded-md border bg-surface"><div className="border-b px-3 py-2"><h3 className="text-xs font-semibold">Source performance</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-surface-raised uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Source</th><th className="px-3 py-2 text-right">Contacted</th><th className="px-3 py-2 text-right">Replies</th><th className="px-3 py-2 text-right">Reply rate</th><th className="px-3 py-2 text-right">Proposals</th><th className="px-3 py-2 text-right">Wins</th></tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={row.source}><td className="px-3 py-2.5 font-medium">{row.source}</td><td className="px-3 text-right font-mono">{row.contacted}</td><td className="px-3 text-right font-mono">{row.replies}</td><td className="px-3 text-right font-mono text-primary">{percentage(row.contacted ? row.replies / row.contacted : null)}</td><td className="px-3 text-right font-mono">{row.proposals}</td><td className="px-3 text-right font-mono text-success">{row.wins}</td></tr>)}{!rows.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No contacted opportunities in this period.</td></tr>}</tbody></table></div></section>;
}

function FinanceChart({ rows }: { rows: InvoiceData["monthly"] }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.invoiced, row.paid, row.expenses]));
  const series = [{ key: "invoiced", label: "Invoiced", color: "bg-peach" }, { key: "paid", label: "Paid", color: "bg-success" }, { key: "expenses", label: "Expenses", color: "bg-destructive" }] as const;
  return <section className="rounded-md border bg-surface"><div className="flex items-center justify-between border-b px-3 py-2"><h3 className="text-xs font-semibold">Monthly financial activity</h3><div className="flex gap-3">{series.map((item) => <span key={item.key} className="flex items-center gap-1 text-[10px] text-muted-foreground"><i className={cn("size-1.5 rounded-full", item.color)} />{item.label}</span>)}</div></div><div className="flex h-44 items-end gap-2 px-4 pb-3 pt-5">{rows.map((row) => <div key={row.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"><div className="flex min-h-0 flex-1 items-end justify-center gap-0.5">{series.map((item) => <div key={item.key} title={`${item.label}: ${formatMoney(row[item.key], "EUR")}`} className={cn("w-full max-w-3 rounded-t-[2px]", item.color)} style={{ height: `${Math.max(row[item.key] ? 3 : 0, row[item.key] / max * 100)}%` }} />)}</div><span className="text-center text-[10px] text-muted-foreground">{row.label}</span></div>)}</div></section>;
}

export function AnalyticsDashboard({ outreach, invoices, exchangeRate }: { outreach: OutreachData; invoices: InvoiceData; exchangeRate: { rate: number; date: string | null; fallback: boolean } }) {
  const replied = outreach.funnel.find((row) => row.stage === "replied")!;
  const won = outreach.funnel.find((row) => row.stage === "won")!;
  return <div className="space-y-7">
    <section className="space-y-3"><SectionHeading title="Outreach" description="Activity in the selected period and eventual conversion of contacts started there." />
      <div className="grid overflow-hidden rounded-md border border-t-2 border-t-peach/70 bg-surface sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"><Kpi label="Targets added" value={outreach.activity.targets} /><Kpi label="Contacted" value={outreach.activity.contacted} tone="peach" /><Kpi label="Replies" value={outreach.activity.replied} /><Kpi label="Reply rate" value={percentage(replied.ofContacted)} tone="success" /><Kpi label="Proposals" value={outreach.activity.proposals} /><Kpi label="Wins" value={outreach.activity.wins} /><Kpi label="Overall win rate" value={percentage(won.ofContacted)} tone="success" /></div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]"><ActivityChart rows={outreach.monthly} /><Workload data={outreach.followUps} /></div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]"><Funnel rows={outreach.funnel} /><Outcomes data={outreach.outcomes} total={outreach.cohortSize} /></div>
      <Sources rows={outreach.sources} />
    </section>
    <section className="space-y-3"><SectionHeading title="Invoices" description="A lightweight EUR view; USD invoices are converted at the current reference rate." />
      <div className="grid overflow-hidden rounded-md border bg-surface sm:grid-cols-2 lg:grid-cols-5"><Kpi label="Total invoiced" value={formatMoney(invoices.invoiced, "EUR")} /><Kpi label="Paid" value={formatMoney(invoices.paid, "EUR")} tone="success" /><Kpi label="Outstanding" value={formatMoney(invoices.outstanding, "EUR")} tone="peach" /><Kpi label="Expenses" value={formatMoney(invoices.expenses, "EUR")} /><Kpi label="Simple cash margin" value={formatMoney(invoices.margin, "EUR")} tone={invoices.margin >= 0 ? "success" : "default"} /></div>
      <FinanceChart rows={invoices.monthly} />
      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">{exchangeRate.fallback ? <ArrowDownRight className="size-3 text-warning" /> : <ArrowUpRight className="size-3 text-primary" />} USD converted at $1 = €{exchangeRate.rate.toFixed(4)}{exchangeRate.date ? ` · reference date ${exchangeRate.date}` : " · approximate fallback rate"}. Rejected invoices are excluded.</p>
    </section>
  </div>;
}
