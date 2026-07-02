import {
  createLiveAnalogClock,
  projectInstantToStaticClockTime,
  resolveInstantEvents,
  ringForTime,
  SystemTimeSource,
  type InstantEventDefinition,
  type InstantEventKind
} from "@clock/clock";

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

const timeSource = new SystemTimeSource();
let events: InstantEventDefinition[] = [
  { id: "sunrise-demo", type: "instant", kind: "sunrise", title: "זריחה", hour: 5, minute: 40 },
  { id: "sunset-demo", type: "instant", kind: "sunset", title: "שקיעה", hour: 18, minute: 40 },
  { id: "standup-demo", type: "instant", kind: "custom", title: "עמידה", hour: 9, minute: 15 },
  { id: "review-demo", type: "instant", kind: "custom", title: "סקירה", hour: 15, minute: 0 },
  { id: "handoff-demo", type: "instant", kind: "custom", title: "העברה", hour: 21, minute: 0 }
];

const clock = createLiveAnalogClock({
  container: mount,
  timeSource,
  timeZone: timezoneSelect.value,
  events
});

clock.start();
syncEventList();

timezoneSelect.addEventListener("change", () => {
  clock.setTimeZone(timezoneSelect.value);
  syncEventList();
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

  events = [...events, nextEvent];
  clock.setEvents(events);
  syncEventList();
});

eventList.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("button[data-event-id]");
  if (!button) {
    return;
  }

  events = events.filter((item) => item.id !== button.dataset.eventId);
  clock.setEvents(events);
  syncEventList();
});

const statusTimer = window.setInterval(syncEventList, 30_000);
window.addEventListener("beforeunload", destroyClock);

function syncEventList(): void {
  const currentTime = projectInstantToStaticClockTime(timeSource.now(), timezoneSelect.value);
  const resolved = resolveInstantEvents(events, currentTime);
  status.textContent = `שעה מקומית ${formatTime(currentTime.hour, currentTime.minute)} | ${timezoneSelect.value}`;
  eventList.replaceChildren(
    ...resolved.map((event) => {
      const item = document.createElement("li");
      item.dataset.eventStatus = event.status;
      item.dataset.clockRing = event.ring;

      const details = document.createElement("span");
      details.className = "event-details";
      details.textContent = `${event.title} | ${formatTime(event.hour, event.minute)} | ${displayRing(event.ring)} | ${displayStatus(event.status)}`;

      const kind = document.createElement("span");
      kind.className = `event-kind event-kind-${event.kind}`;
      kind.textContent = displayKind(event.kind);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.eventId = event.id;
      remove.textContent = "מחיקה";

      item.append(kind, details, remove);
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
