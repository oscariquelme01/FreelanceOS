"use client";

import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

import { updateOpportunityStatus } from "@/app/(workspace)/outreach/actions";
import { DeleteOpportunityButton } from "@/components/outreach/delete-opportunity-button";
import { OpportunitySheet } from "@/components/outreach/opportunity-sheet";
import { OutreachStatusSelect } from "@/components/outreach/outreach-status-select";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { opportunities } from "@/db/schema";
import { followUpState, outreachStatusLabels, outreachStatuses, type FollowUpFilter, type OutreachStatus } from "@/lib/outreach";
import { cn } from "@/lib/utils";

type Opportunity = typeof opportunities.$inferSelect;
const pageSize = 10;
const followUpFilters: FollowUpFilter[] = ["all", "overdue", "today", "upcoming", "none"];
const followUpLabels: Record<FollowUpFilter, string> = { all: "All follow-ups", overdue: "Overdue", today: "Due today", upcoming: "Upcoming", none: "No follow-up" };
const followUpRank = { overdue: 0, today: 1, upcoming: 2, none: 3 } as const;

export function OutreachTable({ rows, today }: { rows: Opportunity[]; today: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OutreachStatus | "">("");
  const [followUp, setFollowUp] = useState<FollowUpFilter>("all");
  const [page, setPage] = useState(1);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !query || [row.company, row.role, row.contactName, row.contactEmail, row.source].some((value) => value.toLocaleLowerCase().includes(query));
      const matchesStatus = !status || row.status === status;
      const state = followUpState(row.followUpDate, today);
      return matchesSearch && matchesStatus && (followUp === "all" || state === followUp);
    }).toSorted((left, right) => {
      const leftState = followUpState(left.followUpDate, today);
      const rightState = followUpState(right.followUpDate, today);
      const urgency = followUpRank[leftState] - followUpRank[rightState];
      if (urgency) return urgency;
      if (left.followUpDate && right.followUpDate && left.followUpDate !== right.followUpDate) return left.followUpDate.localeCompare(right.followUpDate);
      return right.updatedAt.getTime() - left.updatedAt.getTime();
    });
  }, [followUp, rows, search, status, today]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Boolean(search || status || followUp !== "all");

  function clearFilters() {
    setSearch("");
    setStatus("");
    setFollowUp("all");
    setPage(1);
  }

  return <section className="overflow-hidden rounded-md border border-t-2 border-t-peach/70 bg-surface">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface-raised px-3 py-2">
      <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-peach" /><h2 className="text-xs font-semibold">Outreach register</h2></div>
      <div className="flex flex-1 flex-wrap justify-end gap-2">
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search outreach…" className="w-52" aria-label="Search outreach" />
        <div className="w-36"><Select value={status} onValueChange={(value) => { setStatus(value as OutreachStatus | ""); setPage(1); }} aria-label="Filter by status" options={[{ value: "", label: "All statuses" }, ...outreachStatuses.map((option) => ({ value: option, label: outreachStatusLabels[option] }))]} /></div>
        <div className="w-36"><Select value={followUp} onValueChange={(value) => { setFollowUp(value as FollowUpFilter); setPage(1); }} aria-label="Filter by follow-up" options={followUpFilters.map((option) => ({ value: option, label: followUpLabels[option] }))} /></div>
        {hasFilters && <Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button>}
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[1080px] table-fixed text-left text-xs">
      <thead className="border-b bg-surface-raised uppercase tracking-wide text-muted-foreground"><tr><th className="w-[16%] px-3 py-2">Company</th><th className="w-[20%] px-3 py-2">Role / project</th><th className="w-[13%] px-3 py-2">Status</th><th className="w-[15%] px-3 py-2">Contact</th><th className="w-[11%] px-3 py-2">Source</th><th className="w-[10%] px-3 py-2">Contacted</th><th className="w-[10%] px-3 py-2">Follow-up</th><th className="w-[124px] px-3 py-2" /></tr></thead>
      <tbody className="divide-y">
        {pageRows.map((opportunity) => {
          const followUpTone = followUpState(opportunity.followUpDate, today);
          return <tr key={opportunity.id} className="h-12 hover:bg-muted/40">
            <td className="truncate px-3 font-medium text-peach">{opportunity.company}</td>
            <td className="truncate px-3">{opportunity.role}</td>
            <td className="px-3"><OutreachStatusSelect company={opportunity.company} status={opportunity.status} action={updateOpportunityStatus.bind(null, opportunity.id)} /></td>
            <td className="px-3"><p className="truncate">{opportunity.contactName || "—"}</p>{opportunity.contactEmail && <p className="truncate text-muted-foreground">{opportunity.contactEmail}</p>}</td>
            <td className="truncate px-3 text-muted-foreground">{opportunity.source || "—"}</td>
            <td className="px-3 text-muted-foreground">{opportunity.contactedDate || "—"}</td>
            <td className={cn("px-3", followUpTone === "overdue" && "font-medium text-destructive", followUpTone === "today" && "font-medium text-warning", ["upcoming", "none"].includes(followUpTone) && "text-muted-foreground")}>{opportunity.followUpDate || "—"}</td>
            <td className="px-3"><div className="flex justify-end"><OpportunitySheet opportunity={opportunity} />{opportunity.url && <Button asChild size="icon" variant="ghost"><a href={opportunity.url} target="_blank" rel="noreferrer" aria-label={`Open link for ${opportunity.company}`}><ExternalLink /></a></Button>}<DeleteOpportunityButton id={opportunity.id} company={opportunity.company} role={opportunity.role} /></div></td>
          </tr>;
        })}
        {!pageRows.length && <tr className="h-12"><td colSpan={8} className="px-3 text-center text-muted-foreground">No opportunities match these filters.</td></tr>}
        {Array.from({ length: pageSize - Math.max(1, pageRows.length) }).map((_, index) => <tr key={`empty-${index}`} className="h-12" aria-hidden="true"><td colSpan={8} /></tr>)}
      </tbody>
    </table></div>
    <div className="flex h-10 items-center justify-between border-t px-3 text-xs text-muted-foreground"><span>{filteredRows.length} results · Page {currentPage} of {pageCount}</span><div className="flex gap-1"><Button type="button" size="sm" variant="ghost" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button><Button type="button" size="sm" variant="ghost" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</Button></div></div>
  </section>;
}
