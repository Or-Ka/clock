import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import { projectInstantToStaticClockTime } from "./timezone-projection.js";

describe("projectInstantToStaticClockTime", () => {
  it("projects an instant through IANA time zones", () => {
    const instant = Temporal.Instant.from("2026-06-30T12:34:00Z");

    expect(projectInstantToStaticClockTime(instant, "UTC")).toMatchObject({ hour: 12, minute: 34, second: 0 });
    expect(projectInstantToStaticClockTime(instant, "Asia/Jerusalem")).toMatchObject({ hour: 15, minute: 34, second: 0 });
    expect(projectInstantToStaticClockTime(instant, "America/New_York")).toMatchObject({ hour: 8, minute: 34, second: 0 });
    expect(projectInstantToStaticClockTime(instant, "Europe/London")).toMatchObject({ hour: 13, minute: 34, second: 0 });
  });

  it("adds Hebrew and Gregorian date display text for the selected time zone", () => {
    const instant = Temporal.Instant.from("2026-07-02T12:34:00Z");
    const projected = projectInstantToStaticClockTime(instant, "Asia/Jerusalem");

    expect(projected.dateDisplay?.weekday).toBeTruthy();
    expect(projected.dateDisplay?.hebrewDate).toContain("תשפ״ו");
    expect(projected.dateDisplay?.hebrewDate).toContain("ב");
    expect(projected.dateDisplay?.hebrewDate).not.toMatch(/\d/);
    expect(projected.dateDisplay?.gregorianDate).toContain("יולי");
    expect(projected.dateDisplay?.gregorianDate).toContain("2026");
  });

  it("rejects invalid time zones", () => {
    const instant = Temporal.Instant.from("2026-06-30T12:34:00Z");

    expect(() => projectInstantToStaticClockTime(instant, "")).toThrow(RangeError);
    expect(() => projectInstantToStaticClockTime(instant, "Not/AZone")).toThrow(RangeError);
  });

  it("handles crossing midnight and another calendar day", () => {
    const instant = Temporal.Instant.from("2026-07-01T02:15:00Z");

    expect(projectInstantToStaticClockTime(instant, "America/New_York")).toMatchObject({ hour: 22, minute: 15, second: 0 });
    expect(projectInstantToStaticClockTime(instant, "Asia/Jerusalem")).toMatchObject({ hour: 5, minute: 15, second: 0 });
  });
});
