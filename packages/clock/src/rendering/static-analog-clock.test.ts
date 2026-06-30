// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createStaticAnalogClock } from "./static-analog-clock.js";

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];

  disconnect = vi.fn();
  observe = vi.fn();

  constructor(_callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }
}

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
    const previousResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
    TestResizeObserver.instances = [];
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
    globalThis.ResizeObserver = previousResizeObserver;
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
});
