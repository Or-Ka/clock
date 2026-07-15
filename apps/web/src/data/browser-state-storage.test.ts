import { describe, expect, it, vi } from "vitest";

import { loadStoredJson, saveStoredJson } from "./browser-state-storage.js";

describe("browser state storage", () => {
  it("round-trips JSON state", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value))
    } as unknown as Storage;

    expect(saveStoredJson(storage, "clock-state", { location: "tel-aviv", events: [] })).toBe(true);
    expect(loadStoredJson(storage, "clock-state")).toEqual({ location: "tel-aviv", events: [] });
  });

  it("falls back safely when stored JSON is invalid or storage is unavailable", () => {
    const invalidJsonStorage = {
      getItem: vi.fn(() => "{invalid")
    } as unknown as Storage;
    const unavailableStorage = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked");
      })
    } as unknown as Storage;

    expect(loadStoredJson(invalidJsonStorage, "clock-state")).toBeUndefined();
    expect(loadStoredJson(unavailableStorage, "clock-state")).toBeUndefined();
    expect(saveStoredJson(unavailableStorage, "clock-state", {})).toBe(false);
  });
});
