import { z } from "zod";

import { outreachStatuses } from "./outreach";

const optionalString = z.string().trim().default("");

export const opportunityInputSchema = z.object({
  company: z.string().trim().min(1, "Company is required."),
  role: z.string().trim().min(1, "Role is required."),
  status: z.enum(outreachStatuses),
  source: optionalString,
  contactName: optionalString,
  contactEmail: z.union([z.literal(""), z.email("Enter a valid email address.")]).default(""),
  url: z.union([z.literal(""), z.url("Enter a complete URL.").refine((value) => value.startsWith("https://") || value.startsWith("http://"), "Use an HTTP or HTTPS URL.")]).default(""),
  contactedDate: z.union([z.literal(""), z.iso.date()]).default(""),
  followUpDate: z.union([z.literal(""), z.iso.date()]).default(""),
  notes: optionalString,
});
