import type { ClockDateDisplayDetails } from "@clock/clock";

type HebcalCalendarItem = {
  readonly date?: string;
  readonly category?: string;
  readonly subcat?: string;
  readonly title?: string;
  readonly hebrew?: string;
  readonly title_orig?: string;
};

type HebcalCalendarPayload = {
  readonly items?: readonly HebcalCalendarItem[];
};

const HEBCAL_VISIBLE_CATEGORIES = new Set(["holiday", "omer", "roshchodesh"]);

export function hebcalUrlForDate(start: string, end: string, timeZone: string): string {
  const params = new URLSearchParams({
    v: "1",
    cfg: "json",
    start,
    end,
    maj: "on",
    min: "on",
    nx: "on",
    mf: "on",
    ss: "on",
    s: "on",
    o: "on",
    d: "on",
    leyning: "off",
    lg: "he-x-NoNikud",
    hdp: "1"
  });

  if (timeZone === "Asia/Jerusalem") {
    params.set("i", "on");
  }

  return `https://www.hebcal.com/hebcal?${params}`;
}

export function parseHebcalDetails(payload: unknown, date: string): ClockDateDisplayDetails {
  const items = isHebcalCalendarPayload(payload) ? payload.items ?? [] : [];
  const torahReading = items.find((item) => item.category === "parashat");
  const observances = uniqueStrings(
    items
      .filter((item) => hebcalItemDateKey(item) === date)
      .flatMap(hebcalObservanceTitle)
  );

  return {
    ...(torahReading === undefined ? {} : { torahReading: hebcalItemTitle(torahReading) }),
    observances
  };
}

export function addDaysToDateKey(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function hebcalObservanceTitle(item: HebcalCalendarItem): readonly string[] {
  if (item.category === undefined || item.category === "hebdate" || item.category === "parashat") {
    return [];
  }

  if (!HEBCAL_VISIBLE_CATEGORIES.has(item.category) && !isSpecialShabbatItem(item)) {
    return [];
  }

  const title = hebcalItemTitle(item);
  return title === "" ? [] : [title];
}

function isSpecialShabbatItem(item: HebcalCalendarItem): boolean {
  const title = hebcalItemTitle(item);
  return item.subcat === "shabbat" || title.startsWith("שבת ");
}

function hebcalItemTitle(item: HebcalCalendarItem): string {
  return (item.title ?? item.hebrew ?? item.title_orig ?? "").trim();
}

function hebcalItemDateKey(item: HebcalCalendarItem): string | undefined {
  return item.date?.slice(0, 10);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function isHebcalCalendarPayload(payload: unknown): payload is HebcalCalendarPayload {
  return isRecord(payload) && (payload.items === undefined || Array.isArray(payload.items));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
