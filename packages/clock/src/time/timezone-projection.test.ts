import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import { projectInstantToStaticClockTime } from "./timezone-projection.js";

describe("projectInstantToStaticClockTime", () => {
  it("projects an instant through IANA time zones", () => {
    const instant = Temporal.Instant.from("2026-06-30T12:34:00Z");

    expect(projectInstantToStaticClockTime(instant, "UTC")).toEqual({ hour: 12, minute: 34 });
    expect(projectInstantToStaticClockTime(instant, "Asia/Jerusalem")).toEqual({ hour: 15, minute: 34 });
    expect(projectInstantToStaticClockTime(instant, "America/New_York")).toEqual({ hour: 8, minute: 34 });
    expect(projectInstantToStaticClockTime(instant, "Europe/London")).toEqual({ hour: 13, minute: 34 });
  });

  it("rejects invalid time zones", () => {
    const instant = Temporal.Instant.from("2026-06-30T12:34:00Z");

    expect(() => projectInstantToStaticClockTime(instant, "")).toThrow(RangeError);
    expect(() => projectInstantToStaticClockTime(instant, "Not/AZone")).toThrow(RangeError);
  });

  it("handles crossing midnight and another calendar day", () => {
    const instant = Temporal.Instant.from("2026-07-01T02:15:00Z");

    expect(projectInstantToStaticClockTime(instant, "America/New_York")).toEqual({ hour: 22, minute: 15 });
    expect(projectInstantToStaticClockTime(instant, "Asia/Jerusalem")).toEqual({ hour: 5, minute: 15 });
  });
});
