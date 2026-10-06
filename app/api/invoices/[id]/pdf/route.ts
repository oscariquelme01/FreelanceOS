import { readFile } from "node:fs/promises";
import path from "node:path";

import { asc, eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";

import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { InvoicePdf } from "@/lib/invoices/pdf";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/invoices/[id]/pdf">) {
  const { id } = await context.params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) return new Response("Invoice not found", { status: 404 });
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.position));
  let signatureSource: string | undefined;
  if (invoice.issuerSnapshot.signaturePath) {
    const storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
    const signature = await readFile(path.join(/* turbopackIgnore: true */ storageRoot, invoice.issuerSnapshot.signaturePath)).catch(() => null);
    if (signature) {
      const extension = path.extname(invoice.issuerSnapshot.signaturePath).toLowerCase();
      signatureSource = `data:${extension === ".png" ? "image/png" : "image/jpeg"};base64,${signature.toString("base64")}`;
    }
  }
  const logo = await readFile(path.join(process.cwd(), "public", "invoice-logo.png")).catch(() => null);
  const logoSource = logo ? `data:image/png;base64,${logo.toString("base64")}` : undefined;
  const buffer = await renderToBuffer(InvoicePdf({ invoice, items, signatureSource, logoSource }));
  const safeClient = invoice.clientSnapshot.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]/g, "").trim().replaceAll(" ", "_");
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Factura_${invoice.number}_${safeClient}.pdf"`, "Cache-Control": "no-store" } });
}
