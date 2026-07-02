import { resolveInstantEvents, type InstantEventDefinition } from "../events/event-model.js";
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
}

export interface LiveAnalogClock {
  start(): void;
  stop(): void;
  refresh(): void;
  setTimeZone(timeZone: string): void;
  setEvents(events: readonly InstantEventDefinition[]): void;
  destroy(): void;
}

export function createLiveAnalogClock(options: LiveAnalogClockOptions): LiveAnalogClock {
  let timeZone = options.timeZone;
  let events = [...(options.events ?? [])];
  let destroyed = false;
  const scheduler = options.scheduler ?? new MinuteBoundaryClockScheduler();
  const initialTime = projectInstantToStaticClockTime(options.timeSource.now(), timeZone);
  const staticClock = createStaticAnalogClock({
    container: options.container,
    time: initialTime,
    events: resolveInstantEvents(events, initialTime)
  });

  const ensureActive = (action: string): void => {
    if (destroyed) {
      throw new Error(`Cannot ${action} a destroyed live analog clock.`);
    }
  };

  const refresh = (): void => {
    ensureActive("refresh");
    applyCurrentState(projectInstantToStaticClockTime(options.timeSource.now(), timeZone), staticClock, events);
  };

  return {
    start() {
      ensureActive("start");
      scheduler.start(refresh);
    },
    stop() {
      if (destroyed) {
        return;
      }

      scheduler.stop();
    },
    refresh,
    setTimeZone(nextTimeZone: string) {
      ensureActive("set timezone on");
      const nextTime = projectInstantToStaticClockTime(options.timeSource.now(), nextTimeZone);
      timeZone = nextTimeZone;
      applyCurrentState(nextTime, staticClock, events);
    },
    setEvents(nextEvents: readonly InstantEventDefinition[]) {
      ensureActive("set events on");
      const currentTime = projectInstantToStaticClockTime(options.timeSource.now(), timeZone);
      const resolvedEvents = resolveInstantEvents(nextEvents, currentTime);
      events = [...nextEvents];
      staticClock.setEvents(resolvedEvents);
    },
    destroy() {
      if (destroyed) {
        return;
      }

      scheduler.destroy();
      staticClock.destroy();
      destroyed = true;
    }
  };
}

function applyCurrentState(
  currentTime: StaticClockTime,
  staticClock: StaticAnalogClock,
  events: readonly InstantEventDefinition[]
): void {
  staticClock.setTime(currentTime);
  staticClock.setEvents(resolveInstantEvents(events, currentTime));
}
