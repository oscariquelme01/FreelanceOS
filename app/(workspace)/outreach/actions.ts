"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { opportunities, opportunityStatusEvents } from "@/db/schema";
import { addWorkdaysIso, contactedDateAfterStatusChange, outreachStatuses } from "@/lib/outreach";
import { opportunityInputSchema } from "@/lib/outreach-validation";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function parseOpportunity(formData: FormData) {
  const parsed = opportunityInputSchema.parse({
    company: text(formData, "company"),
    role: text(formData, "role"),
    status: text(formData, "status"),
    source: text(formData, "source"),
    contactName: text(formData, "contactName"),
    contactEmail: text(formData, "contactEmail"),
    url: text(formData, "url"),
    contactedDate: text(formData, "contactedDate"),
    followUpDate: text(formData, "followUpDate"),
    notes: text(formData, "notes"),
  });
  return {
    ...parsed,
    contactedDate: parsed.contactedDate || null,
    followUpDate: parsed.followUpDate || null,
  };
}

export async function createOpportunity(formData: FormData) {
  const values = parseOpportunity(formData);
  await db.transaction(async (tx) => {
    const [created] = await tx.insert(opportunities).values({ ...values, followUpDate: values.followUpDate ?? addWorkdaysIso(new Date(), 5) }).returning({ id: opportunities.id });
    await tx.insert(opportunityStatusEvents).values({ opportunityId: created.id, toStatus: values.status });
  });
  revalidatePath("/outreach");
  revalidatePath("/analytics");
  return { success: true, message: "Opportunity created" };
}

export async function updateOpportunity(id: string, formData: FormData) {
  const values = parseOpportunity(formData);
  await db.transaction(async (tx) => {
    const [existing] = await tx.select({ status: opportunities.status, contactedDate: opportunities.contactedDate }).from(opportunities).where(eq(opportunities.id, id)).limit(1);
    if (!existing) throw new Error("Opportunity not found.");
    const contactedDate = values.contactedDate ?? contactedDateAfterStatusChange(existing.status, values.status, existing.contactedDate);
    await tx.update(opportunities).set({ ...values, contactedDate, updatedAt: new Date() }).where(eq(opportunities.id, id));
    if (existing.status !== values.status) await tx.insert(opportunityStatusEvents).values({ opportunityId: id, fromStatus: existing.status, toStatus: values.status });
  });
  revalidatePath("/outreach");
  revalidatePath("/analytics");
  return { success: true, message: "Opportunity saved" };
}

export async function updateOpportunityStatus(id: string, value: string) {
  const status = z.enum(outreachStatuses).parse(value);
  const [existing] = await db.select({ status: opportunities.status, contactedDate: opportunities.contactedDate }).from(opportunities).where(eq(opportunities.id, id)).limit(1);
  if (!existing) throw new Error("Opportunity not found.");
  if (existing.status === status) return;
  await db.transaction(async (tx) => {
    await tx.update(opportunities).set({
      status,
      contactedDate: contactedDateAfterStatusChange(existing.status, status, existing.contactedDate),
      updatedAt: new Date(),
    }).where(eq(opportunities.id, id));
    await tx.insert(opportunityStatusEvents).values({ opportunityId: id, fromStatus: existing.status, toStatus: status });
  });
  revalidatePath("/outreach");
  revalidatePath("/analytics");
}

export async function deleteOpportunity(id: string) {
  await db.delete(opportunities).where(eq(opportunities.id, id));
  revalidatePath("/outreach");
  revalidatePath("/analytics");
  return { success: true, message: "Opportunity deleted" };
}
