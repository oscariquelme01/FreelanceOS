import { describe, expect, it } from "vitest";

import { calculateInvoice } from "./calculations";

describe("calculateInvoice", () => {
  it("applies IVA and IRPF to the subtotal", () => {
    const result = calculateInvoice([{ description: "Development", quantity: "2", unitPrice: "100" }], true, 2100, true, 1500);
    expect(result).toMatchObject({ subtotalCents: 20000, vatCents: 4200, withholdingCents: 3000, totalCents: 21200 });
  });

  it("rounds line totals to cents", () => {
    const result = calculateInvoice([{ description: "Hours", quantity: "1.333", unitPrice: "10" }], false, 2100, false, 1500);
    expect(result.totalCents).toBe(1333);
  });
});
