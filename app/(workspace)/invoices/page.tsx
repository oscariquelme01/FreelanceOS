import { asc, count, desc, ilike, or, sql } from "drizzle-orm";
import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { updateInvoiceStatus } from "@/app/(workspace)/invoices/actions";
import { BillingSection } from "@/components/invoices/billing-section";
import { ClientsSection } from "@/components/invoices/clients-section";
import { ExpensesSection } from "@/components/invoices/expenses-section";
import { EditInvoiceSheet, NewInvoiceSheet } from "@/components/invoices/invoice-sheet";
import { InvoiceStatusSelect } from "@/components/invoices/invoice-status-select";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { billingProfiles, clients, expenses, invoices } from "@/db/schema";
import { formatMoney } from "@/lib/invoices/calculations";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  await connection();
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const requestedPage = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = 10;
  const invoiceFilter = search ? or(ilike(invoices.number, `%${search}%`), sql`${invoices.clientSnapshot}->>'name' ilike ${`%${search}%`}`) : undefined;
  const [invoiceRows, invoiceCountRows, clientRows, profileRows, expenseRows] = await Promise.all([
    db.select().from(invoices).where(invoiceFilter).orderBy(desc(invoices.issueDate), desc(invoices.sequenceNumber)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ value: count() }).from(invoices).where(invoiceFilter),
    db.select().from(clients).orderBy(asc(clients.name)),
    db.select().from(billingProfiles).limit(1),
    db.select().from(expenses).orderBy(desc(expenses.expenseDate)),
  ]);
  const invoiceCount = invoiceCountRows[0].value;
  const activeClientRows = clientRows.filter((client) => client.active);
  const pageCount = Math.max(1, Math.ceil(invoiceCount / pageSize));
  const pageHref = (target: number) => `/invoices?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(target) })}`;
  if (page > pageCount) redirect(pageHref(pageCount));

  return (
    <div>
      <header className="flex h-14 items-center justify-between border-b px-5 lg:px-7">
        <div><h1 className="text-sm font-semibold">Invoices</h1><p className="text-xs text-muted-foreground">{invoiceCount} invoices · {clientRows.length} clients · {expenseRows.length} expenses</p></div>
        <NewInvoiceSheet clients={activeClientRows} ready={activeClientRows.length > 0 && profileRows.length > 0} />
      </header>
      <div className="space-y-5 p-4 lg:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-t-2 border-t-peach/70 bg-surface">
            <div className="flex items-center justify-between gap-4 border-b bg-surface-raised px-3 py-2">
              <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-peach" /><h2 className="text-xs font-semibold">Invoice register</h2></div>
              <form className="flex w-full max-w-xs gap-2"><input name="q" placeholder="Search invoices…" defaultValue={search} className="w-full" /><Button variant="secondary" type="submit">Search</Button></form>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] table-fixed text-left text-xs">
            <thead className="border-b bg-surface-raised text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Invoice</th><th className="px-3 py-2">Client</th><th className="px-3 py-2">Issued</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Total</th><th className="w-20 px-3 py-2" /></tr></thead>
            <tbody className="divide-y">
              {invoiceRows.map((invoice) => (
                <tr key={invoice.id} className="h-12 hover:bg-muted/40">
                  <td className="truncate px-3 font-medium text-peach">{invoice.number}</td>
                  <td className="truncate px-3">{invoice.clientSnapshot.name}</td>
                  <td className="px-3 text-muted-foreground">{invoice.issueDate}</td>
                  <td className="px-3"><InvoiceStatusSelect number={invoice.number} status={invoice.status} action={updateInvoiceStatus.bind(null, invoice.id)} /></td>
                  <td className="px-3 text-right font-mono">{formatMoney(invoice.totalCents, invoice.currency)}</td>
                  <td className="px-3"><div className="flex justify-end gap-1"><EditInvoiceSheet id={invoice.id} number={invoice.number} clients={clientRows} /><Button asChild size="icon" variant="ghost"><a href={`/api/invoices/${invoice.id}/pdf`} aria-label={`Download ${invoice.number}`}><Download /></a></Button></div></td>
                </tr>
              ))}
              {!invoiceRows.length && <tr className="h-12"><td colSpan={6} className="px-3 text-center text-muted-foreground">No invoices found.</td></tr>}
              {Array.from({ length: pageSize - Math.max(1, invoiceRows.length) }).map((_, index) => <tr key={`empty-${index}`} className="h-12" aria-hidden="true"><td colSpan={6} /></tr>)}
            </tbody>
            </table></div>
            <div className="flex h-10 shrink-0 items-center justify-between border-t px-3 text-xs text-muted-foreground"><span>Page {Math.min(page, pageCount)} of {pageCount}</span><div className="flex gap-1"><Button asChild size="sm" variant="ghost" className={page <= 1 ? "pointer-events-none opacity-40" : undefined}><Link href={pageHref(Math.max(1, page - 1))}>Previous</Link></Button><Button asChild size="sm" variant="ghost" className={page >= pageCount ? "pointer-events-none opacity-40" : undefined}><Link href={pageHref(Math.min(pageCount, page + 1))}>Next</Link></Button></div></div>
          </section>
          <aside className="flex min-h-0 flex-col gap-5">
            <BillingSection profile={profileRows[0]} />
            <ClientsSection rows={clientRows} />
          </aside>
        </div>
        <ExpensesSection rows={expenseRows} />
      </div>
    </div>
  );
}
