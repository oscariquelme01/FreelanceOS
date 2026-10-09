import type { clients } from "@/db/schema";
import { Select } from "@/components/ui/select";

type Client = typeof clients.$inferSelect;

export function ClientFields({ client }: { client?: Client }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <label className="field">Name *<input name="name" required defaultValue={client?.name} /></label>
    <label className="field">Tax ID<input name="taxId" defaultValue={client?.taxId} /></label>
    <label className="field">Email<input name="email" type="email" defaultValue={client?.email} /></label>
    <label className="field sm:col-span-2">Address<input name="address" defaultValue={client?.address} /></label>
    <label className="field">Postal code<input name="postalCode" defaultValue={client?.postalCode} /></label>
    <label className="field">City<input name="city" defaultValue={client?.city} /></label>
    <label className="field">Province<input name="province" defaultValue={client?.province} /></label>
    <label className="field">Country<input name="country" defaultValue={client?.country} /></label>
    <label className="field sm:col-span-2">Default item description<input name="defaultDescription" defaultValue={client?.defaultDescription} /></label>
    <label className="field">Currency<Select name="currency" defaultValue={client?.currency ?? "EUR"} options={[{ value: "EUR", label: "EUR" }, { value: "USD", label: "USD" }]} /></label>
    <label className="field">PDF language<Select name="language" defaultValue={client?.language ?? "es"} options={[{ value: "es", label: "Español" }, { value: "en", label: "English" }]} /></label>
    <label className="field">IVA rate (%)<input name="vatRate" type="number" min="0" max="100" step="0.01" defaultValue={(client?.vatRate ?? 2100) / 100} /></label>
    <label className="flex items-end gap-2 pb-2 text-xs"><input name="vatEnabled" type="checkbox" defaultChecked={client?.vatEnabled ?? true} /> Apply IVA by default</label>
    <label className="field">IRPF rate (%)<input name="withholdingRate" type="number" min="0" max="100" step="0.01" defaultValue={(client?.withholdingRate ?? 1500) / 100} /></label>
    <label className="flex items-end gap-2 pb-2 text-xs"><input name="withholdingEnabled" type="checkbox" defaultChecked={client?.withholdingEnabled ?? true} /> Apply IRPF by default</label>
    <label className="flex items-end gap-2 pb-2 text-xs"><input name="active" type="checkbox" defaultChecked={client?.active ?? true} /> Active client</label>
  </div>;
}
