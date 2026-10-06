import { sql } from "drizzle-orm";

import { databaseClient, db } from "@/db";

async function checkDatabase() {
  try {
    await db.execute(sql`select 1`);
    console.log("Database connection successful.");
  } finally {
    await databaseClient.end();
  }
}

checkDatabase().catch((error: unknown) => {
  console.error("Database connection failed.", error);
  process.exitCode = 1;
});
