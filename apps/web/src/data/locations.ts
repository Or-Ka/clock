export type AppLocation = {
  readonly id: string;
  readonly title: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone: string;
};

export const LOCATION_OPTIONS: readonly AppLocation[] = [
  { id: "jerusalem", title: "ירושלים", latitude: 31.7683, longitude: 35.2137, timeZone: "Asia/Jerusalem" },
  { id: "tel-aviv", title: "תל אביב", latitude: 32.0853, longitude: 34.7818, timeZone: "Asia/Jerusalem" },
  { id: "haifa", title: "חיפה", latitude: 32.794, longitude: 34.9896, timeZone: "Asia/Jerusalem" },
  { id: "london", title: "לונדון", latitude: 51.5072, longitude: -0.1276, timeZone: "Europe/London" },
  {
    id: "new-york",
    title: "ניו יורק",
    latitude: 40.7128,
    longitude: -74.006,
    timeZone: "America/New_York"
  }
];

export function getLocationById(locationId: string): AppLocation {
  return LOCATION_OPTIONS.find((location) => location.id === locationId) ?? LOCATION_OPTIONS[0]!;
}
