"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { createClient, updateClient } from "@/app/(workspace)/invoices/actions";
import { ClientFields } from "@/components/invoices/client-fields";
import { useSheetAction } from "@/components/invoices/use-sheet-action";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { clients } from "@/db/schema";

type Client = typeof clients.$inferSelect;

export function ClientSheet({ client }: { client?: Client }) {
  const [open, setOpen] = useState(false);
  const action = client ? updateClient.bind(null, client.id) : createClient;
  const { pending, onSubmit } = useSheetAction(action, () => setOpen(false));
  return <>
    {client ? <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${client.name}`} onClick={() => setOpen(true)}><Pencil /></Button> : <Button type="button" variant="ghost" size="sm" className="text-peach" onClick={() => setOpen(true)}><Plus /> Add</Button>}
    <Sheet open={open} onOpenChange={setOpen} title={client ? `Edit ${client.name}` : "New client"} description="Contact details and invoice defaults">
      <form onSubmit={onSubmit} className="space-y-5"><ClientFields client={client} /><Button type="submit" disabled={pending}>{pending ? "Saving…" : client ? "Save client" : "Create client"}</Button></form>
    </Sheet>
  </>;
}
