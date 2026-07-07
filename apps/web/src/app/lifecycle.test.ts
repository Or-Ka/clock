import { describe, expect, it, vi } from "vitest";

import { createLifecycleRegistry } from "./lifecycle.js";

describe("createLifecycleRegistry", () => {
  it("runs registered cleanups once in reverse order", () => {
    const lifecycle = createLifecycleRegistry();
    const calls: string[] = [];

    lifecycle.add(() => calls.push("first"));
    lifecycle.add(() => calls.push("second"));

    lifecycle.destroy();
    lifecycle.destroy();

    expect(calls).toEqual(["second", "first"]);
  });

  it("runs cleanup immediately when registered after destroy", () => {
    const lifecycle = createLifecycleRegistry();
    const cleanup = vi.fn();

    lifecycle.destroy();
    lifecycle.add(cleanup);

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
