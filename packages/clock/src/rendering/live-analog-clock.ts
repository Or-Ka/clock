import type { ClockScheduler } from "../time/clock-scheduler.js";
import { MinuteBoundaryClockScheduler } from "../time/clock-scheduler.js";
import type { TimeSource } from "../time/time-source.js";
import { projectInstantToStaticClockTime } from "../time/timezone-projection.js";
import { createStaticAnalogClock, type StaticAnalogClock } from "./static-analog-clock.js";

export interface LiveAnalogClockOptions {
  readonly container: HTMLElement;
  readonly timeSource: TimeSource;
  readonly timeZone: string;
  readonly scheduler?: ClockScheduler;
}

export interface LiveAnalogClock {
  start(): void;
  stop(): void;
  refresh(): void;
  setTimeZone(timeZone: string): void;
  destroy(): void;
}

export function createLiveAnalogClock(options: LiveAnalogClockOptions): LiveAnalogClock {
  let timeZone = options.timeZone;
  let destroyed = false;
  const scheduler = options.scheduler ?? new MinuteBoundaryClockScheduler();
  const staticClock = createStaticAnalogClock({
    container: options.container,
    time: projectInstantToStaticClockTime(options.timeSource.now(), timeZone)
  });

  const ensureActive = (action: string): void => {
    if (destroyed) {
      throw new Error(`Cannot ${action} a destroyed live analog clock.`);
    }
  };

  const refresh = (): void => {
    ensureActive("refresh");
    staticClock.setTime(projectInstantToStaticClockTime(options.timeSource.now(), timeZone));
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
      staticClock.setTime(nextTime);
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
