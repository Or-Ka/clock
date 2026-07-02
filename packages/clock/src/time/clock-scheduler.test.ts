import { describe, expect, it, vi } from "vitest";

import {
  millisecondsUntilNextMinute,
  MinuteBoundaryClockScheduler,
  type SchedulerClock,
  type SchedulerTimers
} from "./clock-scheduler.js";

describe("MinuteBoundaryClockScheduler", () => {
  it("computes the delay to the next minute boundary", () => {
    expect(millisecondsUntilNextMinute(0)).toBe(60_000);
    expect(millisecondsUntilNextMinute(30_000)).toBe(30_000);
    expect(millisecondsUntilNextMinute(59_999)).toBe(1);
    expect(millisecondsUntilNextMinute(61_000)).toBe(59_000);
  });

  it("refreshes immediately on start and schedules the next minute boundary", () => {
    const clock = createMutableClock(90_500);
    const timers = createManualTimers();
    const scheduler = new MinuteBoundaryClockScheduler({ clock, timers });
    const callback = vi.fn();

    scheduler.start(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(timers.created).toHaveLength(1);
    expect(timers.created[0]?.delayMilliseconds).toBe(29_500);
  });

  it("does not create duplicate timers on double start", () => {
    const clock = createMutableClock(0);
    const timers = createManualTimers();
    const scheduler = new MinuteBoundaryClockScheduler({ clock, timers });
    const callback = vi.fn();

    scheduler.start(callback);
    scheduler.start(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(timers.activeTimers()).toHaveLength(1);
  });

  it("allows double stop", () => {
    const clock = createMutableClock(0);
    const timers = createManualTimers();
    const scheduler = new MinuteBoundaryClockScheduler({ clock, timers });

    scheduler.start(vi.fn());
    scheduler.stop();
    scheduler.stop();

    expect(timers.clearTimeout).toHaveBeenCalledTimes(1);
    expect(timers.activeTimers()).toHaveLength(0);
  });

  it("starts again after stop", () => {
    const clock = createMutableClock(0);
    const timers = createManualTimers();
    const scheduler = new MinuteBoundaryClockScheduler({ clock, timers });
    const callback = vi.fn();

    scheduler.start(callback);
    scheduler.stop();
    scheduler.start(callback);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(timers.activeTimers()).toHaveLength(1);
    expect(timers.created).toHaveLength(2);
  });

  it("runs callbacks on minute ticks and keeps one active timer", () => {
    const clock = createMutableClock(0);
    const timers = createManualTimers();
    const scheduler = new MinuteBoundaryClockScheduler({ clock, timers });
    const callback = vi.fn();

    scheduler.start(callback);
    clock.current = 60_000;
    timers.fireLatest();

    expect(callback).toHaveBeenCalledTimes(2);
    expect(timers.activeTimers()).toHaveLength(1);
  });

  it("cleans timers on destroy and allows double destroy", () => {
    const clock = createMutableClock(0);
    const timers = createManualTimers();
    const scheduler = new MinuteBoundaryClockScheduler({ clock, timers });
    const callback = vi.fn();

    scheduler.start(callback);
    scheduler.destroy();
    scheduler.destroy();
    timers.fireLatest();

    expect(timers.clearTimeout).toHaveBeenCalledTimes(1);
    expect(timers.activeTimers()).toHaveLength(0);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("rejects start after destroy", () => {
    const scheduler = new MinuteBoundaryClockScheduler({
      clock: createMutableClock(0),
      timers: createManualTimers()
    });

    scheduler.destroy();

    expect(() => scheduler.start(vi.fn())).toThrow("destroyed");
  });
});

interface ManualTimer {
  readonly id: number;
  readonly callback: () => void;
  readonly delayMilliseconds: number;
  active: boolean;
}

function createMutableClock(current: number): SchedulerClock & { current: number } {
  return {
    current,
    now() {
      return this.current;
    }
  };
}

function createManualTimers(): SchedulerTimers & {
  readonly created: ManualTimer[];
  readonly clearTimeout: ReturnType<typeof vi.fn>;
  activeTimers(): ManualTimer[];
  fireLatest(): void;
} {
  let nextId = 1;
  const created: ManualTimer[] = [];
  const clearTimeout = vi.fn((timer: ManualTimer) => {
    timer.active = false;
  });

  return {
    created,
    clearTimeout,
    setTimeout(callback, delayMilliseconds) {
      const timer = { id: nextId, callback, delayMilliseconds, active: true };
      nextId += 1;
      created.push(timer);
      return timer;
    },
    activeTimers() {
      return created.filter((timer) => timer.active);
    },
    fireLatest() {
      const timer = created.at(-1);
      if (timer?.active) {
        timer.active = false;
        timer.callback();
      }
    }
  };
}
