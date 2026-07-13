import { Temporal } from "@js-temporal/polyfill";
import { FixedTimeSource, type EventLayerDefinition, type FetchLike } from "@clock/clock";
import { describe, expect, it, vi } from "vitest";

import { createProviderController, dateKeyForLocation } from "./provider-controller.js";

type TestLocation = {
  readonly id: string;
  readonly title: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone: string;
};

const jerusalem: TestLocation = {
  id: "jerusalem",
  title: "ירושלים",
  latitude: 31.778,
  longitude: 35.235,
  timeZone: "Asia/Jerusalem"
};

describe("createProviderController", () => {
  it("loads sunrise and sunset layers through the provider and skips cached requests", async () => {
    let location = jerusalem;
    let eventLayers: readonly EventLayerDefinition[] = [];
    const fetcher = vi.fn<FetchLike>(async () =>
      responseJson({
        status: "OK",
        results: {
          sunrise: "2026-07-04T02:39:00+00:00",
          sunset: "2026-07-04T16:49:00+00:00"
        }
      })
    );
    const onStart = vi.fn();
    const controller = createProviderController({
      state: {
        getLocation: () => location,
        getTimeZone: () => location.timeZone,
        getEventLayers: () => eventLayers
      },
      timeSource: new FixedTimeSource(Temporal.Instant.from("2026-07-04T09:00:00Z")),
      dayTimesLayerId: "day-times",
      dayTimesLayerTitle: "זמני היום",
      sunriseTitle: "זריחה",
      sunsetTitle: "שקיעה",
      fetcher
    });

    const first = await controller.refreshDayTimesLayer({ onStart });
    expect(first.status).toBe("loaded");
    if (first.status !== "loaded") {
      throw new Error("Expected day-times layer to load.");
    }
    expect(first.date).toBe("2026-07-04");
    expect(first.location).toBe(location);
    expect(first.layer).toMatchObject({
      id: "day-times",
      title: "זמני היום",
      kind: "api"
    });
    expect(first.layer.events.map((event) => event.title)).toEqual(["זריחה", "שקיעה"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("api.sunrise-sunset.org");
    expect(onStart).toHaveBeenCalledWith({ date: "2026-07-04", location });

    eventLayers = [first.layer];
    await expect(controller.refreshDayTimesLayer()).resolves.toEqual({ status: "skipped" });
    expect(fetcher).toHaveBeenCalledTimes(1);

    location = { ...jerusalem, id: "jerusalem-copy" };
    await controller.refreshDayTimesLayer();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("loads Hebcal details for the displayed Hebrew date", async () => {
    const eventLayers: readonly EventLayerDefinition[] = [
      {
        id: "day-times",
        title: "זמני היום",
        kind: "day-times",
        enabled: true,
        events: [
          { id: "api-sunrise", type: "instant", kind: "sunrise", title: "זריחה", hour: 5, minute: 39 },
          { id: "api-sunset", type: "instant", kind: "sunset", title: "שקיעה", hour: 19, minute: 49 }
        ]
      }
    ];
    const fetcher = vi.fn<FetchLike>(async () =>
      responseJson({
        items: [
          { category: "parashat", title: "פרשת פינחס" },
          { date: "2026-07-05", category: "holiday", title: "צום הרביעי" }
        ]
      })
    );
    const controller = createProviderController({
      state: {
        getLocation: () => jerusalem,
        getTimeZone: () => jerusalem.timeZone,
        getEventLayers: () => eventLayers
      },
      timeSource: new FixedTimeSource(Temporal.Instant.from("2026-07-04T18:00:00Z")),
      dayTimesLayerId: "day-times",
      dayTimesLayerTitle: "זמני היום",
      sunriseTitle: "זריחה",
      sunsetTitle: "שקיעה",
      fetcher
    });

    const result = await controller.refreshHebcalDetails();

    expect(result.status).toBe("loaded");
    expect(controller.getDateDisplayDetails()).toEqual({
      torahReading: "פרשת פינחס",
      observances: ["צום הרביעי"]
    });
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("start=2026-07-04");
    await expect(controller.refreshHebcalDetails()).resolves.toEqual({ status: "skipped" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("computes date keys for the selected time zone", () => {
    expect(dateKeyForLocation(Date.parse("2026-07-04T22:30:00Z"), "Asia/Jerusalem")).toBe("2026-07-05");
  });
});

function responseJson(payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  });
}
