import { Temporal } from "@js-temporal/polyfill";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FixedTimeSource, SimulatedTimeSource, SystemTimeSource, type EpochMillisecondsClock } from "./time-source.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("TimeSource implementations", () => {
  it("reads the current instant from the system clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T10:20:30.000Z"));

    expect(new SystemTimeSource().now().toString()).toBe("2026-06-30T10:20:30Z");
  });

  it("returns a fixed instant and allows replacing it explicitly", () => {
    const first = Temporal.Instant.from("2026-06-30T00:00:00Z");
    const second = Temporal.Instant.from("2026-07-01T12:30:00Z");
    const source = new FixedTimeSource(first);

    expect(source.now()).toBe(first);

    source.setInstant(second);

    expect(source.now()).toBe(second);
  });

  it("advances simulated time while running", () => {
    const clock = createMutableClock(1_000);
    const source = new SimulatedTimeSource({
      initialInstant: Temporal.Instant.from("2026-06-30T00:00:00Z"),
      clock
    });

    clock.current += 90_000;

    expect(source.now().toString()).toBe("2026-06-30T00:01:30Z");
  });

  it("supports pause and resume", () => {
    const clock = createMutableClock(0);
    const source = new SimulatedTimeSource({
      initialInstant: Temporal.Instant.from("2026-06-30T00:00:00Z"),
      clock
    });

    clock.current = 10_000;
    source.pause();
    clock.current = 20_000;

    expect(source.now().toString()).toBe("2026-06-30T00:00:10Z");

    source.resume();
    clock.current = 50_000;

    expect(source.now().toString()).toBe("2026-06-30T00:00:40Z");
  });

  it("changes simulated speed without losing the current simulated instant", () => {
    const clock = createMutableClock(0);
    const source = new SimulatedTimeSource({
      initialInstant: Temporal.Instant.from("2026-06-30T00:00:00Z"),
      speed: 1,
      clock
    });

    clock.current = 10_000;
    source.setSpeed(6);
    clock.current = 20_000;

    expect(source.getSpeed()).toBe(6);
    expect(source.now().toString()).toBe("2026-06-30T00:01:10Z");
  });

  it("rejects invalid simulated speeds", () => {
    const initialInstant = Temporal.Instant.from("2026-06-30T00:00:00Z");

    expect(() => new SimulatedTimeSource({ initialInstant, speed: -1 })).toThrow(RangeError);
    expect(() => new SimulatedTimeSource({ initialInstant, speed: Number.NaN })).toThrow(RangeError);
  });
});

function createMutableClock(current: number): EpochMillisecondsClock & { current: number } {
  return {
    current,
    now() {
      return this.current;
    }
  };
}
