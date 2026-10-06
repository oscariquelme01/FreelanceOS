import "server-only";

import { z } from "zod";

const serverEnvironment = z.object({
  DATABASE_URL: z.string().url().startsWith("postgres"),
});

export const env = serverEnvironment.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});
