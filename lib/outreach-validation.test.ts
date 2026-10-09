import { describe, expect, it } from "vitest";

import { opportunityInputSchema } from "./outreach-validation";

const validInput = {
  company: "Acme",
  role: "Frontend contract",
  status: "lead" as const,
  source: "LinkedIn",
  contactName: "",
  contactEmail: "",
  url: "",
  contactedDate: "",
  followUpDate: "",
  notes: "",
};

describe("outreach input validation", () => {
  it("allows optional contact details and URL to remain empty", () => {
    expect(opportunityInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("validates optional email and web URL values when present", () => {
    expect(opportunityInputSchema.safeParse({ ...validInput, contactEmail: "hello@example.com", url: "https://example.com/role" }).success).toBe(true);
    expect(opportunityInputSchema.safeParse({ ...validInput, contactEmail: "invalid" }).success).toBe(false);
    expect(opportunityInputSchema.safeParse({ ...validInput, url: "ftp://example.com/file" }).success).toBe(false);
  });
});
