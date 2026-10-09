"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { createOpportunity, updateOpportunity } from "@/app/(workspace)/outreach/actions";
import { OpportunityFields } from "@/components/outreach/opportunity-fields";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useSheetAction } from "@/components/ui/use-sheet-action";
import type { opportunities } from "@/db/schema";

type Opportunity = typeof opportunities.$inferSelect;

export function OpportunitySheet({ opportunity, defaultFollowUpDate }: { opportunity?: Opportunity; defaultFollowUpDate?: string }) {
  const [open, setOpen] = useState(false);
  const action = opportunity ? updateOpportunity.bind(null, opportunity.id) : createOpportunity;
  const { pending, onSubmit } = useSheetAction(action, () => setOpen(false));
  return <>
    {opportunity ? <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${opportunity.company}`} onClick={() => setOpen(true)}><Pencil /></Button> : <Button type="button" size="sm" className="bg-peach text-background hover:bg-peach/90" onClick={() => setOpen(true)}><Plus /> Add opportunity</Button>}
    <Sheet open={open} onOpenChange={setOpen} title={opportunity ? `Edit ${opportunity.company}` : "New opportunity"} description="Track the target, contact, and next follow-up">
      <form onSubmit={onSubmit} className="space-y-5"><OpportunityFields opportunity={opportunity} defaultFollowUpDate={defaultFollowUpDate} /><Button type="submit" disabled={pending}>{pending ? "Saving…" : opportunity ? "Save changes" : "Create opportunity"}</Button></form>
    </Sheet>
  </>;
}
