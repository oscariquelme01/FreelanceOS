import { describe, expect, it } from "vitest";

import { addWorkdaysIso, contactedDateAfterStatusChange, followUpState, todayIso } from "./outreach";

describe("outreach follow-ups", () => {
  it("classifies follow-up urgency against an ISO date", () => {
    expect(followUpState(null, "2026-10-06")).toBe("none");
    expect(followUpState("2026-10-05", "2026-10-06")).toBe("overdue");
    expect(followUpState("2026-10-06", "2026-10-06")).toBe("today");
    expect(followUpState("2026-10-07", "2026-10-06")).toBe("upcoming");
  });

  it("formats the current day as an ISO date", () => {
    expect(todayIso(new Date("2026-10-06T18:30:00Z"))).toBe("2026-10-06");
  });

  it("defaults follow-ups five weekdays after creation", () => {
    expect(addWorkdaysIso(new Date("2026-10-05T10:00:00Z"), 5)).toBe("2026-10-12");
    expect(addWorkdaysIso(new Date("2026-10-09T10:00:00Z"), 5)).toBe("2026-10-16");
  });

  it("records the first contacted date only for the lead-to-contacted transition", () => {
    expect(contactedDateAfterStatusChange("lead", "contacted", null, "2026-10-06")).toBe("2026-10-06");
    expect(contactedDateAfterStatusChange("lead", "replied", null, "2026-10-06")).toBeNull();
    expect(contactedDateAfterStatusChange("contacted", "replied", "2026-10-01", "2026-10-06")).toBe("2026-10-01");
  });
});
