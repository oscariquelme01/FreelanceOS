import { BillingSheet } from "@/components/invoices/billing-sheet";
import type { billingProfiles } from "@/db/schema";

type Profile = typeof billingProfiles.$inferSelect;

export function BillingSection({ profile }: { profile?: Profile }) {
  return (
    <section id="billing" className="scroll-mt-4 rounded-md border bg-surface">
      <div className="flex items-center justify-between border-b bg-surface-raised px-3 py-2">
        <div><h2 className="text-xs font-semibold">Billing details</h2><p className="text-xs text-muted-foreground">Invoice issuer snapshot</p></div>
        <BillingSheet profile={profile} />
      </div>
      {profile ? <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 p-3 text-xs"><dt className="text-muted-foreground">Issuer</dt><dd className="font-medium text-peach">{profile.legalName}</dd><dt className="text-muted-foreground">NIF</dt><dd>{profile.taxId}</dd><dt className="text-muted-foreground">Address</dt><dd>{[profile.address, profile.postalCode, profile.city, profile.province, profile.country].filter(Boolean).join(", ") || "—"}</dd><dt className="text-muted-foreground">Contact</dt><dd>{[profile.email, profile.phone].filter(Boolean).join(" · ") || "—"}</dd><dt className="text-muted-foreground">IBAN</dt><dd className="truncate font-mono text-xs">{profile.iban || "—"}</dd><dt className="text-muted-foreground">Signature</dt><dd>{profile.signaturePath ? "Attached" : "Not attached"}</dd></dl> : <p className="p-5 text-xs text-muted-foreground">Billing details are not configured.</p>}
    </section>
  );
}
