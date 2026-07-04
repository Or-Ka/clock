import type { Temporal } from "@js-temporal/polyfill";

import type { ClockDateDisplay, StaticClockTime } from "./static-clock-time.js";

export interface StaticClockProjectionOptions {
  readonly dateBoundary?: ClockDateBoundary;
}

export interface ClockDateBoundary {
  readonly sunrise?: ClockDateBoundaryTime;
  readonly sunset?: ClockDateBoundaryTime;
}

export interface ClockDateBoundaryTime {
  readonly hour: number;
  readonly minute: number;
  readonly second?: number;
}

type NightDisplayPhase = "after-sunset" | "before-sunrise";

export function projectInstantToStaticClockTime(
  instant: Temporal.Instant,
  timeZone: string,
  options: StaticClockProjectionOptions = {}
): StaticClockTime {
  if (timeZone.trim() === "") {
    throw new RangeError("timeZone must be a non-empty IANA time zone.");
  }

  const zonedDateTime = instant.toZonedDateTimeISO(timeZone);
  return {
    hour: zonedDateTime.hour,
    minute: zonedDateTime.minute,
    second: zonedDateTime.second,
    dateDisplay: formatDateDisplay(zonedDateTime, timeZone, options.dateBoundary)
  };
}

function formatDateDisplay(
  zonedDateTime: Temporal.ZonedDateTime,
  timeZone: string,
  dateBoundary: ClockDateBoundary | undefined
): ClockDateDisplay {
  const nightPhase = resolveNightDisplayPhase(zonedDateTime, dateBoundary);
  const hebrewDateTime = nightPhase === "after-sunset" ? zonedDateTime.add({ days: 1 }) : zonedDateTime;
  const weekday =
    nightPhase === undefined ? formatWeekday(zonedDateTime, timeZone) : formatNightWeekday(zonedDateTime, timeZone, nightPhase);
  const hebrewParts = partsByType(
    new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone
    }).formatToParts(zonedDateTimeToDate(hebrewDateTime))
  );
  const gregorianParts = partsByType(
    new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone
    }).formatToParts(zonedDateTimeToDate(zonedDateTime))
  );
  const hebrewDate = formatHebrewDate(hebrewParts);

  return {
    weekday,
    hebrewDate: nightPhase === undefined ? hebrewDate : `אור ל${hebrewDate}`,
    gregorianDate: `${gregorianParts.day ?? ""} ${gregorianParts.month ?? ""} ${gregorianParts.year ?? ""}`.trim()
  };
}

function formatWeekday(zonedDateTime: Temporal.ZonedDateTime, timeZone: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    timeZone
  })
    .format(zonedDateTimeToDate(zonedDateTime))
    .replace(/^יום\s+/, "");
}

function formatNightWeekday(
  zonedDateTime: Temporal.ZonedDateTime,
  timeZone: string,
  nightPhase: NightDisplayPhase
): string {
  const civilWeekday =
    nightPhase === "before-sunrise"
      ? formatWeekday(zonedDateTime.subtract({ days: 1 }), timeZone)
      : formatWeekday(zonedDateTime, timeZone);
  const nightWeekday =
    nightPhase === "before-sunrise"
      ? formatWeekday(zonedDateTime, timeZone)
      : formatWeekday(zonedDateTime.add({ days: 1 }), timeZone);

  return `${civilWeekday} (ליל ${nightWeekday})`;
}

function resolveNightDisplayPhase(
  zonedDateTime: Temporal.ZonedDateTime,
  dateBoundary: ClockDateBoundary | undefined
): NightDisplayPhase | undefined {
  const second = secondOfDay(zonedDateTime);
  const sunriseSecond = dateBoundary?.sunrise === undefined ? undefined : boundarySecondOfDay(dateBoundary.sunrise);
  const sunsetSecond = dateBoundary?.sunset === undefined ? undefined : boundarySecondOfDay(dateBoundary.sunset);

  if (sunsetSecond !== undefined && second >= sunsetSecond) {
    return "after-sunset";
  }

  if (sunriseSecond !== undefined && second < sunriseSecond) {
    return "before-sunrise";
  }

  return undefined;
}

function secondOfDay(time: ClockDateBoundaryTime): number {
  return time.hour * 60 * 60 + time.minute * 60 + (time.second ?? 0);
}

function boundarySecondOfDay(time: ClockDateBoundaryTime): number {
  if (!Number.isInteger(time.hour) || time.hour < 0 || time.hour > 23) {
    throw new RangeError("dateBoundary time hour must be an integer between 0 and 23.");
  }
  if (!Number.isInteger(time.minute) || time.minute < 0 || time.minute > 59) {
    throw new RangeError("dateBoundary time minute must be an integer between 0 and 59.");
  }
  if (time.second !== undefined && (!Number.isInteger(time.second) || time.second < 0 || time.second > 59)) {
    throw new RangeError("dateBoundary time second must be an integer between 0 and 59.");
  }

  return secondOfDay(time);
}

function zonedDateTimeToDate(zonedDateTime: Temporal.ZonedDateTime): Date {
  return new Date(zonedDateTime.toInstant().epochMilliseconds);
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

function formatHebrewDate(parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>>): string {
  const day = Number(parts.day);
  const year = Number(parts.year);
  const month = withHebrewMonthPrefix(parts.month ?? "");
  const dayText = Number.isFinite(day) ? toHebrewNumeral(day) : parts.day ?? "";
  const yearText = Number.isFinite(year) ? toHebrewYear(year) : parts.year ?? "";
  return `${dayText} ${month} ${yearText}`.trim();
}

function withHebrewMonthPrefix(month: string): string {
  if (month === "") {
    return "";
  }
  return month.startsWith("ב") ? month : `ב${month}`;
}

function toHebrewYear(year: number): string {
  const reducedYear = year % 1000;
  return toHebrewNumeral(reducedYear);
}

function toHebrewNumeral(value: number): string {
  if (!Number.isInteger(value) || value <= 0 || value >= 1000) {
    return String(value);
  }

  const specialCases = new Map<number, string>([
    [15, "טו"],
    [16, "טז"]
  ]);
  const raw = specialCases.get(value) ?? buildHebrewNumeral(value);

  if (raw.length === 1) {
    return `${raw}׳`;
  }

  return `${raw.slice(0, -1)}״${raw.slice(-1)}`;
}

function buildHebrewNumeral(value: number): string {
  const parts: string[] = [];
  let remaining = value;

  const hundreds: readonly [number, string][] = [
    [400, "ת"],
    [300, "ש"],
    [200, "ר"],
    [100, "ק"]
  ];
  const tens: readonly [number, string][] = [
    [90, "צ"],
    [80, "פ"],
    [70, "ע"],
    [60, "ס"],
    [50, "נ"],
    [40, "מ"],
    [30, "ל"],
    [20, "כ"],
    [10, "י"]
  ];
  const ones: readonly [number, string][] = [
    [9, "ט"],
    [8, "ח"],
    [7, "ז"],
    [6, "ו"],
    [5, "ה"],
    [4, "ד"],
    [3, "ג"],
    [2, "ב"],
    [1, "א"]
  ];

  for (const [amount, letter] of hundreds) {
    while (remaining >= amount) {
      parts.push(letter);
      remaining -= amount;
    }
  }

  for (const [amount, letter] of tens) {
    if (remaining >= amount) {
      parts.push(letter);
      remaining -= amount;
      break;
    }
  }

  for (const [amount, letter] of ones) {
    if (remaining >= amount) {
      parts.push(letter);
      break;
    }
  }

  return parts.join("");
}
