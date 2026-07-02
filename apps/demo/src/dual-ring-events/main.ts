import {
  createLiveAnalogClock,
  projectInstantToStaticClockTime,
  resolveEventLayers,
  ringForTime,
  SystemTimeSource,
  type EventLayerDefinition,
  type EventLayerKind,
  type InstantEventDefinition,
  type InstantEventKind
} from "@clock/clock";

const DAY_TIMES_LAYER_ID = "day-times";
const PERSONAL_LAYER_ID = "personal";

const mount = getRequiredElement<HTMLElement>("#phase3-clock");
const status = getRequiredElement<HTMLElement>("#clock-status");
const timezoneSelect = getRequiredElement<HTMLSelectElement>("#timezone");
const eventForm = getRequiredElement<HTMLFormElement>("#event-form");
const kindSelect = getRequiredElement<HTMLSelectElement>("#event-kind");
const titleInput = getRequiredElement<HTMLInputElement>("#event-title");
const hourInput = getRequiredElement<HTMLInputElement>("#event-hour");
const minuteInput = getRequiredElement<HTMLInputElement>("#event-minute");
const eventList = getRequiredElement<HTMLUListElement>("#event-list");
const eventError = getRequiredElement<HTMLElement>("#event-error");
const layerToggles = Array.from(document.querySelectorAll<HTMLInputElement>("[data-layer-toggle]"));

const timeSource = new SystemTimeSource();
let eventLayers: EventLayerDefinition[] = [
  {
    id: DAY_TIMES_LAYER_ID,
    title: "זמני היום",
    kind: "day-times",
    enabled: true,
    events: [
      { id: "sunrise-demo", type: "instant", kind: "sunrise", title: "זריחה", hour: 5, minute: 40 },
      { id: "sunset-demo", type: "instant", kind: "sunset", title: "שקיעה", hour: 18, minute: 40 }
    ]
  },
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
  }
];

const clock = createLiveAnalogClock({
  container: mount,
  timeSource,
  timeZone: timezoneSelect.value,
  eventLayers
});

clock.start();
syncEventList();

timezoneSelect.addEventListener("change", () => {
  clock.setTimeZone(timezoneSelect.value);
  syncEventList();
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

eventList.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("button[data-event-id]");
  if (!button) {
    return;
  }

  eventLayers = eventLayers.map((layer) => ({
    ...layer,
    events: layer.events.filter((item) => item.id !== button.dataset.eventId)
  }));
  applyEventLayers();
});

const statusTimer = window.setInterval(syncEventList, 30_000);
window.addEventListener("beforeunload", destroyClock);

function applyEventLayers(): void {
  clock.setEventLayers(eventLayers);
  syncEventList();
}

function syncEventList(): void {
  const currentTime = projectInstantToStaticClockTime(timeSource.now(), timezoneSelect.value);
  const resolved = resolveEventLayers(eventLayers, currentTime);
  status.textContent = `שעה מקומית ${formatTime(currentTime.hour, currentTime.minute)} | ${timezoneSelect.value}`;
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
      details.textContent = `${event.title} | ${formatTime(event.hour, event.minute)} | ${event.layerTitle ?? "שכבה"} | ${displayRing(event.ring)} | ${displayStatus(event.status)}`;

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

function createEventId(): string {
  const hour = Number(hourInput.value);
  const minute = Number(minuteInput.value);
  return `${kindSelect.value}-${ringForTime(hour, minute)}-${hour}-${minute}-${Date.now()}`;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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
  if (kind === "day-times") {
    return "זמני היום";
  }
  if (kind === "personal") {
    return "אישי";
  }
  if (kind === "api") {
    return "API";
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

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`חסר רכיב דמו נדרש: ${selector}`);
  }
  return element;
}

function destroyClock(): void {
  window.clearInterval(statusTimer);
  window.removeEventListener("beforeunload", destroyClock);
  clock.destroy();
}

const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot;
hot?.dispose(destroyClock);
