import {
  createLiveAnalogClock,
  projectInstantToStaticClockTime,
  resolveEventLayers,
  ringForTime,
  SunriseSunsetEventLayerProvider,
  SystemTimeSource,
  type EventLayerDefinition,
  type EventLayerKind,
  type InstantEventDefinition,
  type InstantEventKind,
  type ZmanitTick
} from "@clock/clock";

type DemoLocation = {
  readonly id: string;
  readonly title: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone: string;
};

type DerivedBase = "sunrise" | "sunset" | `zmanit-${number}`;
type DerivedDirection = "before" | "after";
type DerivedOffsetUnit = "minutes" | "hours" | "zmanit-hours";

type DerivedEventDefinition = {
  readonly id: string;
  readonly title: string;
  readonly base: DerivedBase;
  readonly direction: DerivedDirection;
  readonly offsetValue: number;
  readonly offsetUnit: DerivedOffsetUnit;
};

const DAY_TIMES_LAYER_ID = "day-times";
const PERSONAL_LAYER_ID = "personal";
const SPECIAL_LAYER_ID = "special";
const LOCATION_OPTIONS: readonly DemoLocation[] = [
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

const mount = getRequiredElement<HTMLElement>("#phase3-clock");
const status = getRequiredElement<HTMLElement>("#clock-status");
const timezoneSelect = getRequiredElement<HTMLSelectElement>("#timezone");
const locationSelect = getRequiredElement<HTMLSelectElement>("#location");
const dayTimesStatus = getRequiredElement<HTMLElement>("#day-times-status");
const eventForm = getRequiredElement<HTMLFormElement>("#event-form");
const kindSelect = getRequiredElement<HTMLSelectElement>("#event-kind");
const titleInput = getRequiredElement<HTMLInputElement>("#event-title");
const hourInput = getRequiredElement<HTMLInputElement>("#event-hour");
const minuteInput = getRequiredElement<HTMLInputElement>("#event-minute");
const derivedForm = getRequiredElement<HTMLFormElement>("#derived-event-form");
const derivedTitleInput = getRequiredElement<HTMLInputElement>("#derived-event-title");
const derivedBaseSelect = getRequiredElement<HTMLSelectElement>("#derived-event-base");
const derivedDirectionSelect = getRequiredElement<HTMLSelectElement>("#derived-event-direction");
const derivedOffsetInput = getRequiredElement<HTMLInputElement>("#derived-event-offset");
const derivedOffsetUnitSelect = getRequiredElement<HTMLSelectElement>("#derived-event-offset-unit");
const derivedError = getRequiredElement<HTMLElement>("#derived-event-error");
const eventList = getRequiredElement<HTMLUListElement>("#event-list");
const eventError = getRequiredElement<HTMLElement>("#event-error");
const layerToggles = Array.from(document.querySelectorAll<HTMLInputElement>("[data-layer-toggle]"));
const zmanitLayerToggle = getRequiredElement<HTMLInputElement>("[data-zmanit-layer-toggle]");

const timeSource = new SystemTimeSource();
let selectedLocation = getLocationById(locationSelect.value);
let dayTimesAbortController: AbortController | undefined;
let dayTimesCacheKey = "";
let zmanitTicks: ZmanitTick[] = [];
let derivedEvents: DerivedEventDefinition[] = [];
let eventLayers: EventLayerDefinition[] = [
  emptyDayTimesLayer(),
  {
    id: PERSONAL_LAYER_ID,
    title: "אירועים אישיים",
    kind: "personal",
    enabled: true,
    events: [
      { id: "standup-demo", type: "instant", kind: "custom", title: "עמידה", hour: 9, minute: 15 },
      { id: "review-demo", type: "instant", kind: "custom", title: "סקירה", hour: 15, minute: 0 },
      { id: "handoff-demo", type: "instant", kind: "custom", title: "העברה", hour: 21, minute: 0 }
    ]
  },
  emptySpecialLayer()
];

syncTimeZoneToLocation();

const clock = createLiveAnalogClock({
  container: mount,
  timeSource,
  timeZone: timezoneSelect.value,
  eventLayers
});

clock.start();
syncEventList();
void refreshDayTimesLayer(true);

locationSelect.addEventListener("change", () => {
  selectedLocation = getLocationById(locationSelect.value);
  syncTimeZoneToLocation();
  clock.setTimeZone(timezoneSelect.value);
  dayTimesCacheKey = "";
  void refreshDayTimesLayer(true);
});

for (const toggle of layerToggles) {
  toggle.addEventListener("change", () => {
    const layerId = toggle.dataset.layerToggle;
    if (layerId === undefined) {
      return;
    }

    eventLayers = eventLayers.map((layer) =>
      layer.id === layerId ? { ...layer, enabled: toggle.checked } : layer
    );
    applyEventLayers();
  });
}

zmanitLayerToggle.addEventListener("change", () => {
  clock.setZmanitTicks(zmanitLayerToggle.checked ? zmanitTicks : []);
});

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const validationError = validateEventForm();
  if (validationError) {
    eventError.textContent = validationError;
    return;
  }

  eventError.textContent = "";
  const title = titleInput.value.trim() || "אירוע";
  const nextEvent: InstantEventDefinition = {
    id: createEventId(),
    type: "instant",
    kind: kindSelect.value as InstantEventKind,
    title,
    hour: Number(hourInput.value),
    minute: Number(minuteInput.value)
  };

  eventLayers = eventLayers.map((layer) =>
    layer.id === PERSONAL_LAYER_ID ? { ...layer, events: [...layer.events, nextEvent] } : layer
  );
  applyEventLayers();
});

derivedForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const validationError = validateDerivedEventForm();
  if (validationError) {
    derivedError.textContent = validationError;
    return;
  }

  derivedError.textContent = "";
  derivedEvents = [
    ...derivedEvents,
    {
      id: `derived-${Date.now()}`,
      title: derivedTitleInput.value.trim() || "אירוע מיוחד",
      base: derivedBaseSelect.value as DerivedBase,
      direction: derivedDirectionSelect.value as DerivedDirection,
      offsetValue: Number(derivedOffsetInput.value),
      offsetUnit: derivedOffsetUnitSelect.value as DerivedOffsetUnit
    }
  ];
  refreshSpecialLayer();
  applyEventLayers();
});

eventList.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("button[data-event-id]");
  if (!button) {
    return;
  }

  derivedEvents = derivedEvents.filter((item) => item.id !== button.dataset.eventId);
  eventLayers = eventLayers.map((layer) => ({
    ...layer,
    events: layer.events.filter((item) => item.id !== button.dataset.eventId)
  }));
  refreshSpecialLayer();
  applyEventLayers();
});

const statusTimer = window.setInterval(() => {
  syncEventList();
  void refreshDayTimesLayer();
}, 30_000);

window.addEventListener("beforeunload", destroyClock);

function applyEventLayers(): void {
  clock.setEventLayers(eventLayers);
  syncEventList();
}

async function refreshDayTimesLayer(force = false): Promise<void> {
  const date = currentDateKey();
  const nextCacheKey = `${selectedLocation.id}:${date}`;
  if (!force && nextCacheKey === dayTimesCacheKey) {
    return;
  }

  dayTimesAbortController?.abort();
  dayTimesAbortController = new AbortController();
  dayTimesStatus.textContent = `טוען זריחה ושקיעה עבור ${selectedLocation.title}...`;

  const provider = new SunriseSunsetEventLayerProvider({
    layerId: DAY_TIMES_LAYER_ID,
    layerTitle: "זמני היום",
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude,
    sunriseTitle: "זריחה",
    sunsetTitle: "שקיעה"
  });

  try {
    const layer = await provider.loadLayer({
      date,
      timeZone: selectedLocation.timeZone,
      signal: dayTimesAbortController.signal
    });
    dayTimesCacheKey = nextCacheKey;
    dayTimesStatus.textContent = `זמני היום נטענו עבור ${selectedLocation.title} בתאריך ${date}.`;
    eventLayers = eventLayers.map((existingLayer) =>
      existingLayer.id === DAY_TIMES_LAYER_ID
        ? mergeLayerEnabled(layer, existingLayer.enabled)
        : existingLayer
    );
    zmanitTicks = createZmanitTicks(layer.events);
    clock.setZmanitTicks(zmanitLayerToggle.checked ? zmanitTicks : []);
    refreshSpecialLayer();
    applyEventLayers();
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }

    dayTimesStatus.textContent = `לא ניתן לטעון זמני זריחה ושקיעה עבור ${selectedLocation.title}.`;
    eventLayers = eventLayers.map((layer) =>
      layer.id === DAY_TIMES_LAYER_ID ? { ...layer, events: [] } : layer
    );
    zmanitTicks = [];
    clock.setZmanitTicks([]);
    refreshSpecialLayer();
    applyEventLayers();
  }
}

function refreshSpecialLayer(): void {
  const specialEvents = resolveDerivedEvents();
  eventLayers = eventLayers.map((layer) =>
    layer.id === SPECIAL_LAYER_ID ? { ...layer, events: specialEvents } : layer
  );
}

function resolveDerivedEvents(): InstantEventDefinition[] {
  const dayTimesLayer = eventLayers.find((layer) => layer.id === DAY_TIMES_LAYER_ID);
  const dayEvents = dayTimesLayer?.events ?? [];
  const sunrise = dayEvents.find((event) => event.kind === "sunrise");
  const sunset = dayEvents.find((event) => event.kind === "sunset");
  if (sunrise === undefined || sunset === undefined) {
    return [];
  }

  const sunriseSeconds = eventSecondOfDay(sunrise);
  const sunsetSeconds = eventSecondOfDay(sunset);
  const zmanitHourSeconds = (sunsetSeconds - sunriseSeconds) / 12;
  if (zmanitHourSeconds <= 0) {
    return [];
  }

  return derivedEvents.flatMap((definition) => {
    const baseSeconds = derivedBaseSecondOfDay(definition.base, sunrise, sunset);
    if (baseSeconds === undefined) {
      return [];
    }

    const offsetSeconds = derivedOffsetSeconds(definition, zmanitHourSeconds);
    const signedOffset = definition.direction === "before" ? -offsetSeconds : offsetSeconds;
    const time = timeFromSeconds(Math.round(baseSeconds + signedOffset));
    return [
      {
        id: definition.id,
        type: "instant",
        kind: "custom",
        title: definition.title,
        hour: time.hour,
        minute: time.minute,
        second: time.second
      }
    ];
  });
}

function derivedBaseSecondOfDay(
  base: DerivedBase,
  sunrise: InstantEventDefinition,
  sunset: InstantEventDefinition
): number | undefined {
  if (base === "sunrise") {
    return eventSecondOfDay(sunrise);
  }
  if (base === "sunset") {
    return eventSecondOfDay(sunset);
  }

  const index = Number(base.replace("zmanit-", ""));
  const tick = zmanitTicks.find((candidate) => candidate.index === index);
  return tick === undefined ? undefined : eventSecondOfDay(tick);
}

function derivedOffsetSeconds(definition: DerivedEventDefinition, zmanitHourSeconds: number): number {
  if (definition.offsetUnit === "minutes") {
    return definition.offsetValue * 60;
  }
  if (definition.offsetUnit === "hours") {
    return definition.offsetValue * 3600;
  }
  return definition.offsetValue * zmanitHourSeconds;
}

function syncEventList(): void {
  const currentTime = projectInstantToStaticClockTime(timeSource.now(), timezoneSelect.value);
  const resolved = resolveEventLayers(eventLayers, currentTime);
  status.textContent = `שעה מקומית ${formatTime(currentTime.hour, currentTime.minute)} | ${selectedLocation.title} | ${timezoneSelect.value}`;
  eventList.replaceChildren(
    ...resolved.map((event) => {
      const item = document.createElement("li");
      item.dataset.eventStatus = event.status;
      item.dataset.clockRing = event.ring;
      if (event.layerId !== undefined) {
        item.dataset.eventLayerId = event.layerId;
      }

      const details = document.createElement("span");
      details.className = "event-details";
      details.textContent = `${event.title} | ${formatEventTime(event)} | ${event.layerTitle ?? "שכבה"} | ${displayRing(event.ring)} | ${displayStatus(event.status)}`;

      const kind = document.createElement("span");
      kind.className = `event-kind event-kind-${event.kind}`;
      kind.textContent = displayKind(event.kind);

      const layer = document.createElement("span");
      layer.className = `event-layer event-layer-${event.layerKind ?? "custom"}`;
      layer.textContent = displayLayerKind(event.layerKind);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.eventId = event.id;
      remove.textContent = "מחיקה";

      item.append(kind, layer, details, remove);
      return item;
    })
  );
}

function validateEventForm(): string {
  const hour = Number(hourInput.value);
  const minute = Number(minuteInput.value);

  hourInput.setCustomValidity("");
  minuteInput.setCustomValidity("");

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    const message = "השעה חייבת להיות מספר שלם בין 0 ל-23.";
    hourInput.setCustomValidity(message);
    return message;
  }

  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    const message = "הדקה חייבת להיות מספר שלם בין 0 ל-59.";
    minuteInput.setCustomValidity(message);
    return message;
  }

  return "";
}

function validateDerivedEventForm(): string {
  const offsetValue = Number(derivedOffsetInput.value);

  derivedOffsetInput.setCustomValidity("");

  if (!Number.isFinite(offsetValue) || offsetValue < 0) {
    const message = "הכמות חייבת להיות מספר חיובי.";
    derivedOffsetInput.setCustomValidity(message);
    return message;
  }

  return "";
}

function createEventId(): string {
  const hour = Number(hourInput.value);
  const minute = Number(minuteInput.value);
  return `${kindSelect.value}-${ringForTime(hour, minute)}-${hour}-${minute}-${Date.now()}`;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatEventTime(event: { readonly hour: number; readonly minute: number; readonly second?: number }): string {
  if (event.second === undefined) {
    return formatTime(event.hour, event.minute);
  }

  return `${formatTime(event.hour, event.minute)}:${String(event.second).padStart(2, "0")}`;
}

function createZmanitTicks(events: readonly InstantEventDefinition[]): ZmanitTick[] {
  const sunrise = events.find((event) => event.kind === "sunrise");
  const sunset = events.find((event) => event.kind === "sunset");
  if (sunrise === undefined || sunset === undefined) {
    return [];
  }

  const sunriseSeconds = eventSecondOfDay(sunrise);
  const sunsetSeconds = eventSecondOfDay(sunset);
  if (sunsetSeconds <= sunriseSeconds) {
    return [];
  }

  const partSeconds = (sunsetSeconds - sunriseSeconds) / 12;
  return Array.from({ length: 12 }, (_, index) =>
    tickFromSeconds(index + 1, Math.round(sunriseSeconds + partSeconds * (index + 1)))
  );
}

function eventSecondOfDay(event: { readonly hour: number; readonly minute: number; readonly second?: number }): number {
  return event.hour * 60 * 60 + event.minute * 60 + (event.second ?? 0);
}

function timeFromSeconds(totalSeconds: number): { hour: number; minute: number; second: number } {
  const secondsInDay = ((totalSeconds % 86_400) + 86_400) % 86_400;
  const hour = Math.floor(secondsInDay / 3600);
  const minute = Math.floor((secondsInDay % 3600) / 60);
  const second = secondsInDay % 60;
  return { hour, minute, second };
}

function tickFromSeconds(index: number, totalSeconds: number): ZmanitTick {
  return { index, ...timeFromSeconds(totalSeconds) };
}

function currentDateKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: selectedLocation.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(timeSource.now().epochMilliseconds);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("לא ניתן לחשב את התאריך הנוכחי עבור המיקום שנבחר.");
  }

  return `${year}-${month}-${day}`;
}

function emptyDayTimesLayer(): EventLayerDefinition {
  return {
    id: DAY_TIMES_LAYER_ID,
    title: "זמני היום",
    kind: "day-times",
    enabled: true,
    events: []
  };
}

function emptySpecialLayer(): EventLayerDefinition {
  return {
    id: SPECIAL_LAYER_ID,
    title: "אירועים מיוחדים",
    kind: "special",
    enabled: true,
    events: []
  };
}

function mergeLayerEnabled(layer: EventLayerDefinition, enabled: boolean | undefined): EventLayerDefinition {
  if (enabled === undefined) {
    return layer;
  }

  return { ...layer, enabled };
}

function syncTimeZoneToLocation(): void {
  timezoneSelect.value = selectedLocation.timeZone;
}

function getLocationById(locationId: string): DemoLocation {
  const location = LOCATION_OPTIONS.find((option) => option.id === locationId);
  if (!location) {
    throw new Error(`מיקום לא נתמך: ${locationId}`);
  }
  return location;
}

function displayKind(kind: InstantEventKind | undefined): string {
  if (kind === "sunrise") {
    return "זריחה";
  }
  if (kind === "sunset") {
    return "שקיעה";
  }
  return "מותאם";
}

function displayLayerKind(kind: EventLayerKind | undefined): string {
  if (kind === "day-times" || kind === "api") {
    return "זמני היום";
  }
  if (kind === "personal") {
    return "אישי";
  }
  if (kind === "special") {
    return "מיוחד";
  }
  return "שכבה";
}

function displayRing(ring: "outer" | "inner"): string {
  return ring === "outer" ? "טבעת יום" : "טבעת לילה";
}

function displayStatus(status: "past" | "next" | "future"): string {
  if (status === "past") {
    return "עבר";
  }
  if (status === "next") {
    return "האירוע הבא";
  }
  return "עתידי";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`חסר רכיב דמו נדרש: ${selector}`);
  }
  return element;
}

function destroyClock(): void {
  dayTimesAbortController?.abort();
  window.clearInterval(statusTimer);
  window.removeEventListener("beforeunload", destroyClock);
  clock.destroy();
}

const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot;
hot?.dispose(destroyClock);
