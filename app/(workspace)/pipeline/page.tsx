import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pipeline" };

const columns = ["Company", "Opportunity", "Status", "Source", "Contacted"];

export default function PipelinePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b px-5 lg:px-7">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Pipeline</h1>
          <p className="text-xs text-muted-foreground">Freelance opportunities</p>
        </div>
        <Button size="sm" disabled title="Opportunity CRUD is the next feature slice">
          <Plus aria-hidden="true" />
          Add opportunity
        </Button>
      </header>

      <div className="flex-1 p-4 lg:p-6">
        <section className="overflow-hidden rounded-md border bg-surface" aria-label="Pipeline preview">
          <div className="grid min-w-[720px] grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_0.7fr] border-b bg-surface-raised px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {columns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm font-medium">Your pipeline starts here</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Opportunity CRUD, filters, metrics, and demo data will be added as the first feature slice.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
