import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { centsToInput } from "@/lib/invoices/calculations";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) return Response.json({ message: "Invoice not found" }, { status: 404 });
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.position));
  return Response.json({
    clientId: invoice.clientId ?? "",
    issueDate: invoice.issueDate,
    currency: invoice.currency,
    language: invoice.language,
    vatEnabled: invoice.vatEnabled,
    vatRate: invoice.vatRate,
    withholdingEnabled: invoice.withholdingEnabled,
    withholdingRate: invoice.withholdingRate,
    paymentTerms: invoice.paymentTerms,
    items: items.map((item) => ({ description: item.description, quantity: String(Number(item.quantity)), unitPrice: centsToInput(item.unitPriceCents) })),
  });
}
