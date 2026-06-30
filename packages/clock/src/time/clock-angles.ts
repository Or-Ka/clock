import { assertValidStaticClockTime, type StaticClockTime } from "./static-clock-time.js";

export interface ClockHandAngles {
  readonly hourAngle: number;
  readonly minuteAngle: number;
}

export function minuteAngle(minute: number): number {
  assertValidStaticClockTime({ hour: 0, minute });
  return minute * 6;
}

export function hourAngle(time: StaticClockTime): number {
  assertValidStaticClockTime(time);
  return (time.hour % 12) * 30 + time.minute * 0.5;
}

export function clockHandAngles(time: StaticClockTime): ClockHandAngles {
  return {
    hourAngle: hourAngle(time),
    minuteAngle: minuteAngle(time.minute)
  };
}
