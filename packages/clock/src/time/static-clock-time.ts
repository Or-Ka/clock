export interface StaticClockTime {
  readonly hour: number;
  readonly minute: number;
}

export function assertValidStaticClockTime(time: StaticClockTime): void {
  assertIntegerInRange("hour", time.hour, 0, 23);
  assertIntegerInRange("minute", time.minute, 0, 59);
}

function assertIntegerInRange(name: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}.`);
  }
}
