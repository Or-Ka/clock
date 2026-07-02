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
type EventOffsetUnit = "minutes" | "hours" | "zmanit-hours";
type DerivedOffsetUnit = EventOffsetUnit;
type FixedDayTimeBase = "sunrise" | "sunset";

type DerivedEventDefinition = {
  readonly id: string;
  readonly title: string;
  readonly base: DerivedBase;
  readonly direction: DerivedDirection;
  readonly offsetValue: number;
  readonly offsetUnit: DerivedOffsetUnit;
};

type FixedDayTimeDefinition = {
  readonly id: string;
  readonly title: string;
  readonly base: FixedDayTimeBase;
  readonly direction: DerivedDirection;
  readonly offsetValue: number;
  readonly offsetUnit: EventOffsetUnit;
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
const DEFAULT_FIXED_DAY_TIME_EVENTS: readonly FixedDayTimeDefinition[] = [
  { id: "alot-hashachar", title: "עלות השחר", base: "sunrise", direction: "before", offsetValue: 72, offsetUnit: "minutes" },
  { id: "talit-tefillin", title: "טלית ותפילין", base: "sunrise", direction: "before", offsetValue: 50, offsetUnit: "minutes" },
  { id: "sof-shema", title: "סוף זמן קריאת שמע", base: "sunrise", direction: "after", offsetValue: 3, offsetUnit: "zmanit-hours" },
  { id: "sof-tefila", title: "סוף זמן תפילה", base: "sunrise", direction: "after", offsetValue: 4, offsetUnit: "zmanit-hours" },
  { id: "chatzot", title: "חצות", base: "sunrise", direction: "after", offsetValue: 6, offsetUnit: "zmanit-hours" },
  { id: "plag-hamincha", title: "פלג המנחה", base: "sunset", direction: "before", offsetValue: 1.25, offsetUnit: "zmanit-hours" },
  { id: "tzeit-hakochavim", title: "צאת הכוכבים", base: "sunset", direction: "after", offsetValue: 18, offsetUnit: "minutes" }
];
const AUTOMATIC_SHABBAT_EVENTS: readonly (FixedDayTimeDefinition & { readonly weekdays: readonly number[] })[] = [
  { id: "candle-lighting", title: "הדלקת נרות", base: "sunset", direction: "before", offsetValue: 18, offsetUnit: "minutes", weekdays: [5] },
  { id: "shabbat-entry", title: "כניסת שבת", base: "sunset", direction: "before", offsetValue: 18, offsetUnit: "minutes", weekdays: [5] },
  { id: "shabbat-exit", title: "יציאת שבת", base: "sunset", direction: "after", offsetValue: 42, offsetUnit: "minutes", weekdays: [6] }
];

const mount = getRequiredElement<HTMLElement>("#phase3-clock");
const status = getRequiredElement<HTMLElement>("#clock-status");
const timezoneSelect = getRequiredElement<HTMLSelectElement>("#timezone");
const locationSelect = getRequiredElement<HTMLSelectElement>("#location");
const dayTimesStatus = getRequiredElement<HTMLElement>("#day-times-status");
const eventFormToggles = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-event-form-toggle]"));
const addEventForms = Array.from(document.querySelectorAll<HTMLFormElement>("[data-add-event-form]"));
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
const fixedDayTimeList = getRequiredElement<HTMLElement>("#fixed-day-time-list");
const fixedDayTimeStatus = getRequiredElement<HTMLElement>("#fixed-day-time-status");
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
let fixedDayTimeEvents: FixedDayTimeDefinition[] = [...DEFAULT_FIXED_DAY_TIME_EVENTS];
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
renderFixedDayTimeControls();

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

for (const toggle of eventFormToggles) {
  toggle.addEventListener("click", () => {
    const formName = toggle.dataset.eventFormToggle;
    if (formName === undefined) {
      return;
    }

    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    syncAddEventFormVisibility(isExpanded ? undefined : formName);
  });
}

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
  syncAddEventFormVisibility(undefined);
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
  syncAddEventFormVisibility(undefined);
  applyEventLayers();
});

fixedDayTimeList.addEventListener("input", handleFixedDayTimeControlEvent);
fixedDayTimeList.addEventListener("change", handleFixedDayTimeControlEvent);

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

function syncAddEventFormVisibility(activeFormName: string | undefined): void {
  for (const form of addEventForms) {
    form.hidden = form.dataset.addEventForm !== activeFormName;
  }

  for (const toggle of eventFormToggles) {
    toggle.setAttribute("aria-expanded", String(toggle.dataset.eventFormToggle === activeFormName));
  }
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
        ? addFixedDayTimeEventsToLayer(mergeLayerEnabled(layer, existingLayer.enabled))
        : existingLayer
    );
    syncFixedDayTimeStatus();
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
    syncFixedDayTimeStatus();
    refreshSpecialLayer();
    applyEventLayers();
  }
}

function renderFixedDayTimeControls(): void {
  fixedDayTimeList.replaceChildren(
    ...fixedDayTimeEvents.map((definition) => {
      const row = document.createElement("div");
      row.className = "fixed-day-time-row";
      row.dataset.fixedDayTimeId = definition.id;

      const title = document.createElement("span");
      title.className = "fixed-day-time-title";
      title.textContent = definition.title;

      const base = document.createElement("select");
      base.dataset.fixedField = "base";
      base.ariaLabel = `${definition.title} מבוסס על`;
      base.append(createOption("sunrise", "זריחה"), createOption("sunset", "שקיעה"));
      base.value = definition.base;

      const direction = document.createElement("select");
      direction.dataset.fixedField = "direction";
      direction.ariaLabel = `${definition.title} לפני או אחרי`;
      direction.append(createOption("before", "לפני"), createOption("after", "אחרי"));
      direction.value = definition.direction;

      const offset = document.createElement("input");
      offset.dataset.fixedField = "offsetValue";
      offset.type = "number";
      offset.min = "0";
      offset.max = "720";
      offset.step = "0.25";
      offset.inputMode = "decimal";
      offset.value = String(definition.offsetValue);
      offset.ariaLabel = `${definition.title} כמות`;

      const unit = document.createElement("select");
      unit.dataset.fixedField = "offsetUnit";
      unit.ariaLabel = `${definition.title} יחידה`;
      unit.append(createOption("minutes", "דקות"), createOption("hours", "שעות"), createOption("zmanit-hours", "שעות זמניות"));
      unit.value = definition.offsetUnit;

      row.append(title, base, direction, offset, unit);
      return row;
    })
  );
  syncFixedDayTimeStatus();
}

function handleFixedDayTimeControlEvent(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
    return;
  }

  const row = target.closest<HTMLElement>("[data-fixed-day-time-id]");
  const id = row?.dataset.fixedDayTimeId;
  const field = target.dataset.fixedField;
  if (id === undefined || field === undefined) {
    return;
  }

  fixedDayTimeEvents = fixedDayTimeEvents.map((definition) => {
    if (definition.id !== id) {
      return definition;
    }

    if (field === "base" && isFixedDayTimeBase(target.value)) {
      return { ...definition, base: target.value };
    }
    if (field === "direction" && isDerivedDirection(target.value)) {
      return { ...definition, direction: target.value };
    }
    if (field === "offsetValue") {
      return { ...definition, offsetValue: Number(target.value) };
    }
    if (field === "offsetUnit" && isEventOffsetUnit(target.value)) {
      return { ...definition, offsetUnit: target.value };
    }
    return definition;
  });

  refreshFixedDayTimeEvents();
  applyEventLayers();
}

function refreshFixedDayTimeEvents(): void {
  eventLayers = eventLayers.map((layer) =>
    layer.id === DAY_TIMES_LAYER_ID ? addFixedDayTimeEventsToLayer(layer) : layer
  );
  syncFixedDayTimeStatus();
}

function addFixedDayTimeEventsToLayer(layer: EventLayerDefinition): EventLayerDefinition {
  const sourceEvents = layer.events.filter((event) => !event.id.startsWith("fixed-"));
  return {
    ...layer,
    events: [...sourceEvents, ...resolveFixedDayTimeEvents(sourceEvents), ...resolveAutomaticShabbatEvents(sourceEvents)]
  };
}

function resolveFixedDayTimeEvents(events: readonly InstantEventDefinition[]): InstantEventDefinition[] {
  return resolveOffsetDefinitions(events, fixedDayTimeEvents, "fixed");
}

function resolveAutomaticShabbatEvents(events: readonly InstantEventDefinition[]): InstantEventDefinition[] {
  const weekday = weekdayIndexForDateKey(currentDateKey());
  const definitions = AUTOMATIC_SHABBAT_EVENTS.filter((definition) => definition.weekdays.includes(weekday));
  return resolveOffsetDefinitions(events, definitions, "fixed-shabbat");
}

function resolveOffsetDefinitions(
  events: readonly InstantEventDefinition[],
  definitions: readonly FixedDayTimeDefinition[],
  idPrefix: string
): InstantEventDefinition[] {
  const sunrise = events.find((event) => event.kind === "sunrise");
  const sunset = events.find((event) => event.kind === "sunset");
  if (sunrise === undefined || sunset === undefined) {
    return [];
  }

  const sunriseSeconds = eventSecondOfDay(sunrise);
  const sunsetSeconds = eventSecondOfDay(sunset);
  const zmanitHourSeconds = (sunsetSeconds - sunriseSeconds) / 12;
  if (zmanitHourSeconds <= 0) {
    return [];
  }

  return definitions.flatMap((definition) => {
    if (!Number.isFinite(definition.offsetValue) || definition.offsetValue < 0) {
      return [];
    }

    const baseEvent = definition.base === "sunrise" ? sunrise : sunset;
    const offsetSeconds = fixedOffsetSeconds(definition, zmanitHourSeconds);
    const signedOffset = definition.direction === "before" ? -offsetSeconds : offsetSeconds;
    const time = timeFromSeconds(Math.round(eventSecondOfDay(baseEvent) + signedOffset));
    return [
      {
        id: `${idPrefix}-${definition.id}`,
        type: "instant",
        kind: "custom",
        title: definition.title,
        hour: time.hour,
        minute: time.minute,
        second: time.second,
        description: `${displayDirection(definition.direction)} ${definition.offsetValue} ${displayOffsetUnit(definition.offsetUnit)} מ${displayFixedBase(definition.base)}`
      }
    ];
  });
}

function fixedOffsetSeconds(definition: FixedDayTimeDefinition, zmanitHourSeconds: number): number {
  if (definition.offsetUnit === "minutes") {
    return definition.offsetValue * 60;
  }
  if (definition.offsetUnit === "hours") {
    return definition.offsetValue * 3600;
  }
  return definition.offsetValue * zmanitHourSeconds;
}

function syncFixedDayTimeStatus(): void {
  const dayTimesLayer = eventLayers.find((layer) => layer.id === DAY_TIMES_LAYER_ID);
  const anchorCount = dayTimesLayer?.events.filter(isSunriseOrSunsetEvent).length ?? 0;
  const resolvedCount = dayTimesLayer?.events.filter((event) => event.id.startsWith("fixed-")).length ?? 0;
  fixedDayTimeStatus.textContent =
    anchorCount < 2
      ? "האירועים הקבועים יחושבו אחרי טעינת זריחה ושקיעה."
      : `${resolvedCount} אירועים קבועים מחושבים בתוך שכבת זמני היום.`;
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
  const resolved = [...resolveEventLayers(eventLayers, currentTime)].sort(
    (first, second) => eventSecondOfDay(first) - eventSecondOfDay(second)
  );
  status.textContent = `שעה מקומית ${formatTime(currentTime.hour, currentTime.minute)} | ${selectedLocation.title} | ${timezoneSelect.value}`;
  eventList.replaceChildren(
    ...resolved.map((event) => {
      const item = document.createElement("li");
      item.dataset.eventStatus = event.status;
      item.dataset.clockRing = event.ring;
      if (event.layerId !== undefined) {
        item.dataset.eventLayerId = event.layerId;
      }

      const layer = document.createElement("span");
      layer.className = `event-layer event-layer-${event.layerKind ?? "custom"}`;
      layer.textContent = displayLayerKind(event.layerKind);

      const title = document.createElement("span");
      title.className = "event-title";
      title.textContent = event.title;

      const time = document.createElement("span");
      time.className = "event-time";
      time.textContent = formatEventTime(event);

      const ring = document.createElement("span");
      ring.className = "event-ring";
      ring.textContent = displayRing(event.ring);

      const state = document.createElement("span");
      state.className = "event-status";
      state.textContent = displayStatus(event.status);

      item.append(layer, title, time, ring, state);
      if (event.layerId === PERSONAL_LAYER_ID || event.layerId === SPECIAL_LAYER_ID) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.dataset.eventId = event.id;
        remove.textContent = "מחיקה";
        item.append(remove);
      }
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

function weekdayIndexForDateKey(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
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

function isSunriseOrSunsetEvent(event: InstantEventDefinition): boolean {
  return event.kind === "sunrise" || event.kind === "sunset";
}

function isFixedDayTimeBase(value: string): value is FixedDayTimeBase {
  return value === "sunrise" || value === "sunset";
}

function isDerivedDirection(value: string): value is DerivedDirection {
  return value === "before" || value === "after";
}

function isEventOffsetUnit(value: string): value is EventOffsetUnit {
  return value === "minutes" || value === "hours" || value === "zmanit-hours";
}

function createOption(value: string, label: string): HTMLOptionElement {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
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

function displayFixedBase(base: FixedDayTimeBase): string {
  return base === "sunrise" ? "זריחה" : "שקיעה";
}

function displayDirection(direction: DerivedDirection): string {
  return direction === "before" ? "לפני" : "אחרי";
}

function displayOffsetUnit(unit: EventOffsetUnit): string {
  if (unit === "minutes") {
    return "דקות";
  }
  if (unit === "hours") {
    return "שעות";
  }
  return "שעות זמניות";
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
