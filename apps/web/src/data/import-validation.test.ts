import { describe, expect, it } from "vitest";

import {
  assertImportPayloadWithinLimits,
  hasUniqueIds,
  isFiniteNumberInRange,
  isHexColor,
  isIntegerInRange,
  isSafeDisplayText,
  isSafeIdentifier
} from "./import-validation.js";

describe("import validation", () => {
  it("accepts bounded version-1-style JSON", () => {
    expect(() =>
      assertImportPayloadWithinLimits({ version: 1, personalEvents: [{ id: "event-1", title: "אירוע" }] })
    ).not.toThrow();
  });

  it("rejects oversized collections, deep nesting and prototype-oriented keys", () => {
    expect(() => assertImportPayloadWithinLimits(Array.from({ length: 501 }, () => 0))).toThrow("רשימה ארוכה מדי");

    let nested: unknown = "value";
    for (let index = 0; index < 22; index += 1) {
      nested = [nested];
    }
    expect(() => assertImportPayloadWithinLimits(nested)).toThrow("מקונן עמוק מדי");

    expect(() => assertImportPayloadWithinLimits(JSON.parse('{"__proto__":{"polluted":true}}'))).toThrow(
      "מפתח שאינו נתמך"
    );
  });

  it("validates identifiers, display text, numbers, colors and uniqueness", () => {
    expect(isSafeIdentifier("event-1")).toBe(true);
    expect(isSafeIdentifier(" event-1")).toBe(false);
    expect(isSafeDisplayText("אירוע", 18)).toBe(true);
    expect(isSafeDisplayText("x".repeat(19), 18)).toBe(false);
    expect(isIntegerInRange(23, 0, 23)).toBe(true);
    expect(isIntegerInRange(24, 0, 23)).toBe(false);
    expect(isFiniteNumberInRange(1.25, 0, 10_000)).toBe(true);
    expect(isFiniteNumberInRange(Number.NaN, 0, 10_000)).toBe(false);
    expect(isHexColor("#12aBcF")).toBe(true);
    expect(isHexColor("url(https://example.test/x)")).toBe(false);
    expect(hasUniqueIds([{ id: "a" }, { id: "b" }])).toBe(true);
    expect(hasUniqueIds([{ id: "a" }, { id: "a" }])).toBe(false);
  });
});
