"use client";

import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteClient } from "@/app/(workspace)/invoices/actions";
import { ClientSheet } from "@/components/invoices/client-sheet";
import { Button } from "@/components/ui/button";
import type { clients } from "@/db/schema";

type Client = typeof clients.$inferSelect;
const pageSize = 5;

export function ClientsSection({ rows }: { rows: Client[] }) {
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const inactiveCount = rows.filter((client) => !client.active).length;

  function removeClient(client: Client) {
    if (!window.confirm(`Delete ${client.name}? Historical invoices retain their snapshot.`)) return;
    startTransition(async () => {
      try {
        const result = await deleteClient(client.id);
        toast.success(result.message);
        router.refresh();
      } catch {
        toast.error("Could not delete client");
      }
    });
  }

  return (
    <section id="clients" className="flex min-h-[330px] flex-1 scroll-mt-4 flex-col rounded-md border bg-surface xl:min-h-0">
      <div className="flex shrink-0 items-center justify-between border-b bg-surface-raised px-3 py-2">
        <div><h2 className="text-xs font-semibold">Clients</h2><p className="text-xs text-muted-foreground">{rows.length - inactiveCount} active{inactiveCount ? ` · ${inactiveCount} inactive` : ""}</p></div>
        <ClientSheet />
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-5 divide-y overflow-hidden">
        {pageRows.map((client) => (
          <div key={client.id} className="grid min-h-0 grid-cols-[minmax(0,1.25fr)_minmax(100px,0.75fr)_auto] items-center gap-3 px-3 hover:bg-muted/40">
            <div className="min-w-0 text-xs">
              <div className="flex items-center"><p className="truncate font-medium">{client.name}</p>{!client.active && <span className="ml-2 rounded-sm border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">Inactive</span>}</div>
              <p className="truncate text-muted-foreground">{client.email || "No email address"}</p>
            </div>
            <div className="min-w-0 text-xs">
              <p className="truncate font-mono text-muted-foreground">{client.taxId || "No tax ID"}</p>
              <p><span className="text-peach">{client.currency}</span><span className="text-muted-foreground"> · {client.language.toUpperCase()}</span></p>
            </div>
            <div className="flex items-center"><ClientSheet client={client} /><Button type="button" variant="ghost" size="icon" disabled={pending} aria-label={`Delete ${client.name}`} onClick={() => removeClient(client)}><Trash2 /></Button></div>
          </div>
        ))}
        {Array.from({ length: pageSize - pageRows.length }).map((_, index) => <div key={`empty-${index}`} aria-hidden="true" />)}
      </div>
      <div className="flex h-10 shrink-0 items-center justify-between border-t px-3 text-xs text-muted-foreground"><span>Page {currentPage} of {pageCount}</span><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft /><span className="sr-only">Previous clients</span></Button><Button type="button" variant="ghost" size="icon" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight /><span className="sr-only">Next clients</span></Button></div></div>
    </section>
  );
}
