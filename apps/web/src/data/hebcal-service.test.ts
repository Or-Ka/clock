import { describe, expect, it } from "vitest";

import { hebcalUrlForDate } from "./hebcal-service.js";

describe("hebcalUrlForDate", () => {
  it("requests Jewish holidays without modern Israeli commemorative days", () => {
    const url = new URL(hebcalUrlForDate("2026-07-14", "2026-07-15", "Asia/Jerusalem"));

    expect(url.searchParams.get("maj")).toBe("on");
    expect(url.searchParams.get("min")).toBe("on");
    expect(url.searchParams.get("mf")).toBe("on");
    expect(url.searchParams.get("nx")).toBe("on");
    expect(url.searchParams.get("ss")).toBe("on");
    expect(url.searchParams.get("o")).toBe("on");
    expect(url.searchParams.has("mod")).toBe(false);
  });
});
