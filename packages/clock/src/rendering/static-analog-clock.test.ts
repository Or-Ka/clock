// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ResolvedInstantEvent } from "../events/event-model.js";
import { createStaticAnalogClock } from "./static-analog-clock.js";

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];

  disconnect = vi.fn();
  observe = vi.fn();

  constructor(_callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }
}

const originalResizeObserver = globalThis.ResizeObserver;

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
  TestResizeObserver.instances = [];
});

describe("createStaticAnalogClock", () => {
  it("renders a static SVG clock with hour ticks and hands", () => {
    const container = document.createElement("div");

    createStaticAnalogClock({
      container,
      time: { hour: 6, minute: 30 }
    });

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 200 200");
    expect(container.querySelectorAll('[data-clock-part="hour-tick"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-clock-part="ring-hour-label"][data-clock-ring="outer"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-clock-part="ring-hour-label"][data-clock-ring="inner"]')).toHaveLength(12);
    expect(svg?.dataset.clockHourAngle).toBe("195");
    expect(svg?.dataset.clockMinuteAngle).toBe("180");
  });

  it("updates hands with setTime without replacing the SVG element", () => {
    const container = document.createElement("div");
    const clock = createStaticAnalogClock({
      container,
      time: { hour: 3, minute: 0 }
    });
    const svg = container.querySelector("svg");
    const hourHand = container.querySelector('[data-clock-part="hour-hand"]');

    clock.setTime({ hour: 15, minute: 45 });

    expect(container.querySelector("svg")).toBe(svg);
    expect(container.querySelector('[data-clock-part="hour-hand"]')).toBe(hourHand);
    expect(svg?.dataset.clockHourAngle).toBe("112.5");
    expect(svg?.dataset.clockMinuteAngle).toBe("270");
  });

  it("renders events in their resolved rings and updates them without replacing the SVG", () => {
    const container = document.createElement("div");
    const clock = createStaticAnalogClock({
      container,
      time: { hour: 7, minute: 0 },
      events: [resolvedEvent("sunrise", "sunrise", "outer", 20, "next")]
    });
    const svg = container.querySelector("svg");

    expect(container.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(1);
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-clock-ring")).toBe("outer");

    clock.setEvents([
      resolvedEvent("night", "custom", "inner", 180, "future"),
      resolvedEvent("sunset", "sunset", "outer", 355, "future")
    ]);

    expect(container.querySelector("svg")).toBe(svg);
    expect(container.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(2);
    expect(svg?.dataset.clockEventCount).toBe("2");
    expect(container.querySelector('[data-event-id="night"]')?.getAttribute("data-clock-ring")).toBe("inner");
  });

  it("rejects invalid initial and update times", () => {
    const container = document.createElement("div");

    expect(() =>
      createStaticAnalogClock({
        container,
        time: { hour: 24, minute: 0 }
      })
    ).toThrow(RangeError);

    const clock = createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0 }
    });

    expect(() => clock.setTime({ hour: 12, minute: 60 })).toThrow(RangeError);
  });

  it("observes resize and cleans up on destroy", () => {
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
    const container = document.createElement("div");

    const clock = createStaticAnalogClock({
      container,
      time: { hour: 0, minute: 0 }
    });
    const observer = TestResizeObserver.instances[0];

    expect(observer?.observe).toHaveBeenCalledWith(container);
    clock.destroy();

    expect(observer?.disconnect).toHaveBeenCalled();
    expect(container.children).toHaveLength(0);
  });

  it("allows destroy to be called more than once", () => {
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
    const container = document.createElement("div");
    const clock = createStaticAnalogClock({
      container,
      time: { hour: 0, minute: 0 }
    });
    const observer = TestResizeObserver.instances[0];

    clock.destroy();
    clock.destroy();

    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
    expect(container.children).toHaveLength(0);
  });

  it("does not allow setTime after destroy", () => {
    const container = document.createElement("div");
    const clock = createStaticAnalogClock({
      container,
      time: { hour: 0, minute: 0 }
    });

    clock.destroy();

    expect(() => clock.setTime({ hour: 1, minute: 0 })).toThrow("destroyed");
  });

  it("does not allow setEvents after destroy", () => {
    const container = document.createElement("div");
    const clock = createStaticAnalogClock({
      container,
      time: { hour: 0, minute: 0 }
    });

    clock.destroy();

    expect(() => clock.setEvents([])).toThrow("destroyed");
  });

  it("does not allow setTime after the SVG is detached externally", () => {
    const container = document.createElement("div");
    const clock = createStaticAnalogClock({
      container,
      time: { hour: 0, minute: 0 }
    });

    container.replaceChildren();

    expect(() => clock.setTime({ hour: 1, minute: 0 })).toThrow("detached");
  });

  it("supports more than one clock in the same document", () => {
    const firstContainer = document.createElement("div");
    const secondContainer = document.createElement("div");

    createStaticAnalogClock({
      container: firstContainer,
      time: { hour: 0, minute: 0 }
    });
    createStaticAnalogClock({
      container: secondContainer,
      time: { hour: 3, minute: 0 }
    });

    expect(firstContainer.querySelector("svg")?.dataset.clockHourAngle).toBe("0");
    expect(secondContainer.querySelector("svg")?.dataset.clockHourAngle).toBe("90");
  });

  it("rejects a second active clock in the same container", () => {
    const container = document.createElement("div");
    const firstClock = createStaticAnalogClock({
      container,
      time: { hour: 0, minute: 0 }
    });
    const firstSvg = container.querySelector("svg");

    expect(() =>
      createStaticAnalogClock({
        container,
        time: { hour: 1, minute: 0 }
      })
    ).toThrow("already exists");
    expect(container.querySelector("svg")).toBe(firstSvg);

    firstClock.destroy();
    expect(() =>
      createStaticAnalogClock({
        container,
        time: { hour: 1, minute: 0 }
      })
    ).not.toThrow();
  });

  it("restores container content if creation fails during resize setup", () => {
    class ThrowingResizeObserver {
      disconnect = vi.fn();

      observe(): void {
        throw new Error("resize setup failed");
      }
    }

    globalThis.ResizeObserver = ThrowingResizeObserver as unknown as typeof ResizeObserver;
    const container = document.createElement("div");
    const existing = document.createElement("span");
    existing.textContent = "existing";
    container.append(existing);

    expect(() =>
      createStaticAnalogClock({
        container,
        time: { hour: 0, minute: 0 }
      })
    ).toThrow("resize setup failed");
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(existing);

    globalThis.ResizeObserver = originalResizeObserver;
    expect(() =>
      createStaticAnalogClock({
        container,
        time: { hour: 1, minute: 0 }
      })
    ).not.toThrow();
  });
});

function resolvedEvent(
  id: string,
  kind: ResolvedInstantEvent["kind"],
  ring: ResolvedInstantEvent["ring"],
  angle: number,
  status: ResolvedInstantEvent["status"]
): ResolvedInstantEvent {
  return {
    id,
    type: "instant",
    kind,
    title: id,
    hour: 6,
    minute: 0,
    ring,
    angle,
    status
  };
}
