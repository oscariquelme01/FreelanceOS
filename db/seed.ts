import { count, eq, inArray, max, sql } from "drizzle-orm";

import { databaseClient, db } from "@/db";
import { billingProfiles, clients, invoiceItems, invoiceSequences, invoices, type BillingSnapshot, type ClientSnapshot } from "@/db/schema";
import { calculateInvoice } from "@/lib/invoices/calculations";

const demoClients = [
  { name: "Acme Studio", taxId: "B00000001", email: "billing@acme.example", address: "Carrer de la Demo 5", postalCode: "08001", city: "Barcelona", country: "España", defaultDescription: "Servicios de desarrollo web", currency: "EUR" as const, language: "es" as const, vatEnabled: true, withholdingEnabled: true },
  { name: "Northwind GmbH", taxId: "DE000000000", email: "finance@northwind.example", address: "Alexanderplatz 4", postalCode: "10178", city: "Berlin", country: "Alemania", defaultDescription: "Software consulting", currency: "EUR" as const, language: "en" as const, vatEnabled: false, withholdingEnabled: false },
  { name: "Contoso LLC", taxId: "US-00-0000000", email: "accounts@contoso.example", address: "1 Demo Plaza", postalCode: "10001", city: "New York", country: "United States", defaultDescription: "Product engineering", currency: "USD" as const, language: "en" as const, vatEnabled: false, withholdingEnabled: false },
];

async function seed() {
  let [profile] = await db.select().from(billingProfiles).limit(1);
  if (!profile) {
    [profile] = await db.insert(billingProfiles).values({
      legalName: "Alex García (Demo)", taxId: "00000000T", address: "Calle Ejemplo 12", postalCode: "28001", city: "Madrid", province: "Madrid", country: "España", email: "alex@example.com", iban: "ES00 0000 0000 0000 0000 0000", paymentInstructions: "Transferencia bancaria indicando el número de factura.",
    }).returning();
  }

  const clientRows: (typeof clients.$inferSelect)[] = [];
  for (const definition of demoClients) {
    let [client] = await db.select().from(clients).where(eq(clients.name, definition.name)).limit(1);
    if (!client) [client] = await db.insert(clients).values(definition).returning();
    clientRows.push(client);
  }

  const clientIds = clientRows.map((client) => client.id);
  const [{ value: existingDemoInvoices }] = await db.select({ value: count() }).from(invoices).where(inArray(invoices.clientId, clientIds));
  const targetCount = 15;
  if (existingDemoInvoices >= targetCount) {
    console.log(`Seed complete: ${existingDemoInvoices} demo invoices already exist.`);
    return;
  }

  const year = new Date().getFullYear();
  const [{ value: maximumSequence }] = await db.select({ value: max(invoices.sequenceNumber) }).from(invoices).where(eq(invoices.sequenceYear, year));
  let nextSequence = (maximumSequence ?? 0) + 1;
  const issuer: BillingSnapshot = { legalName: profile.legalName, taxId: profile.taxId, address: profile.address, postalCode: profile.postalCode, city: profile.city, province: profile.province, country: profile.country, email: profile.email, phone: profile.phone, iban: profile.iban, bic: profile.bic, paymentInstructions: profile.paymentInstructions, signaturePath: profile.signaturePath };
  const statuses = ["sent", "paid", "rejected"] as const;
  const services = ["Implementation sprint", "Product design support", "Technical consulting", "Maintenance and improvements", "Integration work"];

  for (let index = existingDemoInvoices; index < targetCount; index += 1) {
    const client = clientRows[index % clientRows.length];
    const items = [
      { description: `${client.defaultDescription} · ${services[index % services.length]}`, quantity: String((index % 3) + 1), unitPrice: String(client.currency === "USD" ? 675 + index * 25 : 540 + index * 30) },
      ...(index % 4 === 0 ? [{ description: "Project coordination", quantity: "2", unitPrice: "95" }] : []),
    ];
    const calculated = calculateInvoice(items, client.vatEnabled, client.vatRate, client.withholdingEnabled, client.withholdingRate);
    const snapshot: ClientSnapshot = { name: client.name, taxId: client.taxId, email: client.email, address: client.address, postalCode: client.postalCode, city: client.city, province: client.province, country: client.country };
    const month = (index % 12) + 1;
    const issueDate = `${year}-${String(month).padStart(2, "0")}-${String(5 + (index % 20)).padStart(2, "0")}`;
    const sequence = nextSequence;
    nextSequence += 1;
    const [invoice] = await db.insert(invoices).values({ number: `${year}-${String(sequence).padStart(4, "0")}`, sequenceYear: year, sequenceNumber: sequence, clientId: client.id, status: statuses[index % statuses.length], issueDate, currency: client.currency, language: client.language, vatEnabled: client.vatEnabled, vatRate: client.vatRate, withholdingEnabled: client.withholdingEnabled, withholdingRate: client.withholdingRate, subtotalCents: calculated.subtotalCents, vatCents: calculated.vatCents, withholdingCents: calculated.withholdingCents, totalCents: calculated.totalCents, issuerSnapshot: issuer, clientSnapshot: snapshot, paymentTerms: "Payable within 30 days." }).returning();
    await db.insert(invoiceItems).values(calculated.items.map((item) => ({ invoiceId: invoice.id, description: item.description, quantity: item.quantity, unitPriceCents: item.unitPriceCents, amountCents: item.amountCents, position: item.position })));
  }

  await db.insert(invoiceSequences).values({ year, nextValue: nextSequence }).onConflictDoUpdate({ target: invoiceSequences.year, set: { nextValue: sql`greatest(${invoiceSequences.nextValue}, ${nextSequence})` } });
  console.log(`Demo data now contains ${targetCount} invoices.`);
}

seed().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => databaseClient.end());
