import { Temporal } from "@js-temporal/polyfill";

export interface TimeSource {
  now(): Temporal.Instant;
}

export interface EpochMillisecondsClock {
  now(): number;
}

export interface SimulatedTimeSourceOptions {
  readonly initialInstant: Temporal.Instant;
  readonly speed?: number;
  readonly running?: boolean;
  readonly clock?: EpochMillisecondsClock;
}

const systemEpochMillisecondsClock: EpochMillisecondsClock = {
  now: () => Date.now()
};

export class SystemTimeSource implements TimeSource {
  now(): Temporal.Instant {
    return Temporal.Instant.fromEpochMilliseconds(Date.now());
  }
}

export class FixedTimeSource implements TimeSource {
  constructor(private instant: Temporal.Instant) {}

  now(): Temporal.Instant {
    return this.instant;
  }

  setInstant(instant: Temporal.Instant): void {
    this.instant = instant;
  }
}

export class SimulatedTimeSource implements TimeSource {
  private baseInstant: Temporal.Instant;
  private anchorEpochMilliseconds: number;
  private currentSpeed: number;
  private running: boolean;
  private readonly clock: EpochMillisecondsClock;

  constructor(options: SimulatedTimeSourceOptions) {
    assertValidSpeed(options.speed ?? 1);

    this.baseInstant = options.initialInstant;
    this.currentSpeed = options.speed ?? 1;
    this.running = options.running ?? true;
    this.clock = options.clock ?? systemEpochMillisecondsClock;
    this.anchorEpochMilliseconds = this.clock.now();
  }

  now(): Temporal.Instant {
    if (!this.running) {
      return this.baseInstant;
    }

    return addScaledMilliseconds(this.baseInstant, this.elapsedMilliseconds());
  }

  pause(): void {
    if (!this.running) {
      return;
    }

    this.baseInstant = this.now();
    this.running = false;
  }

  resume(): void {
    if (this.running) {
      return;
    }

    this.anchorEpochMilliseconds = this.clock.now();
    this.running = true;
  }

  setSpeed(speed: number): void {
    assertValidSpeed(speed);

    this.baseInstant = this.now();
    this.anchorEpochMilliseconds = this.clock.now();
    this.currentSpeed = speed;
  }

  getSpeed(): number {
    return this.currentSpeed;
  }

  isRunning(): boolean {
    return this.running;
  }

  private elapsedMilliseconds(): number {
    return (this.clock.now() - this.anchorEpochMilliseconds) * this.currentSpeed;
  }
}

function addScaledMilliseconds(instant: Temporal.Instant, milliseconds: number): Temporal.Instant {
  const nanoseconds = BigInt(Math.trunc(milliseconds * 1_000_000));
  return Temporal.Instant.fromEpochNanoseconds(instant.epochNanoseconds + nanoseconds);
}

function assertValidSpeed(speed: number): void {
  if (!Number.isFinite(speed) || speed < 0) {
    throw new RangeError("speed must be a finite number greater than or equal to 0.");
  }
}
