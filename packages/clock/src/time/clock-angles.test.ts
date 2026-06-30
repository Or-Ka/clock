import { describe, expect, it } from "vitest";

import { clockHandAngles, hourAngle, minuteAngle } from "./clock-angles.js";

describe("clock angle mapping", () => {
  it.each([
    [{ hour: 0, minute: 0 }, { hourAngle: 0, minuteAngle: 0 }],
    [{ hour: 3, minute: 0 }, { hourAngle: 90, minuteAngle: 0 }],
    [{ hour: 6, minute: 30 }, { hourAngle: 195, minuteAngle: 180 }],
    [{ hour: 11, minute: 59 }, { hourAngle: 359.5, minuteAngle: 354 }],
    [{ hour: 12, minute: 0 }, { hourAngle: 0, minuteAngle: 0 }],
    [{ hour: 15, minute: 45 }, { hourAngle: 112.5, minuteAngle: 270 }]
  ])("maps %o to %o", (time, expected) => {
    expect(clockHandAngles(time)).toEqual(expected);
  });

  it("uses minute influence for the hour hand", () => {
    expect(hourAngle({ hour: 6, minute: 30 })).toBe(195);
  });

  it("maps minutes to six degrees each", () => {
    expect(minuteAngle(45)).toBe(270);
  });

  it.each([
    { hour: -1, minute: 0 },
    { hour: 24, minute: 0 },
    { hour: 1.5, minute: 0 },
    { hour: Number.NaN, minute: 0 },
    { hour: Number.POSITIVE_INFINITY, minute: 0 },
    { hour: Number.NEGATIVE_INFINITY, minute: 0 },
    { hour: 10, minute: -1 },
    { hour: 10, minute: 60 },
    { hour: 10, minute: 1.25 },
    { hour: 10, minute: Number.NaN },
    { hour: 10, minute: Number.POSITIVE_INFINITY },
    { hour: 10, minute: Number.NEGATIVE_INFINITY }
  ])("rejects invalid time %o", (time) => {
    expect(() => clockHandAngles(time)).toThrow(RangeError);
  });
});
