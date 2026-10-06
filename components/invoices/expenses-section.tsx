import { Download } from "lucide-react";

import { deleteExpense } from "@/app/(workspace)/invoices/actions";
import { ExpenseSheet } from "@/components/invoices/expense-sheet";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import type { expenses } from "@/db/schema";
import { formatMoney } from "@/lib/invoices/calculations";

type Expense = typeof expenses.$inferSelect;

export function ExpensesSection({ rows }: { rows: Expense[] }) {
  const groups = Map.groupBy(rows, (expense) => {
    const date = new Date(`${expense.expenseDate}T00:00:00Z`);
    return `${date.getUTCFullYear()} · Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  });
  return (
    <section id="expenses" className="scroll-mt-4 rounded-md border border-t-2 border-t-peach/40 bg-surface">
      <div className="flex items-center justify-between border-b bg-surface-raised px-3 py-2">
        <div><h2 className="text-xs font-semibold">Deductible expenses</h2><p className="text-xs text-muted-foreground">Manual documents grouped by Spanish tax quarter</p></div>
        <ExpenseSheet />
      </div>
      <div className="divide-y">
        {[...groups.entries()].map(([quarter, entries]) => {
          const total = entries.reduce((sum, row) => sum + row.totalCents, 0);
          const vat = entries.reduce((sum, row) => sum + (row.vatCents ?? 0), 0);
          return <div key={quarter}><div className="flex justify-between border-b bg-background/30 px-3 py-1.5 text-xs"><span className="font-medium">{quarter}</span><span className="text-muted-foreground">{entries.length} · {formatMoney(total, "EUR")} · IVA {formatMoney(vat, "EUR")}</span></div><table className="w-full min-w-[760px] text-left text-xs"><tbody className="divide-y">{entries.map((expense) => <tr key={expense.id} className="hover:bg-muted/30"><td className="w-28 px-3 py-2 text-muted-foreground">{expense.expenseDate}</td><td className="px-3 py-2 font-medium">{expense.title}</td><td className="w-32 px-3 py-2 text-right text-muted-foreground">{expense.taxableBaseCents == null ? "—" : formatMoney(expense.taxableBaseCents, "EUR")}</td><td className="w-28 px-3 py-2 text-right text-muted-foreground">{expense.vatCents == null ? "—" : formatMoney(expense.vatCents, "EUR")}</td><td className="w-32 px-3 py-2 text-right font-mono">{formatMoney(expense.totalCents, "EUR")}</td><td className="w-32 px-3 py-1"><div className="flex justify-end"><ExpenseSheet expense={expense} /><Button asChild size="icon" variant="ghost"><a href={`/api/expenses/${expense.id}/file`} aria-label={`Download ${expense.originalFilename}`}><Download /></a></Button><form action={async () => { "use server"; await deleteExpense(expense.id); }}><ConfirmSubmit message={`Delete ${expense.title} and its file?`} label="" /></form></div></td></tr>)}</tbody></table></div>;
        })}
        {!rows.length && <p className="p-8 text-center text-xs text-muted-foreground">No expenses uploaded yet.</p>}
      </div>
    </section>
  );
}
