import { and, count, eq, inArray, max, sql } from "drizzle-orm";

import { databaseClient, db } from "@/db";
import { billingProfiles, clients, invoiceItems, invoiceSequences, invoices, opportunities, opportunityStatusEvents, type BillingSnapshot, type ClientSnapshot } from "@/db/schema";
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
  if (existingDemoInvoices >= targetCount) console.log(`Invoice seed complete: ${existingDemoInvoices} demo invoices already exist.`);

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
  if (existingDemoInvoices < targetCount) console.log(`Demo data now contains ${targetCount} invoices.`);

  const today = new Date();
  const dateOffset = (days: number) => {
    const value = new Date(today);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  };
  const demoOpportunities = [
    { company: "Lumen Labs", role: "Frontend systems contract", status: "lead" as const, source: "LinkedIn", contactName: "Maya Chen", contactEmail: "maya@lumen.example", url: "https://example.com/lumen", followUpDate: dateOffset(4), notes: "Strong fit for design systems work." },
    { company: "Northstar Health", role: "Product engineering support", status: "contacted" as const, source: "Cold email", contactName: "Daniel Ruiz", contactEmail: "", url: "https://example.com/northstar", contactedDate: dateOffset(-4), followUpDate: dateOffset(-1), notes: "Sent a short portfolio introduction." },
    { company: "Orbit Works", role: "React migration project", status: "replied" as const, source: "Company website", contactName: "Leah Brooks", contactEmail: "leah@orbit.example", url: "https://example.com/orbit", contactedDate: dateOffset(-8), followUpDate: dateOffset(0), notes: "Asked for availability and rough timeline." },
    { company: "Juniper Cloud", role: "Senior frontend contractor", status: "interviewing" as const, source: "Wellfound", contactName: "Owen Smith", contactEmail: "owen@juniper.example", url: "https://example.com/juniper", contactedDate: dateOffset(-12), followUpDate: dateOffset(2), notes: "Technical conversation scheduled." },
    { company: "Common Thread", role: "Customer portal rebuild", status: "proposal" as const, source: "Referral", contactName: "Sara Evans", contactEmail: "sara@thread.example", url: "https://example.com/thread", contactedDate: dateOffset(-18), followUpDate: dateOffset(3), notes: "Proposal sent; waiting on budget approval." },
    { company: "Harbor Finance", role: "Dashboard implementation", status: "won" as const, source: "Community", contactName: "Alex Morgan", contactEmail: "alex@harbor.example", url: "https://example.com/harbor", contactedDate: dateOffset(-30), followUpDate: null, notes: "Accepted and moving into delivery." },
    { company: "Pinecone Studio", role: "Commerce redesign", status: "lost" as const, source: "LinkedIn", contactName: "", contactEmail: "", url: "https://example.com/pinecone", contactedDate: dateOffset(-25), followUpDate: null, notes: "Budget was below range." },
    { company: "Signal House", role: "Internal tools engagement", status: "ghosted" as const, source: "Cold email", contactName: "Nora Patel", contactEmail: "", url: "https://example.com/signal", contactedDate: dateOffset(-21), followUpDate: null, notes: "No reply after two follow-ups." },
    { company: "Cedar AI", role: "Prototype development", status: "contacted" as const, source: "Job board", contactName: "", contactEmail: "", url: "https://example.com/cedar", contactedDate: dateOffset(-2), followUpDate: dateOffset(5), notes: "Applied with a tailored project sample." },
    { company: "Field Notes", role: "Web application improvements", status: "lead" as const, source: "Direct research", contactName: "Iris Wong", contactEmail: "iris@fieldnotes.example", url: "https://example.com/field-notes", contactedDate: null, followUpDate: null, notes: "Research the product before reaching out." },
    { company: "Atlas Legal", role: "Client workspace build", status: "replied" as const, source: "Referral", contactName: "Jon Bell", contactEmail: "jon@atlas.example", url: "https://example.com/atlas", contactedDate: dateOffset(-7), followUpDate: dateOffset(1), notes: "Needs a short discovery call." },
    { company: "Mosaic Travel", role: "Booking flow optimization", status: "proposal" as const, source: "Company website", contactName: "Eva Hart", contactEmail: "", url: "https://example.com/mosaic", contactedDate: dateOffset(-14), followUpDate: dateOffset(-2), notes: "Follow up on the proposal scope." },
  ];
  for (const opportunity of demoOpportunities) {
    let [existing] = await db.select({ id: opportunities.id, createdAt: opportunities.createdAt }).from(opportunities).where(and(eq(opportunities.company, opportunity.company), eq(opportunities.role, opportunity.role))).limit(1);
    if (!existing) [existing] = await db.insert(opportunities).values(opportunity).returning({ id: opportunities.id, createdAt: opportunities.createdAt });
    const [{ value: eventCount }] = await db.select({ value: count() }).from(opportunityStatusEvents).where(eq(opportunityStatusEvents.opportunityId, existing.id));
    if (!eventCount) {
      const contactedAt = opportunity.contactedDate ? new Date(`${opportunity.contactedDate}T12:00:00Z`) : existing.createdAt;
      const path = opportunity.status === "lead" ? ["lead"] as const
        : opportunity.status === "lost" ? ["lead", "contacted", "lost"] as const
        : opportunity.status === "ghosted" ? ["lead", "contacted", "ghosted"] as const
        : (["lead", "contacted", "replied", "interviewing", "proposal", "won"] as const).slice(0, ["contacted", "replied", "interviewing", "proposal", "won"].indexOf(opportunity.status) + 2);
      await db.insert(opportunityStatusEvents).values(path.map((status, index) => ({
        opportunityId: existing.id,
        fromStatus: index ? path[index - 1] : null,
        toStatus: status,
        changedAt: new Date(contactedAt.getTime() + Math.max(0, index - 1) * 86400000),
      })));
    }
  }
  console.log(`Outreach seed complete: ${demoOpportunities.length} demo opportunities available.`);
}

seed().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => databaseClient.end());
