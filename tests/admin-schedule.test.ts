import { describe, expect, it } from "vitest";
import { scheduledInstant, scheduleLabel } from "../src/components/admin/schedule";

describe("editorial publication scheduling", () => {
  it("stores Karachi wall-clock time as the corresponding UTC instant", () => {
    expect(scheduledInstant("2026-10-02T09:30", "Asia/Karachi")).toBe("2026-10-02T04:30:00.000Z");
    expect(scheduleLabel("2026-10-02T04:30:00.000Z", "Asia/Karachi")).toContain("GMT+05:00");
  });
  it("accounts for daylight saving in the publication timezone", () => {
    expect(scheduledInstant("2026-07-01T09:00", "America/New_York")).toBe("2026-07-01T13:00:00.000Z");
    expect(scheduledInstant("2026-12-01T09:00", "America/New_York")).toBe("2026-12-01T14:00:00.000Z");
  });
  it("rejects skipped spring-forward times rather than scheduling a different local time", () => {
    expect(scheduledInstant("2026-03-08T02:30", "America/New_York")).toBeNull();
  });
  it("rejects malformed dates and invalid timezones", () => {
    expect(scheduledInstant("2026-02-30T09:00", "Asia/Karachi")).toBeNull();
    expect(scheduledInstant("2026-01-10T24:00", "Asia/Karachi")).toBeNull();
    expect(scheduledInstant("2026-01-10T09:00", "Invalid/Zone")).toBeNull();
  });
});
