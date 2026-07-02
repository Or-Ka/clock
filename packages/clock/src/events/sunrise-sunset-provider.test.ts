import { describe, expect, it } from "vitest";

import { SunriseSunsetEventLayerProvider, type SunriseSunsetEventLayerProviderOptions } from "./sunrise-sunset-provider.js";

describe("SunriseSunsetEventLayerProvider", () => {
  it("requests sunrise and sunset for the selected location, date and time zone", async () => {
    const requestedUrls: string[] = [];
    const provider = new SunriseSunsetEventLayerProvider({
      ...providerOptions(),
      fetcher: async (input) => {
        requestedUrls.push(input);
        return {
          ok: true,
          status: 200,
          async json() {
            return {
              results: {
                sunrise: "2026-07-02T05:42:00+03:00",
                sunset: "2026-07-02T19:48:00+03:00"
              },
              status: "OK",
              tzid: "Asia/Jerusalem"
            };
          }
        };
      }
    });

    const layer = await provider.loadLayer({ date: "2026-07-02", timeZone: "Asia/Jerusalem" });

    expect(requestedUrls).toEqual([
      "https://api.sunrise-sunset.org/json?lat=31.7683&lng=35.2137&date=2026-07-02&formatted=0&tzid=Asia%2FJerusalem"
    ]);
    expect(layer).toMatchObject({
      id: "day-times",
      title: "זמני היום",
      kind: "api",
      enabled: true
    });
    expect(layer.events).toEqual([
      { id: "api-sunrise", type: "instant", kind: "sunrise", title: "זריחה", hour: 5, minute: 42, second: 0 },
      { id: "api-sunset", type: "instant", kind: "sunset", title: "שקיעה", hour: 19, minute: 48, second: 0 }
    ]);
  });

  it("fails clearly when the API returns an error status", async () => {
    const provider = new SunriseSunsetEventLayerProvider({
      ...providerOptions(),
      fetcher: async () => ({
        ok: true,
        status: 200,
        async json() {
          return { status: "INVALID_REQUEST" };
        }
      })
    });

    await expect(provider.loadLayer({ date: "2026-07-02", timeZone: "Asia/Jerusalem" })).rejects.toThrow(
      "Sunrise-sunset API returned status INVALID_REQUEST."
    );
  });
});

function providerOptions(): SunriseSunsetEventLayerProviderOptions {
  return {
    layerId: "day-times",
    layerTitle: "זמני היום",
    latitude: 31.7683,
    longitude: 35.2137,
    sunriseTitle: "זריחה",
    sunsetTitle: "שקיעה"
  };
}
