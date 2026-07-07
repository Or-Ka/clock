import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createClockApp, type ClockApp } from "./create-clock-app.js";

const appDir = dirname(fileURLToPath(import.meta.url));

describe("createClockApp", () => {
  it("returns the application lifecycle API", () => {
    const app: ClockApp = createClockApp({
      document: {} as Document,
      window: {} as Window
    });

    expect(app).toEqual({
      start: expect.any(Function),
      destroy: expect.any(Function)
    });
    expect(() => app.destroy()).not.toThrow();
    expect(() => app.destroy()).not.toThrow();
  });

  it("guards start and destroy while delegating runtime cleanup", () => {
    const source = readFileSync(join(appDir, "create-clock-app.ts"), "utf8");

    expect(source).toContain("if (destroyRuntime !== undefined)");
    expect(source).toContain("destroyRuntime = startClockApp(deps)");
    expect(source).toContain("destroyRuntime = undefined");
    expect(source).toContain("lifecycle.destroy()");
    expect(source).toContain("return destroyClock");
  });
});
