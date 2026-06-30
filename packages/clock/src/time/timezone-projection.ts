import type { Temporal } from "@js-temporal/polyfill";

import type { StaticClockTime } from "./static-clock-time.js";

export function projectInstantToStaticClockTime(instant: Temporal.Instant, timeZone: string): StaticClockTime {
  if (timeZone.trim() === "") {
    throw new RangeError("timeZone must be a non-empty IANA time zone.");
  }

  const zonedDateTime = instant.toZonedDateTimeISO(timeZone);
  return {
    hour: zonedDateTime.hour,
    minute: zonedDateTime.minute
  };
}
