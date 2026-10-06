"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createInvoice, updateInvoice } from "@/app/(workspace)/invoices/actions";
import { InvoiceEditor, type InvoiceEditorClient, type InvoiceEditorValue } from "@/components/invoices/invoice-editor";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export function NewInvoiceSheet({ clients, ready }: { clients: InvoiceEditorClient[]; ready: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return <>
    <Button type="button" size="sm" disabled={!ready} title={ready ? undefined : "Add billing details and a client first"} className="bg-peach text-background hover:bg-peach/90" onClick={() => setOpen(true)}><Plus /> New invoice</Button>
    <Sheet open={open} onOpenChange={setOpen} title="New invoice" description="The annual invoice number is assigned when saved">
      <InvoiceEditor clients={clients} action={createInvoice} onSaved={() => { setOpen(false); router.refresh(); }} />
    </Sheet>
  </>;
}

export function EditInvoiceSheet({ id, number, clients }: { id: string; number: string; clients: InvoiceEditorClient[] }) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<InvoiceEditorValue>();
  const [error, setError] = useState<string>();
  const router = useRouter();
  async function openEditor() {
    setOpen(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/invoices/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load invoice");
      setInitial(await response.json() as InvoiceEditorValue);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load invoice");
    }
  }
  return <>
    <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${number}`} onClick={openEditor}><Pencil /></Button>
    <Sheet open={open} onOpenChange={setOpen} title={`Edit ${number}`} description="Update line items and invoice-specific details">
      {error ? <p className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">{error}</p> : initial ? <InvoiceEditor key={`${id}-${initial.issueDate}`} clients={clients} action={updateInvoice.bind(null, id)} initial={initial} onSaved={() => { setOpen(false); router.refresh(); }} /> : <div className="space-y-3"><div className="h-8 animate-pulse rounded bg-muted" /><div className="h-40 animate-pulse rounded bg-muted" /></div>}
    </Sheet>
  </>;
}
