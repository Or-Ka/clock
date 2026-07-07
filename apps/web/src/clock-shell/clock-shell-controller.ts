import {
  createLiveAnalogClock,
  type ClockDateDisplayDetails,
  type EventLayerDefinition,
  type LiveAnalogClock,
  type TimeSource,
  type ZmanitTick
} from "@clock/clock";

import { createClockIcon, type EventIconId } from "../ui/event-icons.js";

export type ClockShellElements = {
  readonly mount: HTMLElement;
};

export type ClockShellMarkerVisual = {
  readonly icon: EventIconId;
  readonly color: string;
};

export type ClockShellControllerDeps<TEvent> = {
  readonly document: Document;
  readonly window: Window;
  readonly MutationObserver: typeof MutationObserver;
  readonly elements: ClockShellElements;
  readonly timeSource: TimeSource;
  readonly timeZone: string;
  readonly eventLayers: readonly EventLayerDefinition[];
  readonly dateDisplayDetails: () => ClockDateDisplayDetails;
  readonly getRenderedEvent: (eventId: string) => TEvent | undefined;
  readonly eventVisualForEvent: (event: TEvent) => ClockShellMarkerVisual;
  readonly onTooltipPointerOver: (event: MouseEvent) => void;
  readonly onTooltipPointerMove: (event: MouseEvent) => void;
  readonly onTooltipPointerOut: (event: MouseEvent) => void;
  readonly onClockTargetClick: (event: MouseEvent) => void;
  readonly onClockContextMenu: (event: MouseEvent) => void;
  readonly onDocumentMouseMove: (event: MouseEvent) => void;
  readonly onVisualTimerTick: () => void;
};

export type ClockShellController = {
  start(): void;
  setTimeZone(timeZone: string): void;
  setEventLayers(eventLayers: readonly EventLayerDefinition[]): void;
  setZmanitTicks(ticks: readonly ZmanitTick[]): void;
  refresh(): void;
  syncEventVisuals(): void;
  destroy(): void;
};

export function createClockShellController<TEvent>(
  deps: ClockShellControllerDeps<TEvent>
): ClockShellController {
  const mount = deps.elements.mount;
  const cleanup: Array<() => void> = [];
  let started = false;
  let destroyed = false;
  let clockVisualSyncFrame: number | undefined;
  const clock: LiveAnalogClock = createLiveAnalogClock({
    container: mount,
    timeSource: deps.timeSource,
    timeZone: deps.timeZone,
    eventLayers: deps.eventLayers,
    dateDisplayDetails: deps.dateDisplayDetails
  });
  const clockEventObserver = new deps.MutationObserver(scheduleClockEventVisualSync);

  function addCleanup(cleanupEntry: () => void): void {
    cleanup.push(cleanupEntry);
  }

  function addEventListener<TEventObject extends Event>(
    target: EventTarget,
    type: string,
    listener: (event: TEventObject) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    const eventListener = listener as EventListener;
    target.addEventListener(type, eventListener, options);
    addCleanup(() => target.removeEventListener(type, eventListener, options));
  }

  function scheduleClockEventVisualSync(): void {
    if (clockVisualSyncFrame !== undefined) {
      return;
    }

    clockVisualSyncFrame = deps.window.requestAnimationFrame(() => {
      clockVisualSyncFrame = undefined;
      syncEventVisuals();
    });
  }

  function syncEventVisuals(): void {
    for (const marker of Array.from(mount.querySelectorAll<SVGGElement>('[data-clock-part="event-marker"]'))) {
      const eventId = marker.dataset.eventId;
      const event = eventId === undefined ? undefined : deps.getRenderedEvent(eventId);
      if (event === undefined) {
        continue;
      }

      const visual = deps.eventVisualForEvent(event);
      const line = marker.querySelector<SVGLineElement>("line");
      const existingSymbol = marker.querySelector('[data-clock-part="event-symbol"]');

      marker.dataset.eventIcon = visual.icon;
      marker.dataset.eventColor = visual.color;
      marker.style.setProperty("--event-marker-color", visual.color);
      line?.style.setProperty("stroke", visual.color);

      if (line === null) {
        continue;
      }

      const x = line.getAttribute("x2") ?? "100";
      const y = line.getAttribute("y2") ?? "100";
      if (existingSymbol !== null && existingSymbol.getAttribute("data-event-icon") === visual.icon) {
        existingSymbol.setAttribute("transform", `translate(${x} ${y}) scale(0.34) translate(-12 -12)`);
        existingSymbol.setAttribute("color", visual.color);
        continue;
      }

      existingSymbol?.remove();
      const symbol = createClockIcon(visual.icon, x, y, visual.color);
      symbol.dataset.eventIcon = visual.icon;
      marker.append(symbol);
    }
  }

  return {
    start() {
      if (started || destroyed) {
        return;
      }

      started = true;
      clockEventObserver.observe(mount, { childList: true, subtree: true });
      addCleanup(() => clockEventObserver.disconnect());
      addEventListener(mount, "pointerover", deps.onTooltipPointerOver);
      addEventListener(mount, "pointermove", deps.onTooltipPointerMove);
      addEventListener(mount, "pointerout", deps.onTooltipPointerOut);
      addEventListener(mount, "mouseover", deps.onTooltipPointerOver);
      addEventListener(mount, "mousemove", deps.onTooltipPointerMove);
      addEventListener(mount, "mouseout", deps.onTooltipPointerOut);
      addEventListener(mount, "click", deps.onClockTargetClick);
      addEventListener(mount, "contextmenu", deps.onClockContextMenu);
      addEventListener(deps.document, "mousemove", deps.onDocumentMouseMove);
      const visualTimer = deps.window.setInterval(deps.onVisualTimerTick, 1000);
      addCleanup(() => deps.window.clearInterval(visualTimer));
      clock.start();
      syncEventVisuals();
    },
    setTimeZone(timeZone: string) {
      clock.setTimeZone(timeZone);
    },
    setEventLayers(eventLayers: readonly EventLayerDefinition[]) {
      clock.setEventLayers(eventLayers);
    },
    setZmanitTicks(ticks: readonly ZmanitTick[]) {
      clock.setZmanitTicks(ticks);
    },
    refresh() {
      clock.refresh();
    },
    syncEventVisuals,
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      for (const cleanupEntry of cleanup.splice(0).reverse()) {
        cleanupEntry();
      }
      if (clockVisualSyncFrame !== undefined) {
        deps.window.cancelAnimationFrame(clockVisualSyncFrame);
        clockVisualSyncFrame = undefined;
      }
      clock.destroy();
    }
  };
}
