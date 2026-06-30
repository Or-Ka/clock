import { describe, expect, it } from "vitest";

import type { ClockContext } from "./clock-context.js";

describe("ClockContext", () => {
  it("keeps locale and time zone as explicit context", () => {
    const context: ClockContext = {
      locale: "he-IL",
      timeZone: "Asia/Jerusalem"
    };

    expect(context).toEqual({
      locale: "he-IL",
      timeZone: "Asia/Jerusalem"
    });
  });
});
