import type { opportunities } from "@/db/schema";
import { outreachSourceSuggestions, outreachStatusLabels, outreachStatuses } from "@/lib/outreach";
import { Select } from "@/components/ui/select";

type Opportunity = typeof opportunities.$inferSelect;

export function OpportunityFields({ opportunity, defaultFollowUpDate = "" }: { opportunity?: Opportunity; defaultFollowUpDate?: string }) {
  return <div className="space-y-5">
    <fieldset className="space-y-3"><legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target</legend><div className="grid gap-3 sm:grid-cols-2">
      <label className="field">Company *<input name="company" required defaultValue={opportunity?.company} /></label>
      <label className="field">Role / project *<input name="role" required defaultValue={opportunity?.role} /></label>
      <label className="field">Source<input name="source" list="outreach-source-suggestions" defaultValue={opportunity?.source} placeholder="LinkedIn, direct research…" /></label>
      <datalist id="outreach-source-suggestions">{outreachSourceSuggestions.map((source) => <option key={source} value={source} />)}</datalist>
      <label className="field">Relevant URL<input name="url" type="url" defaultValue={opportunity?.url} placeholder="https://…" /></label>
    </div></fieldset>
    <fieldset className="space-y-3"><legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</legend><div className="grid gap-3 sm:grid-cols-2">
      <label className="field">Contact name<input name="contactName" defaultValue={opportunity?.contactName} /></label>
      <label className="field">Email<input name="contactEmail" type="email" defaultValue={opportunity?.contactEmail} /></label>
    </div></fieldset>
    <fieldset className="space-y-3"><legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workflow</legend><div className="grid gap-3 sm:grid-cols-3">
      <label className="field">Status<Select name="status" defaultValue={opportunity?.status ?? "lead"} options={outreachStatuses.map((status) => ({ value: status, label: outreachStatusLabels[status] }))} /></label>
      <label className="field">Last contacted<input name="contactedDate" type="date" defaultValue={opportunity?.contactedDate ?? ""} /></label>
      <label className="field">Follow-up<input name="followUpDate" type="date" defaultValue={opportunity ? opportunity.followUpDate ?? "" : defaultFollowUpDate} /></label>
    </div></fieldset>
    <label className="field">Notes<textarea name="notes" rows={6} defaultValue={opportunity?.notes} placeholder="Context, response, next step…" /></label>
  </div>;
}
