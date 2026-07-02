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
    hebrewDate: formatHebrewDate(hebrewParts),
    gregorianDate: `${gregorianParts.day ?? ""} ${gregorianParts.month ?? ""} ${gregorianParts.year ?? ""}`.trim()
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
      remaining -= amount;
      break;
    }
  }

  return parts.join("");
}
