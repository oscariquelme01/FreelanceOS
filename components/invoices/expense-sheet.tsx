"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { createExpense, updateExpense } from "@/app/(workspace)/invoices/actions";
import { useSheetAction } from "@/components/invoices/use-sheet-action";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { expenses } from "@/db/schema";
import { centsToInput } from "@/lib/invoices/calculations";

type Expense = typeof expenses.$inferSelect;

export function ExpenseSheet({ expense }: { expense?: Expense }) {
  const [open, setOpen] = useState(false);
  const action = expense ? updateExpense.bind(null, expense.id) : createExpense;
  const { pending, onSubmit } = useSheetAction(action, () => setOpen(false));
  return <>
    {expense ? <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${expense.title}`} onClick={() => setOpen(true)}><Pencil /></Button> : <Button type="button" variant="ghost" size="sm" className="text-peach" onClick={() => setOpen(true)}><Plus /> Upload</Button>}
    <Sheet open={open} onOpenChange={setOpen} title={expense ? `Edit ${expense.title}` : "New deductible expense"} description={expense ? "Update the bookkeeping details or replace the document" : "Upload the document and enter the minimum bookkeeping details"}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field">Date *<input name="expenseDate" type="date" required defaultValue={expense?.expenseDate} /></label><label className="field">Title *<input name="title" required defaultValue={expense?.title} /></label>
          <label className="field">Total *<input name="total" type="number" min="0.01" step="0.01" required defaultValue={centsToInput(expense?.totalCents)} /></label><label className="field">{expense ? "Replace document" : "Document *"}<input name="file" type="file" accept="application/pdf,image/png,image/jpeg" required={!expense} />{expense && <span className="truncate text-xs text-muted-foreground">Current: {expense.originalFilename}</span>}</label>
          <label className="field">Taxable base<input name="taxableBase" type="number" min="0" step="0.01" defaultValue={centsToInput(expense?.taxableBaseCents)} /></label><label className="field">IVA amount<input name="vat" type="number" min="0" step="0.01" defaultValue={centsToInput(expense?.vatCents)} /></label>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : expense ? "Save changes" : "Save expense"}</Button>
      </form>
    </Sheet>
  </>;
}
