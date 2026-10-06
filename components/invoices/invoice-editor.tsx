"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { calculateInvoice, formatMoney } from "@/lib/invoices/calculations";

export type InvoiceEditorClient = {
  id: string;
  name: string;
  defaultDescription: string;
  currency: "EUR" | "USD";
  language: "es" | "en";
  vatEnabled: boolean;
  vatRate: number;
  withholdingEnabled: boolean;
  withholdingRate: number;
};

type Item = { description: string; quantity: string; unitPrice: string };

export type InvoiceEditorValue = {
  clientId: string;
  issueDate: string;
  currency: "EUR" | "USD";
  language: "es" | "en";
  vatEnabled: boolean;
  vatRate: number;
  withholdingEnabled: boolean;
  withholdingRate: number;
  paymentTerms: string;
  items: Item[];
};

export function InvoiceEditor({
  clients,
  action,
  initial,
  onSaved,
}: {
  clients: InvoiceEditorClient[];
  action: (formData: FormData) => Promise<{ success: boolean; message: string; id: string }>;
  initial?: InvoiceEditorValue;
  onSaved?: () => void;
}) {
  const firstClient = clients[0];
  const [clientId, setClientId] = useState(initial?.clientId ?? firstClient?.id ?? "");
  const selectedClient = clients.find((client) => client.id === clientId) ?? firstClient;
  const [currency, setCurrency] = useState<"EUR" | "USD">(initial?.currency ?? selectedClient?.currency ?? "EUR");
  const [language, setLanguage] = useState<"es" | "en">(initial?.language ?? selectedClient?.language ?? "es");
  const [vatEnabled, setVatEnabled] = useState(initial?.vatEnabled ?? selectedClient?.vatEnabled ?? true);
  const [vatRate, setVatRate] = useState((initial?.vatRate ?? selectedClient?.vatRate ?? 2100) / 100);
  const [withholdingEnabled, setWithholdingEnabled] = useState(initial?.withholdingEnabled ?? selectedClient?.withholdingEnabled ?? true);
  const [withholdingRate, setWithholdingRate] = useState((initial?.withholdingRate ?? selectedClient?.withholdingRate ?? 1500) / 100);
  const [items, setItems] = useState<Item[]>(initial?.items ?? [{ description: selectedClient?.defaultDescription ?? "", quantity: "1", unitPrice: "0.00" }]);
  const [pending, startTransition] = useTransition();
  const totals = useMemo(
    () => calculateInvoice(items, vatEnabled, vatRate * 100, withholdingEnabled, withholdingRate * 100),
    [items, vatEnabled, vatRate, withholdingEnabled, withholdingRate],
  );

  function selectClient(nextId: string) {
    setClientId(nextId);
    const client = clients.find((entry) => entry.id === nextId);
    if (!client || initial) return;
    setCurrency(client.currency);
    setLanguage(client.language);
    setVatEnabled(client.vatEnabled);
    setVatRate(client.vatRate / 100);
    setWithholdingEnabled(client.withholdingEnabled);
    setWithholdingRate(client.withholdingRate / 100);
    setItems((current) => current.map((item, index) => (index === 0 && !item.description ? { ...item, description: client.defaultDescription } : item)));
  }

  function submitInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await action(formData);
        toast.success(result.message);
        onSaved?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save invoice");
      }
    });
  }

  return (
    <form onSubmit={submitInvoice} className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_280px]">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <section className="space-y-5">
        <div className="grid gap-3 rounded-md border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="field sm:col-span-2">Client
            <select name="clientId" value={clientId} onChange={(event) => selectClient(event.target.value)} required>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label className="field sm:col-span-2 lg:col-span-1">Issue date<input name="issueDate" type="date" required defaultValue={initial?.issueDate ?? new Date().toISOString().slice(0, 10)} /></label>
          <label className="field">Currency<select name="currency" value={currency} onChange={(event) => setCurrency(event.target.value as "EUR" | "USD")}><option>EUR</option><option>USD</option></select></label>
          <label className="field">PDF language<select name="language" value={language} onChange={(event) => setLanguage(event.target.value as "es" | "en")}><option value="es">Español</option><option value="en">English</option></select></label>
        </div>

        <div className="overflow-hidden rounded-md border bg-surface">
          <div className="grid grid-cols-[minmax(180px,1fr)_90px_120px_34px] gap-2 border-b bg-surface-raised px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span>Description</span><span>Quantity</span><span>Unit price</span><span />
          </div>
          <div className="divide-y">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[minmax(180px,1fr)_90px_120px_34px] gap-2 p-2">
                <input aria-label={`Item ${index + 1} description`} value={item.description} onChange={(e) => setItems((all) => all.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} required />
                <input aria-label={`Item ${index + 1} quantity`} type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => setItems((all) => all.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))} required />
                <input aria-label={`Item ${index + 1} unit price`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => setItems((all) => all.map((row, i) => i === index ? { ...row, unitPrice: e.target.value } : row))} required />
                <Button type="button" size="icon" variant="ghost" aria-label="Remove item" disabled={items.length === 1} onClick={() => setItems((all) => all.filter((_, i) => i !== index))}><Trash2 /></Button>
              </div>
            ))}
          </div>
          <div className="border-t p-2"><Button type="button" variant="ghost" size="sm" onClick={() => setItems((all) => [...all, { description: "", quantity: "1", unitPrice: "0.00" }])}><Plus /> Add item</Button></div>
        </div>

        <div className="rounded-md border bg-surface p-4">
          <label className="field">Payment terms<textarea name="paymentTerms" rows={3} defaultValue={initial?.paymentTerms ?? "Payable within 30 days."} /></label>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-md border bg-surface p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taxes</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs"><input name="vatEnabled" type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} /> IVA</label>
            <label className="field">IVA rate (%)<input name="vatRate" type="number" min="0" max="100" step="0.01" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} disabled={!vatEnabled} /></label>
            <label className="flex items-center gap-2 text-xs"><input name="withholdingEnabled" type="checkbox" checked={withholdingEnabled} onChange={(e) => setWithholdingEnabled(e.target.checked)} /> IRPF withholding</label>
            <label className="field">IRPF rate (%)<input name="withholdingRate" type="number" min="0" max="100" step="0.01" value={withholdingRate} onChange={(e) => setWithholdingRate(Number(e.target.value))} disabled={!withholdingEnabled} /></label>
          </div>
        </div>
        <div className="rounded-md border bg-surface p-4 text-xs">
          <div className="flex justify-between py-1.5 text-muted-foreground"><span>Subtotal</span><span>{formatMoney(totals.subtotalCents, currency)}</span></div>
          {vatEnabled && <div className="flex justify-between py-1.5 text-muted-foreground"><span>IVA</span><span>+{formatMoney(totals.vatCents, currency)}</span></div>}
          {withholdingEnabled && <div className="flex justify-between py-1.5 text-muted-foreground"><span>IRPF</span><span>−{formatMoney(totals.withholdingCents, currency)}</span></div>}
          <div className="mt-2 flex justify-between border-t pt-3 text-sm font-semibold"><span>Total</span><span>{formatMoney(totals.totalCents, currency)}</span></div>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Create invoice"}</Button>
      </aside>
    </form>
  );
}
