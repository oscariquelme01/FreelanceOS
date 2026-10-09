"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { saveBillingProfile } from "@/app/(workspace)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useSheetAction } from "@/components/ui/use-sheet-action";
import type { billingProfiles } from "@/db/schema";

type Profile = typeof billingProfiles.$inferSelect;

export function BillingSheet({ profile }: { profile?: Profile }) {
  const [open, setOpen] = useState(false);
  const { pending, onSubmit } = useSheetAction(saveBillingProfile, () => setOpen(false));
  return <>
    <Button type="button" variant="ghost" size="sm" className="text-peach" onClick={() => setOpen(true)}><Pencil /> Edit</Button>
    <Sheet open={open} onOpenChange={setOpen} title="Billing details" description="These details are snapshotted into new invoices">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field sm:col-span-2">Legal name *<input name="legalName" required defaultValue={profile?.legalName} /></label><label className="field">NIF *<input name="taxId" required defaultValue={profile?.taxId} /></label><label className="field">Email<input name="email" type="email" defaultValue={profile?.email} /></label>
          <label className="field sm:col-span-2">Address<input name="address" defaultValue={profile?.address} /></label><label className="field">Postal code<input name="postalCode" defaultValue={profile?.postalCode} /></label><label className="field">City<input name="city" defaultValue={profile?.city} /></label>
          <label className="field">Province<input name="province" defaultValue={profile?.province} /></label><label className="field">Country<input name="country" defaultValue={profile?.country ?? "España"} /></label><label className="field">Phone<input name="phone" defaultValue={profile?.phone} /></label>
          <label className="field">IBAN<input name="iban" defaultValue={profile?.iban} /></label><label className="field">BIC / SWIFT<input name="bic" defaultValue={profile?.bic} /></label><label className="field">Signature<input name="signature" type="file" accept="image/png,image/jpeg" /></label>
          <label className="field sm:col-span-2">Payment instructions<textarea name="paymentInstructions" rows={3} defaultValue={profile?.paymentInstructions} /></label>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save billing details"}</Button>
      </form>
    </Sheet>
  </>;
}
