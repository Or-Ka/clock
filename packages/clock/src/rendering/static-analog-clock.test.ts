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
    expect(container.querySelectorAll("[data-clock-tick-kind]")).toHaveLength(60);
    expect(container.querySelectorAll('[data-clock-part="hour-tick"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-clock-part="minute-tick"]')).toHaveLength(48);
    expect(container.querySelectorAll('[data-clock-part="clock-hour-number"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-clock-part="ring-hour-label"][data-clock-ring="outer"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-clock-part="ring-hour-label"][data-clock-ring="inner"]')).toHaveLength(12);
    expect(svg?.dataset.clockHourAngle).toBe("195");
    expect(svg?.dataset.clockMinuteAngle).toBe("180");
  });

  it("places central clock numbers in the regular analog-clock direction", () => {
    const container = document.createElement("div");

    createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0 }
    });

    const twelve = getClockNumber(container, 12);
    const three = getClockNumber(container, 3);
    const six = getClockNumber(container, 6);
    const nine = getClockNumber(container, 9);

    expect(Number(twelve.getAttribute("y"))).toBeLessThan(100);
    expect(Number(three.getAttribute("x"))).toBeGreaterThan(100);
    expect(Number(six.getAttribute("y"))).toBeGreaterThan(100);
    expect(Number(nine.getAttribute("x"))).toBeLessThan(100);
    expect(twelve.hasAttribute("transform")).toBe(false);
    expect(three.hasAttribute("transform")).toBe(false);
    expect(six.hasAttribute("transform")).toBe(false);
    expect(nine.hasAttribute("transform")).toBe(false);
  });

  it("keeps minute and hour ticks on the outermost circle", () => {
    const container = document.createElement("div");

    createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0 },
      events: [resolvedEvent("outer-event", "custom", "outer", 0, "next")]
    });

    const twelveTick = getTick(container, 0);
    const threeTick = getTick(container, 15);
    const sixTick = getTick(container, 30);
    const nineTick = getTick(container, 45);
    const eventMarker = container.querySelector<SVGGElement>('[data-clock-part="event-marker"]');

    expect(Number(twelveTick.getAttribute("y2"))).toBeLessThan(Number(twelveTick.getAttribute("y1")));
    expect(Number(sixTick.getAttribute("y2"))).toBeGreaterThan(Number(sixTick.getAttribute("y1")));
    expect(Number(threeTick.getAttribute("x2"))).toBeGreaterThan(Number(threeTick.getAttribute("x1")));
    expect(Number(nineTick.getAttribute("x2"))).toBeLessThan(Number(nineTick.getAttribute("x1")));
    expect(distanceFromCenter(twelveTick, "x2", "y2")).toBeGreaterThan(distanceFromCenter(eventMarker, "data-event-angle"));
  });

  it("renders visual transition markers between the night and day rings", () => {
    const container = document.createElement("div");

    createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0 }
    });

    expect(container.querySelector('[data-clock-part="transition-marker"][data-transition="morning"]')).not.toBeNull();
    expect(container.querySelector('[data-clock-part="transition-marker"][data-transition="evening"]')).not.toBeNull();
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
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-angle")).toBe("20");

    clock.setEvents([
      resolvedEvent("night", "custom", "inner", 180, "future"),
      resolvedEvent("sunset", "sunset", "outer", 355, "future")
    ]);

    expect(container.querySelector("svg")).toBe(svg);
    expect(container.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(2);
    expect(svg?.dataset.clockEventCount).toBe("2");
    expect(container.querySelector('[data-event-id="night"]')?.getAttribute("data-clock-ring")).toBe("inner");
    expect(container.querySelector('[data-event-id="night"]')?.getAttribute("data-event-angle")).toBe("180");
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

function getClockNumber(container: HTMLElement, number: number): SVGTextElement {
  const label = container.querySelector<SVGTextElement>(
    `[data-clock-part="clock-hour-number"][data-clock-hour-number="${number}"]`
  );
  if (!label) {
    throw new Error(`Missing clock number ${number}.`);
  }
  return label;
}

function getTick(container: HTMLElement, minute: number): SVGLineElement {
  const tick = container.querySelector<SVGLineElement>(`[data-clock-tick-minute="${minute}"]`);
  if (!tick) {
    throw new Error(`Missing tick ${minute}.`);
  }
  return tick;
}

function distanceFromCenter(
  element: Element | null,
  xAttribute: "x2" | "data-event-angle",
  yAttribute?: "y2"
): number {
  if (!element) {
    throw new Error("Missing element.");
  }
  if (xAttribute === "data-event-angle") {
    return 83;
  }
  const x = Number(element.getAttribute(xAttribute));
  const y = Number(element.getAttribute(yAttribute ?? "y2"));
  return Math.hypot(x - 100, y - 100);
}

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
