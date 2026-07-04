import { resolveEventLayers, type EventLayerDefinition, type InstantEventDefinition } from "../events/event-model.js";
import type { ClockScheduler } from "../time/clock-scheduler.js";
import { MinuteBoundaryClockScheduler } from "../time/clock-scheduler.js";
import type { ClockDateDisplay, StaticClockTime } from "../time/static-clock-time.js";
import type { TimeSource } from "../time/time-source.js";
import {
  type ClockDateBoundary,
  type ClockDateBoundaryTime,
  projectInstantToStaticClockTime
} from "../time/timezone-projection.js";
import {
  createStaticAnalogClock,
  type ClockRenderer,
  type ClockRendererFactory,
  type ZmanitTick
} from "./static-analog-clock.js";

export interface LiveAnalogClockOptions {
  readonly container: HTMLElement;
  readonly timeSource: TimeSource;
  readonly timeZone: string;
  readonly scheduler?: ClockScheduler;
  readonly events?: readonly InstantEventDefinition[];
  readonly eventLayers?: readonly EventLayerDefinition[];
  readonly zmanitTicks?: readonly ZmanitTick[];
  readonly dateDisplayDetails?: () => ClockDateDisplayDetails | undefined;
  readonly createRenderer?: ClockRendererFactory;
}

export type ClockDateDisplayDetails = Pick<ClockDateDisplay, "torahReading" | "observances">;

export interface LiveAnalogClock {
  start(): void;
  stop(): void;
  refresh(): void;
  setTimeZone(timeZone: string): void;
  setEvents(events: readonly InstantEventDefinition[]): void;
  setEventLayers(eventLayers: readonly EventLayerDefinition[]): void;
  setZmanitTicks(ticks: readonly ZmanitTick[]): void;
  destroy(): void;
}

export function createLiveAnalogClock(options: LiveAnalogClockOptions): LiveAnalogClock {
  let timeZone = options.timeZone;
  let eventLayers = initialEventLayers(options);
  let zmanitTicks = [...(options.zmanitTicks ?? [])];
  let destroyed = false;
  let secondTimer: ReturnType<typeof setInterval> | undefined;
  const scheduler = options.scheduler ?? new MinuteBoundaryClockScheduler();
  const createRenderer = options.createRenderer ?? createStaticAnalogClock;
  const initialTime = projectCurrentTime(options.timeSource, timeZone, eventLayers, options.dateDisplayDetails);
  const renderer = createRenderer({
    container: options.container,
    time: initialTime,
    events: resolveEventLayers(eventLayers, initialTime),
    zmanitTicks
  });

  const ensureActive = (action: string): void => {
    if (destroyed) {
      throw new Error(`Cannot ${action} a destroyed live analog clock.`);
    }
  };

  const refresh = (): void => {
    ensureActive("refresh");
    applyCurrentState(
      projectCurrentTime(options.timeSource, timeZone, eventLayers, options.dateDisplayDetails),
      renderer,
      eventLayers
    );
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
      const nextTime = projectCurrentTime(options.timeSource, nextTimeZone, eventLayers, options.dateDisplayDetails);
      timeZone = nextTimeZone;
      applyCurrentState(nextTime, renderer, eventLayers);
    },
    setEvents(nextEvents: readonly InstantEventDefinition[]) {
      ensureActive("set events on");
      const nextLayers = eventsToDefaultLayer(nextEvents);
      const currentTime = projectCurrentTime(options.timeSource, timeZone, nextLayers, options.dateDisplayDetails);
      const resolvedEvents = resolveEventLayers(nextLayers, currentTime);
      eventLayers = nextLayers;
      renderer.setTime(currentTime);
      renderer.setEvents(resolvedEvents);
    },
    setEventLayers(nextEventLayers: readonly EventLayerDefinition[]) {
      ensureActive("set event layers on");
      const nextLayers = cloneEventLayers(nextEventLayers);
      const currentTime = projectCurrentTime(options.timeSource, timeZone, nextLayers, options.dateDisplayDetails);
      const resolvedEvents = resolveEventLayers(nextLayers, currentTime);
      eventLayers = nextLayers;
      renderer.setTime(currentTime);
      renderer.setEvents(resolvedEvents);
    },
    setZmanitTicks(nextTicks: readonly ZmanitTick[]) {
      ensureActive("set zmanit ticks on");
      zmanitTicks = [...nextTicks];
      renderer.setZmanitTicks(zmanitTicks);
    },
    destroy() {
      if (destroyed) {
        return;
      }

      scheduler.destroy();
      stopSecondTimer();
      renderer.destroy();
      destroyed = true;
    }
  };
}

function projectCurrentTime(
  timeSource: TimeSource,
  timeZone: string,
  eventLayers: readonly EventLayerDefinition[],
  dateDisplayDetails: (() => ClockDateDisplayDetails | undefined) | undefined
): StaticClockTime {
  const dateBoundary = dateBoundaryFromEventLayers(eventLayers);
  const time = dateBoundary === undefined
    ? projectInstantToStaticClockTime(timeSource.now(), timeZone)
    : projectInstantToStaticClockTime(timeSource.now(), timeZone, { dateBoundary });
  return applyDateDisplayDetails(time, dateDisplayDetails?.());
}

function applyDateDisplayDetails(
  time: StaticClockTime,
  details: ClockDateDisplayDetails | undefined
): StaticClockTime {
  if (details === undefined || time.dateDisplay === undefined) {
    return time;
  }

  return {
    ...time,
    dateDisplay: {
      ...time.dateDisplay,
      ...details
    }
  };
}

function dateBoundaryFromEventLayers(eventLayers: readonly EventLayerDefinition[]): ClockDateBoundary | undefined {
  const events = eventLayers.flatMap((layer) => layer.events);
  const sunrise = events.find((event) => event.kind === "sunrise");
  const sunset = events.find((event) => event.kind === "sunset");

  if (sunrise === undefined && sunset === undefined) {
    return undefined;
  }

  return {
    ...(sunrise === undefined ? {} : { sunrise: clockDateBoundaryTimeFromEvent(sunrise) }),
    ...(sunset === undefined ? {} : { sunset: clockDateBoundaryTimeFromEvent(sunset) })
  };
}

function clockDateBoundaryTimeFromEvent(event: InstantEventDefinition): ClockDateBoundaryTime {
  if (event.second === undefined) {
    return { hour: event.hour, minute: event.minute };
  }

  return { hour: event.hour, minute: event.minute, second: event.second };
}

function applyCurrentState(
  currentTime: StaticClockTime,
  renderer: ClockRenderer,
  eventLayers: readonly EventLayerDefinition[]
): void {
  renderer.setTime(currentTime);
  renderer.setEvents(resolveEventLayers(eventLayers, currentTime));
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
