import type { Temporal } from "@js-temporal/polyfill";

import type { ClockDateDisplay, StaticClockTime } from "./static-clock-time.js";

export function projectInstantToStaticClockTime(instant: Temporal.Instant, timeZone: string): StaticClockTime {
  if (timeZone.trim() === "") {
    throw new RangeError("timeZone must be a non-empty IANA time zone.");
  }

  const zonedDateTime = instant.toZonedDateTimeISO(timeZone);
  return {
    hour: zonedDateTime.hour,
    minute: zonedDateTime.minute,
    second: zonedDateTime.second,
    dateDisplay: formatDateDisplay(instant.epochMilliseconds, timeZone)
  };
}

function formatDateDisplay(epochMilliseconds: number, timeZone: string): ClockDateDisplay {
  const date = new Date(epochMilliseconds);
  const weekday = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    timeZone
  })
    .format(date)
    .replace(/^יום\s+/, "");
  const hebrewParts = partsByType(
    new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone
    }).formatToParts(date)
  );
  const gregorianParts = partsByType(
    new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone
    }).formatToParts(date)
  );

  return {
    weekday,
    hebrewDateLine1: `${hebrewParts.day ?? ""} ${hebrewParts.month ?? ""}`.trim(),
    hebrewDateLine2: hebrewParts.year ?? "",
    gregorianDateLine1: `${gregorianParts.day ?? ""} ${gregorianParts.month ?? ""}`.trim(),
    gregorianDateLine2: gregorianParts.year ?? ""
  };
}

function partsByType(parts: Intl.DateTimeFormatPart[]): Partial<Record<Intl.DateTimeFormatPartTypes, string>> {
  const result: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  }
  return result;
}
