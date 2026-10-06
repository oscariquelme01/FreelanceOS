import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Invoices" };

const columns = ["Invoice", "Client", "Issued", "Status", "Total"];

export default function InvoicesPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b px-5 lg:px-7">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Invoices</h1>
          <p className="text-xs text-muted-foreground">Billing and deductible expenses</p>
        </div>
        <Button size="sm" disabled title="Invoice CRUD follows the Pipeline feature slice">
          <Plus aria-hidden="true" />
          New invoice
        </Button>
      </header>

      <div className="flex-1 p-4 lg:p-6">
        <section className="overflow-hidden rounded-md border bg-surface" aria-label="Invoice preview">
          <div className="grid min-w-[640px] grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_0.7fr] border-b bg-surface-raised px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {columns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm font-medium">Invoice workspace reserved</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Clients, invoice generation, PDFs, and quarterly expenses will be built after the Pipeline is complete.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
