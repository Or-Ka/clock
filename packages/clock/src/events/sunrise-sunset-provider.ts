import type { EventLayerDefinition, InstantEventDefinition } from "./event-model.js";
import type { EventLayerProvider, EventProviderRequest, FetchLike } from "./event-provider.js";

interface SunriseSunsetApiResponse {
  readonly results?: {
    readonly sunrise?: string;
    readonly sunset?: string;
  };
  readonly status?: string;
  readonly tzid?: string;
}

export interface SunriseSunsetEventLayerProviderOptions {
  readonly layerId: string;
  readonly layerTitle: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly sunriseTitle?: string;
  readonly sunsetTitle?: string;
  readonly fetcher?: FetchLike;
}

export class SunriseSunsetEventLayerProvider implements EventLayerProvider {
  private readonly fetcher: FetchLike;

  constructor(private readonly options: SunriseSunsetEventLayerProviderOptions) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  async loadLayer(request: EventProviderRequest): Promise<EventLayerDefinition> {
    const response = await this.fetcher(
      buildSunriseSunsetUrl(this.options.latitude, this.options.longitude, request),
      request.signal === undefined ? undefined : { signal: request.signal }
    );
    if (!response.ok) {
      throw new Error(`Sunrise-sunset API request failed with status ${response.status}.`);
    }

    const payload = parseSunriseSunsetPayload(await response.json());
    return {
      id: this.options.layerId,
      title: this.options.layerTitle,
      kind: "api",
      enabled: true,
      events: [
        toInstantEvent("sunrise", this.options.sunriseTitle ?? "Sunrise", payload.results.sunrise, request.timeZone),
        toInstantEvent("sunset", this.options.sunsetTitle ?? "Sunset", payload.results.sunset, request.timeZone)
      ]
    };
  }
}

function buildSunriseSunsetUrl(latitude: number, longitude: number, request: EventProviderRequest): string {
  const url = new URL("https://api.sunrise-sunset.org/json");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lng", String(longitude));
  url.searchParams.set("date", request.date);
  url.searchParams.set("formatted", "0");
  url.searchParams.set("tzid", request.timeZone);
  return url.toString();
}

function parseSunriseSunsetPayload(payload: unknown): {
  readonly results: {
    readonly sunrise: string;
    readonly sunset: string;
  };
} {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Sunrise-sunset API payload must be an object.");
  }

  const response = payload as SunriseSunsetApiResponse;
  if (response.status !== "OK") {
    throw new Error(`Sunrise-sunset API returned status ${response.status ?? "UNKNOWN"}.`);
  }
  if (
    response.results === undefined ||
    typeof response.results.sunrise !== "string" ||
    typeof response.results.sunset !== "string"
  ) {
    throw new Error("Sunrise-sunset API payload is missing sunrise or sunset.");
  }
  return {
    results: {
      sunrise: response.results.sunrise,
      sunset: response.results.sunset
    }
  };
}

function toInstantEvent(
  kind: "sunrise" | "sunset",
  title: string,
  isoValue: string,
  timeZone: string
): InstantEventDefinition {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${kind} time returned from sunrise-sunset API.`);
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const second = Number(parts.find((part) => part.type === "second")?.value);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second)) {
    throw new Error(`Could not parse ${kind} time returned from sunrise-sunset API.`);
  }

  return {
    id: `api-${kind}`,
    type: "instant",
    kind,
    title,
    hour,
    minute,
    second
  };
}
