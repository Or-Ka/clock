// @ts-expect-error jsdom is already a dev dependency, but the project does not ship @types/jsdom.
import { JSDOM } from "jsdom";
import { Temporal } from "@js-temporal/polyfill";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FixedTimeSource, type EventLayerDefinition } from "@clock/clock";

import { createClockShellController } from "./clock-shell-controller.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createClockShellController", () => {
  it("creates one clock SVG and refresh does not duplicate it", () => {
    const harness = createHarness();

    harness.controller.start();
    expect(harness.mount.querySelectorAll("svg")).toHaveLength(1);
    expect(harness.mount.querySelectorAll('[data-clock-part="event-marker"]')).toHaveLength(1);

    harness.controller.refresh();
    expect(harness.mount.querySelectorAll("svg")).toHaveLength(1);

    harness.controller.destroy();
  });

  it("cleans up listeners, timers and observers idempotently", () => {
    vi.useFakeTimers();
    try {
      const harness = createHarness();

      harness.controller.start();
      harness.controller.start();
      harness.mount.dispatchEvent(new harness.window.MouseEvent("click", { bubbles: true }));
      expect(harness.onClockTargetClick).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(harness.onVisualTimerTick).toHaveBeenCalledTimes(1);

      harness.controller.destroy();
      harness.controller.destroy();
      harness.mount.dispatchEvent(new harness.window.MouseEvent("click", { bubbles: true }));
      vi.advanceTimersByTime(1000);

      expect(harness.onClockTargetClick).toHaveBeenCalledTimes(1);
      expect(harness.onVisualTimerTick).toHaveBeenCalledTimes(1);
      expect(harness.observers[0]?.disconnect).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("syncs marker visuals after event layer updates", () => {
    const harness = createHarness();
    harness.controller.start();

    harness.controller.setEventLayers([
      {
        id: "personal",
        title: "Personal",
        kind: "personal",
        enabled: true,
        events: [{ id: "second", type: "instant", kind: "sunset", title: "Second", hour: 15, minute: 30 }]
      }
    ]);
    harness.renderedEvents.set("second", {
      id: "second",
      kind: "sunset",
      title: "Second",
      hour: 15,
      minute: 30,
      ring: "outer",
      status: "future"
    });
    harness.controller.syncEventVisuals();

    const marker = harness.mount.querySelector<SVGGElement>('[data-event-id="second"]');
    expect(marker?.dataset.eventIcon).toBe("moon");
    expect(marker?.dataset.eventColor).toBe("#654321");

    harness.controller.destroy();
  });
});

type TestEvent = {
  readonly id: string;
  readonly kind: "sunrise" | "sunset" | "custom";
  readonly title: string;
  readonly hour: number;
  readonly minute: number;
  readonly ring: "outer" | "inner";
  readonly status: "past" | "next" | "future";
};

function createHarness(): {
  readonly window: Window & typeof globalThis;
  readonly mount: HTMLElement;
  readonly controller: ReturnType<typeof createClockShellController<TestEvent>>;
  readonly renderedEvents: Map<string, TestEvent>;
  readonly observers: Array<{ readonly disconnect: ReturnType<typeof vi.fn> }>;
  readonly onClockTargetClick: ReturnType<typeof vi.fn>;
  readonly onVisualTimerTick: ReturnType<typeof vi.fn>;
} {
  const dom = new JSDOM("<!doctype html><html><body><div id=\"clock\"></div></body></html>");
  const window = dom.window as unknown as Window & typeof globalThis;
  const document = window.document;
  vi.stubGlobal("document", document);
  vi.stubGlobal("window", window);
  const mount = document.querySelector<HTMLElement>("#clock");
  if (mount === null) {
    throw new Error("Missing test clock mount.");
  }

  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    callback(0);
    return 1;
  };
  window.cancelAnimationFrame = vi.fn();

  const observers: Array<{ readonly disconnect: ReturnType<typeof vi.fn> }> = [];
  class TestMutationObserver {
    readonly disconnect = vi.fn();

    constructor(readonly callback: MutationCallback) {}

    observe(): void {
      observers.push(this);
    }
  }

  const renderedEvents = new Map<string, TestEvent>([
    [
      "first",
      {
        id: "first",
        kind: "custom",
        title: "First",
        hour: 9,
        minute: 15,
        ring: "outer",
        status: "future"
      }
    ]
  ]);
  const eventLayers: readonly EventLayerDefinition[] = [
    {
      id: "personal",
      title: "Personal",
      kind: "personal",
      enabled: true,
      events: [{ id: "first", type: "instant", kind: "custom", title: "First", hour: 9, minute: 15 }]
    }
  ];
  const onClockTargetClick = vi.fn();
  const onVisualTimerTick = vi.fn();

  return {
    window,
    mount,
    renderedEvents,
    observers,
    onClockTargetClick,
    onVisualTimerTick,
    controller: createClockShellController<TestEvent>({
      document,
      window,
      MutationObserver: TestMutationObserver as unknown as typeof MutationObserver,
      elements: { mount },
      timeSource: new FixedTimeSource(Temporal.Instant.from("2026-07-07T09:00:00Z")),
      timeZone: "UTC",
      eventLayers,
      dateDisplayDetails: () => ({ observances: [] }),
      getRenderedEvent: (eventId) => renderedEvents.get(eventId),
      eventVisualForEvent(event) {
        if (event.kind === "sunset") {
          return { icon: "moon", color: "#654321" };
        }
        return { icon: "diamond", color: "#123456" };
      },
      onTooltipPointerOver: vi.fn(),
      onTooltipPointerMove: vi.fn(),
      onTooltipPointerOut: vi.fn(),
      onClockTargetClick,
      onClockContextMenu: vi.fn(),
      onDocumentMouseMove: vi.fn(),
      onVisualTimerTick
    })
  };
}
