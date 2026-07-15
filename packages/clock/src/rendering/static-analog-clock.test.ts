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
    expect(container.querySelectorAll('[data-clock-part="clock-hour-number"]')).toHaveLength(0);
    expect(container.querySelector('[data-clock-part="outer-ring"]')).toBeNull();
    expect(container.querySelector('[data-clock-part="inner-ring"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-clock-part="ring-hour-label"][data-clock-ring="outer"]')).toHaveLength(24);
    expect(container.querySelectorAll('[data-clock-dial-label="roman"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-clock-dial-label="serif"]')).toHaveLength(12);
    expect(container.querySelectorAll('[data-clock-part="ring-hour-label"][data-clock-ring="inner"]')).toHaveLength(12);
    expect(container.querySelector('[data-clock-part="outer-frame"]')).not.toBeNull();
    expect(container.querySelector('[data-clock-part="wood-grain"]')).not.toBeNull();
    expect(container.querySelectorAll("linearGradient")).toHaveLength(0);
    expect(container.querySelector('[data-clock-part="face"]')?.getAttribute("fill")).toBe("#101b26");
    expect(container.querySelector('[data-clock-part="face"]')?.getAttribute("stroke")).toBe("#6f879b");
    expect(container.querySelector('[data-clock-part="hour-hand"]')?.getAttribute("stroke")).toBe("#eef5fb");
    expect(container.querySelector('[data-clock-part="minute-tick"]')?.getAttribute("stroke")).toBe("#7890a3");
    expect(container.querySelector('[data-clock-part="current-time-marker"]')).not.toBeNull();
    expect(svg?.dataset.clockHourAngle).toBe("195");
    expect(svg?.dataset.clockMinuteAngle).toBe("180");
  });

  it("places traditional outer labels and 24-hour inner labels on their rings", () => {
    const container = document.createElement("div");

    createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0 }
    });

    const outerTwelve = getRingLabel(container, "outer", "12");
    const outerSix = getRingLabel(container, "outer", "06");
    const innerZero = getRingLabel(container, "inner", "00");
    const innerEighteen = getRingLabel(container, "inner", "18");
    const romanTwelve = container.querySelector<SVGTextElement>('[data-clock-dial-label="roman"][data-clock-hour="12"]');

    expect(Number(outerTwelve.getAttribute("y"))).toBeLessThan(100);
    expect(Number(outerSix.getAttribute("y"))).toBeGreaterThan(100);
    expect(Number(innerZero.getAttribute("y"))).toBeLessThan(100);
    expect(Number(innerEighteen.getAttribute("y"))).toBeGreaterThan(100);
    expect(distanceFromPoint(outerTwelve)).toBeCloseTo(82, 0);
    expect(distanceFromPoint(innerZero)).toBeCloseTo(74, 0);
    expect(outerTwelve.textContent).toBe("12");
    expect(romanTwelve?.textContent).toBe("XII");
    expect(outerTwelve.getAttribute("fill")).toBe("#f7f1de");
    expect(outerTwelve.getAttribute("stroke")).toBe("#101b26");
    expect(innerZero.getAttribute("fill")).toBe("#b9c7d5");
    expect(innerZero.getAttribute("opacity")).toBe("0.28");
    expect(container.querySelector('[data-clock-part="inner-ring"]')?.getAttribute("stroke-width")).toBe("2.4");
    expect(container.querySelector('[data-clock-part="inner-ring"]')?.getAttribute("opacity")).toBe("0.46");
    expect(outerTwelve.hasAttribute("transform")).toBe(false);
    expect(innerZero.hasAttribute("transform")).toBe(false);
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
    expect(twelveTick.getAttribute("stroke-linecap")).toBe("butt");
    expect(Number(twelveTick.getAttribute("stroke-width"))).toBeLessThan(2);
    expect(distanceFromCenter(twelveTick, "x2", "y2")).toBeGreaterThan(distanceFromCenter(eventMarker, "data-event-angle"));
  });

  it("renders thin hands and a second hand", () => {
    const container = document.createElement("div");

    createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0, second: 15 }
    });

    expect(container.querySelector('[data-clock-part="hour-hand"]')?.getAttribute("stroke-width")).toBe("2.5");
    expect(container.querySelector('[data-clock-part="minute-hand"]')?.getAttribute("stroke-width")).toBe("1.65");
    expect(container.querySelector('[data-clock-part="second-hand"]')?.getAttribute("stroke-width")).toBe("0.55");
    expect(container.querySelector('[data-clock-part="second-hand"]')?.getAttribute("stroke-linecap")).toBe("round");
    expect(container.querySelector("svg")?.dataset.clockSecondAngle).toBe("90");
  });

  it("places the glowing current-time marker on the outer or inner time ring", () => {
    const container = document.createElement("div");
    const clock = createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0, second: 0 }
    });

    const marker = getCurrentTimeMarker(container);
    expect(marker.getAttribute("data-clock-ring")).toBe("outer");
    expect(container.querySelector("svg")?.dataset.activeRing).toBe("outer");
    expect(marker.getAttribute("data-clock-radius")).toBe("92");
    expect(marker.getAttribute("data-clock-angle")).toBe("0");
    expect(marker.querySelector('[data-clock-part="current-time-halo"]')).not.toBeNull();
    expect(marker.querySelector('[data-clock-part="current-time-core"]')).not.toBeNull();
    expect(marker.querySelector("title")?.textContent).toBe("זמן נוכחי 12:00:00");

    clock.setTime({ hour: 18, minute: 0, second: 0 });

    expect(marker.getAttribute("data-clock-ring")).toBe("inner");
    expect(container.querySelector("svg")?.dataset.activeRing).toBe("inner");
    expect(container.querySelector('[data-clock-part="inner-ring"]')?.getAttribute("stroke-width")).toBe("2.4");
    expect(container.querySelector('[data-clock-part="inner-ring"]')?.getAttribute("opacity")).toBe("0.46");
    expect(marker.getAttribute("data-clock-radius")).toBe("74");
    expect(marker.getAttribute("data-clock-angle")).toBe("180");
    expect(marker.querySelector("title")?.textContent).toBe("זמן נוכחי 18:00:00");
  });

  it("renders red zmanit ticks with index and exact time tooltips", () => {
    const container = document.createElement("div");
    const clock = createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0 },
      zmanitTicks: [
        { index: 1, hour: 6, minute: 45, second: 25 },
        { index: 2, hour: 7, minute: 30, second: 50 }
      ]
    });

    expect(container.querySelectorAll('[data-clock-part="zmanit-tick"]')).toHaveLength(2);
    expect(container.querySelector('[data-zmanit-index="1"]')?.getAttribute("data-zmanit-time")).toBe("06:45:25");
    expect(container.querySelector('[data-zmanit-index="1"]')?.getAttribute("data-zmanit-title")).toBe("שעה זמנית 1");
    expect(container.querySelector('[data-zmanit-index="1"]')?.getAttribute("aria-label")).toBe("שעה זמנית 1, 06:45:25");
    expect(container.querySelector('[data-zmanit-index="1"] title')).toBeNull();
    expect(container.querySelector('[data-zmanit-index="1"] line')?.getAttribute("stroke")).toBe("#ff1f1f");
    expect(container.querySelector('[data-zmanit-index="1"] line')?.getAttribute("stroke-width")).toBe("0.85");

    clock.setZmanitTicks([{ index: 12, hour: 18, minute: 22, second: 10 }]);

    expect(container.querySelectorAll('[data-clock-part="zmanit-tick"]')).toHaveLength(1);
    expect(container.querySelector('[data-zmanit-index="12"]')?.getAttribute("aria-label")).toBe("שעה זמנית 12, 18:22:10");
  });

  it("moves night-range zmanit ticks inward without changing their clock angle", () => {
    const container = document.createElement("div");

    createStaticAnalogClock({
      container,
      time: { hour: 12, minute: 0 },
      zmanitTicks: [{ index: 1, hour: 5, minute: 45, second: 0 }]
    });

    const tick = container.querySelector('[data-zmanit-index="1"]');
    const line = tick?.querySelector("line") ?? null;

    expect(tick?.getAttribute("data-clock-ring")).toBe("inner");
    expect(tick?.getAttribute("data-clock-angle")).toBe("172.5");
    expect(distanceFromCenter(line, "x2", "y2")).toBeCloseTo(70, 0);
  });

  it("renders weekday, Hebrew date and Gregorian date in the center", () => {
    const container = document.createElement("div");

    createStaticAnalogClock({
      container,
      time: {
        hour: 12,
        minute: 0,
        dateDisplay: {
          weekday: "חמישי",
          torahReading: "פרשת פינחס",
          hebrewDate: "י״ז בתמוז תשפ״ו",
          observances: ["צום תמוז", "ג׳ בעומר"],
          gregorianDate: "2 ביולי 2026"
        }
      }
    });

    expect(container.querySelector('[data-clock-part="date-display"]')).not.toBeNull();
    expect(container.querySelector('[data-clock-part="weekday-label"]')?.textContent).toBe("חמישי");
    expect(container.querySelector('[data-clock-part="torah-reading-label"]')?.textContent).toBe("פרשת פינחס");
    expect(container.querySelector('[data-clock-part="hebrew-date-label"]')?.textContent).toBe("י״ז בתמוז תשפ״ו");
    expect(container.querySelector('[data-clock-part="observances-label"]')?.textContent).toBe("צום תמוזג׳ בעומר");
    expect(container.querySelector('[data-clock-part="gregorian-date-label"]')?.textContent).toBe("2 ביולי 2026");
    expect(container.querySelector('[data-clock-part="weekday-label"]')?.getAttribute("font-family")).toContain("Segoe UI");
    expect(container.querySelector('[data-clock-part="torah-reading-label"]')?.getAttribute("font-family")).toContain("Segoe UI");
    expect(container.querySelector('[data-clock-part="hebrew-date-label"]')?.getAttribute("font-family")).toContain("Segoe UI");
    expect(container.querySelector('[data-clock-part="observances-label"]')?.getAttribute("font-family")).toContain("Segoe UI");
    expect(container.querySelector('[data-clock-part="gregorian-date-label"]')?.getAttribute("font-family")).toContain("Segoe UI");
    expect(container.querySelector('[data-clock-part="hebrew-date-label"]')?.getAttribute("font-weight")).toBe("700");
    expect(container.querySelector('[data-clock-part="gregorian-date-label"]')?.getAttribute("font-weight")).toBe("700");
    expect(Number(container.querySelector('[data-clock-part="weekday-label"]')?.getAttribute("y"))).toBeLessThan(100);
    expect(Number(container.querySelector('[data-clock-part="gregorian-date-label"]')?.getAttribute("y"))).toBeGreaterThan(100);
  });

  it("keeps the night weekday line clear of the Torah reading", () => {
    const container = document.createElement("div");

    const clock = createStaticAnalogClock({
      container,
      time: {
        hour: 22,
        minute: 0,
        dateDisplay: {
          weekday: "חמישי (ליל שישי)",
          torahReading: "פרשת דברים",
          hebrewDate: "אור לי״ח בתמוז תשפ״ו",
          gregorianDate: "2 ביולי 2026"
        }
      }
    });

    const weekdayLabel = container.querySelector('[data-clock-part="weekday-label"]');
    const torahReadingLabel = container.querySelector('[data-clock-part="torah-reading-label"]');
    const lines = Array.from(weekdayLabel?.querySelectorAll("tspan") ?? []);

    expect(lines).toHaveLength(2);
    expect(lines[0]?.textContent).toBe("חמישי");
    expect(lines[1]?.textContent).toBe("(ליל שישי)");
    expect(lines[1]?.getAttribute("dy")).toBe("6.5");
    expect(lines[1]?.getAttribute("font-size")).toBe("4.4");
    const nightLineY = Number(weekdayLabel?.getAttribute("y")) + Number(lines[1]?.getAttribute("dy"));
    expect(Number(torahReadingLabel?.getAttribute("y")) - nightLineY).toBeGreaterThanOrEqual(8);

    clock.setTime({
      hour: 10,
      minute: 0,
      dateDisplay: {
        weekday: "שישי",
        torahReading: "פרשת דברים",
        hebrewDate: "י״ח בתמוז תשפ״ו",
        gregorianDate: "3 ביולי 2026"
      }
    });

    expect(weekdayLabel?.getAttribute("y")).toBe("61");
    expect(weekdayLabel?.querySelectorAll("tspan")).toHaveLength(0);
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
    expect(container.querySelectorAll('[data-clock-part="event-label"]')).toHaveLength(0);
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-clock-ring")).toBe("outer");
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-angle")).toBe("20");
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-display-angle")).toBe("200");
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-layer-id")).toBe("day-times");
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-layer-kind")).toBe("day-times");
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-title")).toBe("sunrise");
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-time")).toBe("06:00");
    expect(container.querySelector('[data-event-id="sunrise"]')?.getAttribute("data-event-layer-title")).toBe("זמני היום");
    expect(container.querySelector('[data-event-id="sunrise"] title')).toBeNull();
    expect(container.querySelector('[data-event-id="sunrise"] line')?.getAttribute("stroke")).toBe("#ffd400");
    expect(container.querySelector('[data-event-id="sunrise"] line')?.getAttribute("stroke-width")).toBe("1.55");
    expect(container.querySelector('[data-event-id="sunrise"] circle')).toBeNull();

    clock.setEvents([
      resolvedEvent("night", "custom", "inner", 180, "future"),
      resolvedEvent("sunset", "sunset", "outer", 355, "future")
    ]);

    expect(container.querySelector("svg")).toBe(svg);
    expect(container.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(2);
    expect(svg?.dataset.clockEventCount).toBe("2");
    expect(container.querySelector('[data-event-id="night"]')?.getAttribute("data-clock-ring")).toBe("inner");
    expect(container.querySelector('[data-event-id="night"]')?.getAttribute("data-event-angle")).toBe("180");
    expect(container.querySelector('[data-event-id="night"]')?.getAttribute("data-event-display-angle")).toBe("0");
    expect(distanceFromCenter(container.querySelector('[data-event-id="night"] line'), "x2", "y2")).toBeCloseTo(73, 0);
    expect(container.querySelector('[data-event-id="sunset"] line')?.getAttribute("stroke")).toBe("#ff4fd8");
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

function getRingLabel(container: HTMLElement, ring: ResolvedInstantEvent["ring"], hour: string): SVGTextElement {
  const label = container.querySelector<SVGTextElement>(
    `[data-clock-part="ring-hour-label"][data-clock-ring="${ring}"][data-clock-hour="${hour}"]`
  );
  if (!label) {
    throw new Error(`Missing ${ring} ring label ${hour}.`);
  }
  return label;
}

function getCurrentTimeMarker(container: HTMLElement): SVGGElement {
  const marker = container.querySelector<SVGGElement>('[data-clock-part="current-time-marker"]');
  if (!marker) {
    throw new Error("Missing current-time marker.");
  }
  return marker;
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

function distanceFromPoint(element: SVGTextElement): number {
  const x = Number(element.getAttribute("x"));
  const y = Number(element.getAttribute("y"));
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
    status,
    layerId: "day-times",
    layerTitle: "זמני היום",
    layerKind: "day-times"
  };
}
