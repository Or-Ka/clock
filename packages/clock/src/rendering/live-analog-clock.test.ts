// @vitest-environment jsdom

import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it, vi } from "vitest";

import type { ClockScheduler } from "../time/clock-scheduler.js";
import type { TimeSource } from "../time/time-source.js";
import { createLiveAnalogClock } from "./live-analog-clock.js";

describe("createLiveAnalogClock", () => {
  it("renders once on creation without starting the scheduler", () => {
    const container = document.createElement("div");
    const scheduler = createManualScheduler();

    createLiveAnalogClock({
      container,
      timeSource: createMutableTimeSource("2026-06-30T10:00:00Z"),
      timeZone: "UTC",
      scheduler
    });

    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(scheduler.start).not.toHaveBeenCalled();
  });

  it("starts, stops and refreshes manually while stopped", () => {
    const container = document.createElement("div");
    const source = createMutableTimeSource("2026-06-30T10:00:00Z");
    const scheduler = createManualScheduler();
    const clock = createLiveAnalogClock({ container, timeSource: source, timeZone: "UTC", scheduler });

    clock.start();
    expect(scheduler.start).toHaveBeenCalledTimes(1);

    source.instant = Temporal.Instant.from("2026-06-30T11:20:00Z");
    clock.stop();
    clock.refresh();

    expect(scheduler.stop).toHaveBeenCalledTimes(1);
    expect(container.querySelector("svg")?.dataset.clockHourAngle).toBe("340");
  });

  it("uses the scheduler callback to update the existing SVG", () => {
    const container = document.createElement("div");
    const source = createMutableTimeSource("2026-06-30T03:00:00Z");
    const scheduler = createManualScheduler();
    const clock = createLiveAnalogClock({ container, timeSource: source, timeZone: "UTC", scheduler });
    const svg = container.querySelector("svg");

    clock.start();
    source.instant = Temporal.Instant.from("2026-06-30T04:30:00Z");
    scheduler.tick();

    expect(container.querySelector("svg")).toBe(svg);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(svg?.dataset.clockHourAngle).toBe("135");
    expect(svg?.dataset.clockMinuteAngle).toBe("180");
  });

  it("changes timezone and rejects invalid time zones without changing the previous one", () => {
    const container = document.createElement("div");
    const source = createMutableTimeSource("2026-06-30T12:00:00Z");
    const clock = createLiveAnalogClock({
      container,
      timeSource: source,
      timeZone: "UTC",
      scheduler: createManualScheduler()
    });

    clock.setTimeZone("Asia/Jerusalem");
    expect(container.querySelector("svg")?.dataset.clockHourAngle).toBe("90");

    expect(() => clock.setTimeZone("Not/AZone")).toThrow(RangeError);

    source.instant = Temporal.Instant.from("2026-06-30T13:00:00Z");
    clock.refresh();

    expect(container.querySelector("svg")?.dataset.clockHourAngle).toBe("120");
  });

  it("destroys scheduler and static clock idempotently", () => {
    const container = document.createElement("div");
    const scheduler = createManualScheduler();
    const clock = createLiveAnalogClock({
      container,
      timeSource: createMutableTimeSource("2026-06-30T10:00:00Z"),
      timeZone: "UTC",
      scheduler
    });

    clock.destroy();
    clock.destroy();

    expect(scheduler.destroy).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("rejects setTimeZone after destroy", () => {
    const clock = createLiveAnalogClock({
      container: document.createElement("div"),
      timeSource: createMutableTimeSource("2026-06-30T10:00:00Z"),
      timeZone: "UTC",
      scheduler: createManualScheduler()
    });

    clock.destroy();

    expect(() => clock.setTimeZone("UTC")).toThrow("destroyed");
  });
});

function createMutableTimeSource(value: string): TimeSource & { instant: Temporal.Instant } {
  return {
    instant: Temporal.Instant.from(value),
    now() {
      return this.instant;
    }
  };
}

function createManualScheduler(): ClockScheduler & {
  readonly start: ReturnType<typeof vi.fn>;
  readonly stop: ReturnType<typeof vi.fn>;
  readonly destroy: ReturnType<typeof vi.fn>;
  tick(): void;
} {
  let callback: (() => void) | undefined;
  let destroyed = false;

  return {
    start: vi.fn((nextCallback: () => void) => {
      if (destroyed) {
        throw new Error("destroyed");
      }
      callback = nextCallback;
      nextCallback();
    }),
    stop: vi.fn(() => {
      callback = undefined;
    }),
    destroy: vi.fn(() => {
      callback = undefined;
      destroyed = true;
    }),
    tick() {
      callback?.();
    }
  };
}
