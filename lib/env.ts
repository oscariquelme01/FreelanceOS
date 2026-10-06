import { z } from "zod";

const serverEnvironment = z.object({
  DATABASE_URL: z.string().url().startsWith("postgres"),
});

export const env = serverEnvironment.parse({
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (process.env.NEXT_PHASE === "phase-production-build"
      ? "postgres://build:build@127.0.0.1:5432/build"
      : undefined),
});
