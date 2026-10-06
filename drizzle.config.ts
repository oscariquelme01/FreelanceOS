import "./env.config";

import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const databaseUrl = z.string().url().startsWith("postgres").parse(process.env.DATABASE_URL);

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
