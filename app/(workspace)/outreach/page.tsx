import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { connection } from "next/server";

import { OpportunitySheet } from "@/components/outreach/opportunity-sheet";
import { OutreachTable } from "@/components/outreach/outreach-table";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { addWorkdaysIso, followUpState, todayIso } from "@/lib/outreach";

export const metadata: Metadata = { title: "Outreach" };

export default async function OutreachPage() {
  await connection();
  const rows = await db.select().from(opportunities).orderBy(desc(opportunities.updatedAt));
  const today = todayIso();
  const dueCount = rows.filter((row) => !new Set(["won", "lost", "ghosted"]).has(row.status) && ["overdue", "today"].includes(followUpState(row.followUpDate, today))).length;

  return <div>
    <header className="flex h-14 items-center justify-between border-b px-5 lg:px-7">
      <div><h1 className="text-sm font-semibold tracking-tight">Outreach</h1><p className="text-xs text-muted-foreground">{rows.length} opportunities · {dueCount} follow-ups due</p></div>
      <OpportunitySheet defaultFollowUpDate={addWorkdaysIso(new Date(), 5)} />
    </header>
    <div className="p-4 lg:p-6"><OutreachTable rows={rows} today={today} /></div>
  </div>;
}
