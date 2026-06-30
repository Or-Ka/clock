export interface ClockScheduler {
  start(callback: () => void): void;
  stop(): void;
  destroy(): void;
}

export interface SchedulerClock {
  now(): number;
}

export interface SchedulerTimers {
  setTimeout(callback: () => void, delayMilliseconds: number): unknown;
  clearTimeout(timer: unknown): void;
}

export interface MinuteBoundaryClockSchedulerOptions {
  readonly clock?: SchedulerClock;
  readonly timers?: SchedulerTimers;
}

const minuteMilliseconds = 60_000;

const systemSchedulerClock: SchedulerClock = {
  now: () => Date.now()
};

const systemSchedulerTimers: SchedulerTimers = {
  setTimeout: (callback, delayMilliseconds) => setTimeout(callback, delayMilliseconds),
  clearTimeout: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>)
};

export class MinuteBoundaryClockScheduler implements ClockScheduler {
  private timer: unknown;
  private callback: (() => void) | undefined;
  private running = false;
  private destroyed = false;
  private readonly clock: SchedulerClock;
  private readonly timers: SchedulerTimers;

  constructor(options: MinuteBoundaryClockSchedulerOptions = {}) {
    this.clock = options.clock ?? systemSchedulerClock;
    this.timers = options.timers ?? systemSchedulerTimers;
  }

  start(callback: () => void): void {
    if (this.destroyed) {
      throw new Error("Cannot start a destroyed clock scheduler.");
    }

    this.callback = callback;
    if (this.running) {
      return;
    }

    this.running = true;
    callback();
    this.scheduleNextTick();
  }

  stop(): void {
    this.clearTimer();
    this.running = false;
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.stop();
    this.callback = undefined;
    this.destroyed = true;
  }

  private scheduleNextTick(): void {
    if (!this.running || this.destroyed) {
      return;
    }

    this.clearTimer();
    this.timer = this.timers.setTimeout(() => {
      if (!this.running || this.destroyed) {
        return;
      }

      this.callback?.();
      this.scheduleNextTick();
    }, millisecondsUntilNextMinute(this.clock.now()));
  }

  private clearTimer(): void {
    if (this.timer === undefined) {
      return;
    }

    this.timers.clearTimeout(this.timer);
    this.timer = undefined;
  }
}

export function millisecondsUntilNextMinute(epochMilliseconds: number): number {
  const remainder = positiveModulo(epochMilliseconds, minuteMilliseconds);
  return remainder === 0 ? minuteMilliseconds : minuteMilliseconds - remainder;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
