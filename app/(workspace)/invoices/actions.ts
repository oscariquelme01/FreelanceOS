"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  billingProfiles,
  clients,
  expenses,
  invoiceItems,
  invoiceSequences,
  invoices,
  type BillingSnapshot,
  type ClientSnapshot,
} from "@/db/schema";
import { calculateInvoice, eurosToCents } from "@/lib/invoices/calculations";

const optionalString = z.string().trim().default("");
const clientSchema = z.object({
  name: z.string().trim().min(1),
  taxId: optionalString,
  email: z.union([z.literal(""), z.email()]).default(""),
  address: optionalString,
  postalCode: optionalString,
  city: optionalString,
  province: optionalString,
  country: optionalString,
  defaultDescription: optionalString,
  currency: z.enum(["EUR", "USD"]),
  language: z.enum(["es", "en"]),
  vatEnabled: z.boolean(),
  vatRate: z.number().min(0).max(10000),
  withholdingEnabled: z.boolean(),
  withholdingRate: z.number().min(0).max(10000),
  active: z.boolean(),
});

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function rateToBasisPoints(value: string) {
  return Math.round(Number(value || 0) * 100);
}

function parseClient(formData: FormData) {
  return clientSchema.parse({
    name: text(formData, "name"),
    taxId: text(formData, "taxId"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    postalCode: text(formData, "postalCode"),
    city: text(formData, "city"),
    province: text(formData, "province"),
    country: text(formData, "country"),
    defaultDescription: text(formData, "defaultDescription"),
    currency: text(formData, "currency"),
    language: text(formData, "language"),
    vatEnabled: checked(formData, "vatEnabled"),
    vatRate: rateToBasisPoints(text(formData, "vatRate")),
    withholdingEnabled: checked(formData, "withholdingEnabled"),
    withholdingRate: rateToBasisPoints(text(formData, "withholdingRate")),
    active: checked(formData, "active"),
  });
}

export async function saveBillingProfile(formData: FormData) {
  const [existing] = await db.select().from(billingProfiles).limit(1);
  let signaturePath = existing?.signaturePath ?? null;
  const signature = formData.get("signature");
  if (signature instanceof File && signature.size > 0) {
    if (!new Set(["image/png", "image/jpeg"]).has(signature.type) || signature.size > 2 * 1024 * 1024) {
      throw new Error("Use a PNG or JPEG signature up to 2 MB.");
    }
    const extension = signature.type === "image/png" ? ".png" : ".jpg";
    signaturePath = path.join("signatures", `${randomUUID()}${extension}`);
    const storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
    const destination = path.join(/* turbopackIgnore: true */ storageRoot, signaturePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(/* turbopackIgnore: true */ destination, Buffer.from(await signature.arrayBuffer()));
  }
  const values: Omit<typeof billingProfiles.$inferInsert, "id" | "createdAt" | "updatedAt"> = {
    legalName: text(formData, "legalName"),
    taxId: text(formData, "taxId"),
    address: text(formData, "address"),
    postalCode: text(formData, "postalCode"),
    city: text(formData, "city"),
    province: text(formData, "province"),
    country: text(formData, "country") || "España",
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    iban: text(formData, "iban"),
    bic: text(formData, "bic"),
    paymentInstructions: text(formData, "paymentInstructions"),
    signaturePath,
  };
  if (!values.legalName || !values.taxId) throw new Error("Legal name and tax ID are required.");
  if (existing) {
    await db.update(billingProfiles).set({ ...values, updatedAt: new Date() }).where(eq(billingProfiles.id, existing.id));
  } else {
    await db.insert(billingProfiles).values(values);
  }
  revalidatePath("/invoices");
  return { success: true, message: "Billing details saved" };
}

export async function createClient(formData: FormData) {
  await db.insert(clients).values(parseClient(formData));
  revalidatePath("/invoices");
  return { success: true, message: "Client created" };
}

export async function updateClient(id: string, formData: FormData) {
  await db.update(clients).set({ ...parseClient(formData), updatedAt: new Date() }).where(eq(clients.id, id));
  revalidatePath("/invoices");
  return { success: true, message: "Client saved" };
}

export async function deleteClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/invoices");
  return { success: true, message: "Client deleted" };
}

const itemSchema = z.array(
  z.object({
    description: z.string().trim().min(1),
    quantity: z.string().regex(/^\d+(\.\d{1,3})?$/),
    unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  }),
).min(1);

function issuerSnapshot(profile: typeof billingProfiles.$inferSelect): BillingSnapshot {
  return {
    legalName: profile.legalName,
    taxId: profile.taxId,
    address: profile.address,
    postalCode: profile.postalCode,
    city: profile.city,
    province: profile.province,
    country: profile.country,
    email: profile.email,
    phone: profile.phone,
    iban: profile.iban,
    bic: profile.bic,
    paymentInstructions: profile.paymentInstructions,
    signaturePath: profile.signaturePath,
  };
}

function clientSnapshot(client: typeof clients.$inferSelect): ClientSnapshot {
  return {
    name: client.name,
    taxId: client.taxId,
    email: client.email,
    address: client.address,
    postalCode: client.postalCode,
    city: client.city,
    province: client.province,
    country: client.country,
  };
}

function invoiceInput(formData: FormData) {
  const parsedItems = itemSchema.parse(JSON.parse(text(formData, "items")));
  const vatEnabled = checked(formData, "vatEnabled");
  const withholdingEnabled = checked(formData, "withholdingEnabled");
  const vatRate = rateToBasisPoints(text(formData, "vatRate"));
  const withholdingRate = rateToBasisPoints(text(formData, "withholdingRate"));
  return {
    clientId: z.string().uuid().parse(text(formData, "clientId")),
    issueDate: z.iso.date().parse(text(formData, "issueDate")),
    currency: z.enum(["EUR", "USD"]).parse(text(formData, "currency")),
    language: z.enum(["es", "en"]).parse(text(formData, "language")),
    vatEnabled,
    vatRate,
    withholdingEnabled,
    withholdingRate,
    paymentTerms: text(formData, "paymentTerms"),
    calculation: calculateInvoice(parsedItems, vatEnabled, vatRate, withholdingEnabled, withholdingRate),
  };
}

export async function createInvoice(formData: FormData) {
  const input = invoiceInput(formData);
  const [client] = await db.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
  const [profile] = await db.select().from(billingProfiles).limit(1);
  if (!client || !profile) throw new Error("A client and billing profile are required.");
  if (!client.active) throw new Error("Select an active client for a new invoice.");
  const year = Number(input.issueDate.slice(0, 4));

  const invoiceId = await db.transaction(async (tx) => {
    const [sequence] = await tx
      .insert(invoiceSequences)
      .values({ year, nextValue: 2 })
      .onConflictDoUpdate({
        target: invoiceSequences.year,
        set: { nextValue: sql`${invoiceSequences.nextValue} + 1` },
      })
      .returning({ nextValue: invoiceSequences.nextValue });
    const sequenceNumber = sequence.nextValue - 1;
    const number = `${year}-${String(sequenceNumber).padStart(4, "0")}`;
    const [created] = await tx
      .insert(invoices)
      .values({
        number,
        sequenceYear: year,
        sequenceNumber,
        clientId: client.id,
        issueDate: input.issueDate,
        currency: input.currency,
        language: input.language,
        vatEnabled: input.vatEnabled,
        vatRate: input.vatRate,
        withholdingEnabled: input.withholdingEnabled,
        withholdingRate: input.withholdingRate,
        subtotalCents: input.calculation.subtotalCents,
        vatCents: input.calculation.vatCents,
        withholdingCents: input.calculation.withholdingCents,
        totalCents: input.calculation.totalCents,
        paymentTerms: input.paymentTerms,
        issuerSnapshot: issuerSnapshot(profile),
        clientSnapshot: clientSnapshot(client),
      })
      .returning({ id: invoices.id });
    await tx.insert(invoiceItems).values(
      input.calculation.items.map((item) => ({
        invoiceId: created.id,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        amountCents: item.amountCents,
        position: item.position,
      })),
    );
    return created.id;
  });
  revalidatePath("/invoices");
  return { success: true, message: "Invoice created", id: invoiceId };
}

export async function updateInvoice(id: string, formData: FormData) {
  const input = invoiceInput(formData);
  const [client] = await db.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
  const [existingInvoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!client || !existingInvoice) throw new Error("The invoice or selected client no longer exists.");
  await db.transaction(async (tx) => {
    await tx
      .update(invoices)
      .set({
        clientId: client.id,
        issueDate: input.issueDate,
        currency: input.currency,
        language: input.language,
        vatEnabled: input.vatEnabled,
        vatRate: input.vatRate,
        withholdingEnabled: input.withholdingEnabled,
        withholdingRate: input.withholdingRate,
        subtotalCents: input.calculation.subtotalCents,
        vatCents: input.calculation.vatCents,
        withholdingCents: input.calculation.withholdingCents,
        totalCents: input.calculation.totalCents,
        paymentTerms: input.paymentTerms,
        issuerSnapshot: existingInvoice.issuerSnapshot,
        clientSnapshot:
          existingInvoice.clientId === client.id
            ? existingInvoice.clientSnapshot
            : clientSnapshot(client),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id));
    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await tx.insert(invoiceItems).values(
      input.calculation.items.map((item) => ({
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        amountCents: item.amountCents,
        position: item.position,
      })),
    );
  });
  revalidatePath("/invoices");
  return { success: true, message: "Invoice saved", id };
}

export async function updateInvoiceStatus(id: string, value: string) {
  const status = z.enum(["sent", "paid", "rejected"]).parse(value);
  await db
    .update(invoices)
    .set({ status, paidAt: status === "paid" ? new Date() : null, updatedAt: new Date() })
    .where(eq(invoices.id, id));
  revalidatePath("/invoices");
}

const acceptedFiles = new Set(["application/pdf", "image/png", "image/jpeg"]);

function expenseInput(formData: FormData) {
  const totalCents = eurosToCents(text(formData, "total"));
  const taxableBaseCents = text(formData, "taxableBase") ? eurosToCents(text(formData, "taxableBase")) : null;
  const vatCents = text(formData, "vat") ? eurosToCents(text(formData, "vat")) : null;
  if (totalCents <= 0) throw new Error("Total must be positive.");
  if ((taxableBaseCents ?? 0) < 0 || (vatCents ?? 0) < 0) throw new Error("Taxable base and IVA cannot be negative.");
  return {
    expenseDate: z.iso.date().parse(text(formData, "expenseDate")),
    title: z.string().min(1).parse(text(formData, "title")),
    totalCents,
    taxableBaseCents,
    vatCents,
  };
}

async function storeExpenseFile(file: File) {
  if (!acceptedFiles.has(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Use a PDF, PNG, or JPEG up to 10 MB.");
  const extension = path.extname(file.name).toLowerCase().slice(0, 8);
  const relativePath = path.join("expenses", `${randomUUID()}${extension}`);
  const storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
  const destination = path.join(storageRoot, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(/* turbopackIgnore: true */ destination, Buffer.from(await file.arrayBuffer()));
  return { originalFilename: path.basename(file.name), storagePath: relativePath, mimeType: file.type, fileSize: file.size };
}

export async function createExpense(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("A document is required.");
  const values = expenseInput(formData);
  const storedFile = await storeExpenseFile(file);
  try {
    await db.insert(expenses).values({ ...values, ...storedFile });
  } catch (error) {
    const storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
    await unlink(path.join(/* turbopackIgnore: true */ storageRoot, storedFile.storagePath)).catch(() => undefined);
    throw error;
  }
  revalidatePath("/invoices");
  return { success: true, message: "Expense uploaded" };
}

export async function updateExpense(id: string, formData: FormData) {
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!expense) throw new Error("Expense not found.");
  const values = expenseInput(formData);
  const file = formData.get("file");
  const replacement = file instanceof File && file.size > 0 ? await storeExpenseFile(file) : null;
  try {
    const updated = await db
      .update(expenses)
      .set({ ...values, ...(replacement ?? {}), updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.storagePath, expense.storagePath)))
      .returning({ id: expenses.id });
    if (!updated.length) throw new Error("Expense changed before it could be saved. Try again.");
  } catch (error) {
    if (replacement) {
      const storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
      await unlink(path.join(/* turbopackIgnore: true */ storageRoot, replacement.storagePath)).catch(() => undefined);
    }
    throw error;
  }
  if (replacement) {
    const storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
    await unlink(path.join(/* turbopackIgnore: true */ storageRoot, expense.storagePath)).catch(() => undefined);
  }
  revalidatePath("/invoices");
  return { success: true, message: "Expense saved" };
}

export async function deleteExpense(id: string) {
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!expense) return;
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.storagePath, expense.storagePath)));
  const storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
  await unlink(path.join(/* turbopackIgnore: true */ storageRoot, expense.storagePath)).catch(() => undefined);
  revalidatePath("/invoices");
  return { success: true, message: "Expense deleted" };
}
