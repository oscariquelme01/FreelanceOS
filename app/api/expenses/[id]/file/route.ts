import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { expenses } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/expenses/[id]/file">) {
  const { id } = await context.params;
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!expense) return new Response("Expense not found", { status: 404 });
  const storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
  try {
    const file = await readFile(path.join(/* turbopackIgnore: true */ storageRoot, expense.storagePath));
    const filename = expense.originalFilename.replace(/["\r\n]/g, "_");
    return new Response(new Uint8Array(file), { headers: { "Content-Type": expense.mimeType, "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
  } catch {
    return new Response("Stored file not found", { status: 404 });
  }
}
