import { resolveEventLayers, type EventLayerDefinition, type InstantEventDefinition } from "../events/event-model.js";
import type { ClockScheduler } from "../time/clock-scheduler.js";
import { MinuteBoundaryClockScheduler } from "../time/clock-scheduler.js";
import type { StaticClockTime } from "../time/static-clock-time.js";
import type { TimeSource } from "../time/time-source.js";
import { projectInstantToStaticClockTime } from "../time/timezone-projection.js";
import { createStaticAnalogClock, type StaticAnalogClock } from "./static-analog-clock.js";

export interface LiveAnalogClockOptions {
  readonly container: HTMLElement;
  readonly timeSource: TimeSource;
  readonly timeZone: string;
  readonly scheduler?: ClockScheduler;
  readonly events?: readonly InstantEventDefinition[];
  readonly eventLayers?: readonly EventLayerDefinition[];
}

export interface LiveAnalogClock {
  start(): void;
  stop(): void;
  refresh(): void;
  setTimeZone(timeZone: string): void;
  setEvents(events: readonly InstantEventDefinition[]): void;
  setEventLayers(eventLayers: readonly EventLayerDefinition[]): void;
  destroy(): void;
}

export function createLiveAnalogClock(options: LiveAnalogClockOptions): LiveAnalogClock {
  let timeZone = options.timeZone;
  let eventLayers = initialEventLayers(options);
  let destroyed = false;
  let secondTimer: ReturnType<typeof setInterval> | undefined;
  const scheduler = options.scheduler ?? new MinuteBoundaryClockScheduler();
  const initialTime = projectInstantToStaticClockTime(options.timeSource.now(), timeZone);
  const staticClock = createStaticAnalogClock({
    container: options.container,
    time: initialTime,
    events: resolveEventLayers(eventLayers, initialTime)
  });

  const ensureActive = (action: string): void => {
    if (destroyed) {
      throw new Error(`Cannot ${action} a destroyed live analog clock.`);
    }
  };

  const refresh = (): void => {
    ensureActive("refresh");
    applyCurrentState(projectInstantToStaticClockTime(options.timeSource.now(), timeZone), staticClock, eventLayers);
  };

  const startSecondTimer = (): void => {
    if (secondTimer !== undefined) {
      return;
    }

    secondTimer = setInterval(refresh, 1000);
  };

  const stopSecondTimer = (): void => {
    if (secondTimer === undefined) {
      return;
    }

    clearInterval(secondTimer);
    secondTimer = undefined;
  };

  return {
    start() {
      ensureActive("start");
      scheduler.start(refresh);
      startSecondTimer();
    },
    stop() {
      if (destroyed) {
        return;
      }

      scheduler.stop();
      stopSecondTimer();
    },
    refresh,
    setTimeZone(nextTimeZone: string) {
      ensureActive("set timezone on");
      const nextTime = projectInstantToStaticClockTime(options.timeSource.now(), nextTimeZone);
      timeZone = nextTimeZone;
      applyCurrentState(nextTime, staticClock, eventLayers);
    },
    setEvents(nextEvents: readonly InstantEventDefinition[]) {
      ensureActive("set events on");
      const currentTime = projectInstantToStaticClockTime(options.timeSource.now(), timeZone);
      const nextLayers = eventsToDefaultLayer(nextEvents);
      const resolvedEvents = resolveEventLayers(nextLayers, currentTime);
      eventLayers = nextLayers;
      staticClock.setEvents(resolvedEvents);
    },
    setEventLayers(nextEventLayers: readonly EventLayerDefinition[]) {
      ensureActive("set event layers on");
      const currentTime = projectInstantToStaticClockTime(options.timeSource.now(), timeZone);
      const resolvedEvents = resolveEventLayers(nextEventLayers, currentTime);
      eventLayers = cloneEventLayers(nextEventLayers);
      staticClock.setEvents(resolvedEvents);
    },
    destroy() {
      if (destroyed) {
        return;
      }

      scheduler.destroy();
      stopSecondTimer();
      staticClock.destroy();
      destroyed = true;
    }
  };
}

function applyCurrentState(
  currentTime: StaticClockTime,
  staticClock: StaticAnalogClock,
  eventLayers: readonly EventLayerDefinition[]
): void {
  staticClock.setTime(currentTime);
  staticClock.setEvents(resolveEventLayers(eventLayers, currentTime));
}

function initialEventLayers(options: LiveAnalogClockOptions): EventLayerDefinition[] {
  if (options.eventLayers !== undefined) {
    return cloneEventLayers(options.eventLayers);
  }

  return eventsToDefaultLayer(options.events ?? []);
}

function eventsToDefaultLayer(events: readonly InstantEventDefinition[]): EventLayerDefinition[] {
  return [
    {
      id: "default-events",
      title: "אירועים",
      kind: "personal",
      enabled: true,
      events: [...events]
    }
  ];
}

function cloneEventLayers(eventLayers: readonly EventLayerDefinition[]): EventLayerDefinition[] {
  return eventLayers.map((layer) => ({
    ...layer,
    events: [...layer.events]
  }));
}
