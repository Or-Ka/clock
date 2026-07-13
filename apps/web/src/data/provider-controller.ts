import {
  projectInstantToStaticClockTime,
  SunriseSunsetEventLayerProvider,
  type ClockDateDisplayDetails,
  type EventLayerDefinition,
  type FetchLike,
  type InstantEventDefinition,
  type TimeSource
} from "@clock/clock";

import { addDaysToDateKey, hebcalUrlForDate, parseHebcalDetails } from "./hebcal-service.js";

type ProviderLocation = {
  readonly id: string;
  readonly title: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone: string;
};

type ProviderControllerState<TLocation extends ProviderLocation> = {
  readonly getLocation: () => TLocation;
  readonly getTimeZone: () => string;
  readonly getEventLayers: () => readonly EventLayerDefinition[];
};

export type DayTimesRefreshResult<TLocation extends ProviderLocation> =
  | {
      readonly status: "loaded";
      readonly date: string;
      readonly location: TLocation;
      readonly layer: EventLayerDefinition;
    }
  | {
      readonly status: "failed";
      readonly date: string;
      readonly location: TLocation;
      readonly error: unknown;
    }
  | { readonly status: "skipped" }
  | { readonly status: "aborted" };

export type HebcalRefreshResult =
  | { readonly status: "loaded"; readonly details: ClockDateDisplayDetails }
  | { readonly status: "failed"; readonly error: unknown; readonly details: ClockDateDisplayDetails }
  | { readonly status: "skipped" }
  | { readonly status: "aborted" };

export type ProviderControllerOptions<TLocation extends ProviderLocation> = {
  readonly state: ProviderControllerState<TLocation>;
  readonly timeSource: TimeSource;
  readonly dayTimesLayerId: string;
  readonly dayTimesLayerTitle: string;
  readonly sunriseTitle: string;
  readonly sunsetTitle: string;
  readonly fetcher?: FetchLike;
  readonly createAbortController?: () => AbortController;
};

export type ProviderController<TLocation extends ProviderLocation> = {
  readonly getDateDisplayDetails: () => ClockDateDisplayDetails;
  readonly invalidateDayTimesCache: () => void;
  readonly invalidateHebcalCache: () => void;
  readonly invalidateCaches: () => void;
  readonly refreshDayTimesLayer: (options?: {
    readonly force?: boolean;
    readonly onStart?: (context: { readonly date: string; readonly location: TLocation }) => void;
  }) => Promise<DayTimesRefreshResult<TLocation>>;
  readonly refreshHebcalDetails: (options?: { readonly force?: boolean }) => Promise<HebcalRefreshResult>;
  readonly abort: () => void;
};

export function createProviderController<TLocation extends ProviderLocation>(
  options: ProviderControllerOptions<TLocation>
): ProviderController<TLocation> {
  const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  const createAbortController = options.createAbortController ?? (() => new AbortController());
  let dayTimesAbortController: AbortController | undefined;
  let dayTimesCacheKey = "";
  let hebcalAbortController: AbortController | undefined;
  let hebcalCacheKey = "";
  let dateDisplayDetails: ClockDateDisplayDetails = { observances: [] };

  function currentDateKey(): string {
    return dateKeyForLocation(options.timeSource.now().epochMilliseconds, options.state.getLocation().timeZone);
  }

  async function refreshDayTimesLayer(refreshOptions: {
    readonly force?: boolean;
    readonly onStart?: (context: { readonly date: string; readonly location: TLocation }) => void;
  } = {}): Promise<DayTimesRefreshResult<TLocation>> {
    const date = currentDateKey();
    const location = options.state.getLocation();
    const nextCacheKey = `${location.id}:${date}`;
    if (refreshOptions.force !== true && nextCacheKey === dayTimesCacheKey) {
      return { status: "skipped" };
    }

    dayTimesAbortController?.abort();
    dayTimesAbortController = createAbortController();
    refreshOptions.onStart?.({ date, location });

    const provider = new SunriseSunsetEventLayerProvider({
      layerId: options.dayTimesLayerId,
      layerTitle: options.dayTimesLayerTitle,
      latitude: location.latitude,
      longitude: location.longitude,
      sunriseTitle: options.sunriseTitle,
      sunsetTitle: options.sunsetTitle,
      fetcher
    });

    try {
      const layer = await provider.loadLayer({
        date,
        timeZone: location.timeZone,
        signal: dayTimesAbortController.signal
      });
      dayTimesCacheKey = nextCacheKey;
      return { status: "loaded", date, location, layer };
    } catch (error) {
      if (isAbortError(error)) {
        return { status: "aborted" };
      }

      return { status: "failed", date, location, error };
    }
  }

  async function refreshHebcalDetails(refreshOptions: { readonly force?: boolean } = {}): Promise<HebcalRefreshResult> {
    const location = options.state.getLocation();
    const civilDate = currentDateKey();
    const hebcalDate = currentHebcalDateKey(civilDate);
    const parshaStartDate = currentParshaRangeStartDateKey(civilDate);
    const nextCacheKey = `${location.id}:${civilDate}:${hebcalDate}:${parshaStartDate}`;
    if (refreshOptions.force !== true && nextCacheKey === hebcalCacheKey) {
      return { status: "skipped" };
    }

    hebcalAbortController?.abort();
    hebcalAbortController = createAbortController();

    try {
      const response = await fetcher(hebcalUrlForDate(parshaStartDate, addDaysToDateKey(parshaStartDate, 7), location.timeZone), {
        signal: hebcalAbortController.signal
      });
      if (!response.ok) {
        throw new Error(`Hebcal request failed with status ${response.status}.`);
      }

      dateDisplayDetails = parseHebcalDetails(await response.json(), hebcalDate);
      hebcalCacheKey = nextCacheKey;
      return { status: "loaded", details: dateDisplayDetails };
    } catch (error) {
      if (isAbortError(error)) {
        return { status: "aborted" };
      }

      dateDisplayDetails = { observances: [] };
      hebcalCacheKey = "";
      return { status: "failed", error, details: dateDisplayDetails };
    }
  }

  function currentHebcalDateKey(civilDate: string): string {
    const sunset = dayTimeEvent("sunset");
    if (sunset === undefined) {
      return civilDate;
    }

    const current = projectInstantToStaticClockTime(options.timeSource.now(), options.state.getTimeZone());
    return eventSecondOfDay(current) >= eventSecondOfDay(sunset) ? addDaysToDateKey(civilDate, 1) : civilDate;
  }

  function currentParshaRangeStartDateKey(civilDate: string): string {
    if (weekdayIndexForDateKey(civilDate) !== 0) {
      return civilDate;
    }

    const sunrise = dayTimeEvent("sunrise");
    if (sunrise === undefined) {
      return civilDate;
    }

    const current = projectInstantToStaticClockTime(options.timeSource.now(), options.state.getTimeZone());
    return eventSecondOfDay(current) < eventSecondOfDay(sunrise) ? addDaysToDateKey(civilDate, -1) : civilDate;
  }

  function dayTimeEvent(kind: "sunrise" | "sunset"): InstantEventDefinition | undefined {
    return options.state
      .getEventLayers()
      .find((layer) => layer.id === options.dayTimesLayerId)
      ?.events.find((event): event is InstantEventDefinition => event.type === "instant" && event.kind === kind);
  }

  return {
    getDateDisplayDetails() {
      return dateDisplayDetails;
    },

    invalidateDayTimesCache() {
      dayTimesCacheKey = "";
    },

    invalidateHebcalCache() {
      hebcalCacheKey = "";
    },

    invalidateCaches() {
      dayTimesCacheKey = "";
      hebcalCacheKey = "";
    },

    refreshDayTimesLayer,
    refreshHebcalDetails,

    abort() {
      dayTimesAbortController?.abort();
      hebcalAbortController?.abort();
    }
  };
}

export function dateKeyForLocation(epochMilliseconds: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(epochMilliseconds);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("Could not compute the current date for the selected location.");
  }

  return `${year}-${month}-${day}`;
}

function eventSecondOfDay(event: { readonly hour: number; readonly minute: number; readonly second?: number }): number {
  return event.hour * 60 * 60 + event.minute * 60 + (event.second ?? 0);
}

function weekdayIndexForDateKey(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
