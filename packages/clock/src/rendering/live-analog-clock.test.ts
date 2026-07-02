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

  it("renders initial events and updates them without replacing the SVG", () => {
    const container = document.createElement("div");
    const source = createMutableTimeSource("2026-06-30T08:00:00Z");
    const clock = createLiveAnalogClock({
      container,
      timeSource: source,
      timeZone: "UTC",
      scheduler: createManualScheduler(),
      events: [
        { id: "sunrise", type: "instant", kind: "sunrise", title: "Sunrise", hour: 5, minute: 40 },
        { id: "meeting", type: "instant", kind: "custom", title: "Meeting", hour: 9, minute: 0 }
      ]
    });
    const svg = container.querySelector("svg");

    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-clock-ring")).toBe("inner");
    expect(container.querySelector('[data-event-id="meeting"]')?.getAttribute("data-event-status")).toBe("next");

    clock.setEvents([{ id: "sunset", type: "instant", kind: "sunset", title: "Sunset", hour: 18, minute: 40 }]);

    expect(container.querySelector("svg")).toBe(svg);
    expect(container.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(1);
    expect(container.querySelector('[data-event-id="sunset"]')?.getAttribute("data-clock-ring")).toBe("inner");
  });

  it("renders event layers and allows a layer to be toggled off", () => {
    const container = document.createElement("div");
    const clock = createLiveAnalogClock({
      container,
      timeSource: createMutableTimeSource("2026-06-30T08:00:00Z"),
      timeZone: "UTC",
      scheduler: createManualScheduler(),
      eventLayers: [
        {
          id: "day-times",
          title: "זמני היום",
          kind: "day-times",
          enabled: true,
          events: [{ id: "sunrise", type: "instant", kind: "sunrise", title: "Sunrise", hour: 5, minute: 40 }]
        },
        {
          id: "personal",
          title: "אישי",
          kind: "personal",
          enabled: true,
          events: [{ id: "meeting", type: "instant", kind: "custom", title: "Meeting", hour: 9, minute: 0 }]
        }
      ]
    });
    const svg = container.querySelector("svg");

    expect(container.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(2);
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-layer-id")).toBe("day-times");

    clock.setEventLayers([
      {
        id: "day-times",
        title: "זמני היום",
        kind: "day-times",
        enabled: false,
        events: [{ id: "sunrise", type: "instant", kind: "sunrise", title: "Sunrise", hour: 5, minute: 40 }]
      },
      {
        id: "personal",
        title: "אישי",
        kind: "personal",
        enabled: true,
        events: [{ id: "meeting", type: "instant", kind: "custom", title: "Meeting", hour: 9, minute: 0 }]
      }
    ]);

    expect(container.querySelector("svg")).toBe(svg);
    expect(container.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(1);
    expect(container.querySelector('[data-event-id="sunrise"]')).toBeNull();
    expect(container.querySelector('[data-event-id="meeting"]')?.getAttribute("data-event-layer-id")).toBe("personal");
  });

  it("updates the night Hebrew date display when day-time events are loaded", () => {
    const container = document.createElement("div");
    const clock = createLiveAnalogClock({
      container,
      timeSource: createMutableTimeSource("2026-07-02T18:10:00Z"),
      timeZone: "Asia/Jerusalem",
      scheduler: createManualScheduler()
    });

    expect(container.querySelector('[data-clock-part="hebrew-date-label"]')?.textContent).not.toContain("אור ל");

    clock.setEventLayers([
      {
        id: "day-times",
        title: "זמני היום",
        kind: "day-times",
        enabled: true,
        events: [
          { id: "sunrise", type: "instant", kind: "sunrise", title: "זריחה", hour: 6, minute: 0 },
          { id: "sunset", type: "instant", kind: "sunset", title: "שקיעה", hour: 19, minute: 45 }
        ]
      }
    ]);

    const weekdayLines = Array.from(container.querySelectorAll('[data-clock-part="weekday-label"] tspan'));
    expect(weekdayLines[0]?.textContent).toBe("חמישי");
    expect(weekdayLines[1]?.textContent).toBe("(ליל שישי)");
    expect(container.querySelector('[data-clock-part="hebrew-date-label"]')?.textContent).toContain("אור לי״ח");
  });

  it("updates zmanit ticks without replacing the SVG", () => {
    const container = document.createElement("div");
    const clock = createLiveAnalogClock({
      container,
      timeSource: createMutableTimeSource("2026-06-30T08:00:00Z"),
      timeZone: "UTC",
      scheduler: createManualScheduler()
    });
    const svg = container.querySelector("svg");

    clock.setZmanitTicks([{ index: 1, hour: 6, minute: 45, second: 25 }]);

    expect(container.querySelector("svg")).toBe(svg);
    expect(container.querySelectorAll('[data-clock-part="zmanit-tick"]')).toHaveLength(1);
    expect(container.querySelector('[data-zmanit-index="1"] title')?.textContent).toBe("שעה זמנית 1, 06:45:25");
  });

  it("rejects invalid setEvents input without changing the rendered events", () => {
    const container = document.createElement("div");
    const clock = createLiveAnalogClock({
      container,
      timeSource: createMutableTimeSource("2026-06-30T08:00:00Z"),
      timeZone: "UTC",
      scheduler: createManualScheduler(),
      events: [{ id: "kept", type: "instant", kind: "custom", title: "Kept", hour: 10, minute: 0 }]
    });

    expect(() =>
      clock.setEvents([
        { id: "dup", type: "instant", kind: "custom", title: "One", hour: 10, minute: 0 },
        { id: "dup", type: "instant", kind: "custom", title: "Two", hour: 11, minute: 0 }
      ])
    ).toThrow("Duplicate");

    expect(container.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(1);
    expect(container.querySelector('[data-event-id="kept"]')).not.toBeNull();
  });

  it("recomputes event statuses when timezone changes", () => {
    const container = document.createElement("div");
    const clock = createLiveAnalogClock({
      container,
      timeSource: createMutableTimeSource("2026-06-30T19:30:00Z"),
      timeZone: "UTC",
      scheduler: createManualScheduler(),
      events: [
        { id: "evening", type: "instant", kind: "custom", title: "Evening", hour: 20, minute: 0 },
        { id: "late", type: "instant", kind: "custom", title: "Late", hour: 23, minute: 0 }
      ]
    });

    expect(container.querySelector('[data-event-id="evening"]')?.getAttribute("data-event-status")).toBe("next");

    clock.setTimeZone("Asia/Jerusalem");

    expect(container.querySelector('[data-event-id="evening"]')?.getAttribute("data-event-status")).toBe("past");
    expect(container.querySelector('[data-event-id="late"]')?.getAttribute("data-event-status")).toBe("next");
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

  it("rejects setEvents after destroy", () => {
    const clock = createLiveAnalogClock({
      container: document.createElement("div"),
      timeSource: createMutableTimeSource("2026-06-30T10:00:00Z"),
      timeZone: "UTC",
      scheduler: createManualScheduler()
    });

    clock.destroy();

    expect(() => clock.setEvents([])).toThrow("destroyed");
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
