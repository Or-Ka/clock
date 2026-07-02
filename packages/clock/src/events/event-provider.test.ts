import { describe, expect, it } from "vitest";

import { ApiEventLayerProvider, type FetchLike } from "./event-provider.js";

describe("ApiEventLayerProvider", () => {
  it("loads an API layer from the requested date and time zone", async () => {
    const requestedUrls: string[] = [];
    const fetcher: FetchLike = async (input) => {
      requestedUrls.push(input);
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            events: [{ id: "api-sunrise", kind: "sunrise", title: "זריחה", hour: 6, minute: 5 }]
          };
        }
      };
    };
    const provider = new ApiEventLayerProvider({
      layerId: "api-day-times",
      layerTitle: "זמני היום מה-API",
      urlForDate: ({ date, timeZone }) => `/events?date=${date}&tz=${timeZone}`,
      fetcher
    });

    const layer = await provider.loadLayer({ date: "2026-07-02", timeZone: "Asia/Jerusalem" });

    expect(requestedUrls).toEqual(["/events?date=2026-07-02&tz=Asia/Jerusalem"]);
    expect(layer).toMatchObject({
      id: "api-day-times",
      title: "זמני היום מה-API",
      kind: "api",
      enabled: true
    });
    expect(layer.events).toEqual([
      { id: "api-sunrise", type: "instant", kind: "sunrise", title: "זריחה", hour: 6, minute: 5 }
    ]);
  });

  it("fails clearly when the API response is not successful", async () => {
    const provider = new ApiEventLayerProvider({
      layerId: "api-day-times",
      layerTitle: "זמני היום מה-API",
      urlForDate: () => "/events",
      fetcher: async () => ({
        ok: false,
        status: 500,
        async json() {
          return {};
        }
      })
    });

    await expect(provider.loadLayer({ date: "2026-07-02", timeZone: "UTC" })).rejects.toThrow(
      "Event API request failed with status 500."
    );
  });
});
