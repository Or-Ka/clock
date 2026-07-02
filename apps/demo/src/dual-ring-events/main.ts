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

const timeSource = new SystemTimeSource();
let events: InstantEventDefinition[] = [
  { id: "sunrise-demo", type: "instant", kind: "sunrise", title: "Sunrise", hour: 5, minute: 40 },
  { id: "sunset-demo", type: "instant", kind: "sunset", title: "Sunset", hour: 18, minute: 40 },
  { id: "standup-demo", type: "instant", kind: "custom", title: "Standup", hour: 9, minute: 15 },
  { id: "review-demo", type: "instant", kind: "custom", title: "Review", hour: 15, minute: 0 },
  { id: "handoff-demo", type: "instant", kind: "custom", title: "Handoff", hour: 21, minute: 0 }
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

  const title = titleInput.value.trim() || "Event";
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
  status.textContent = `${formatTime(currentTime.hour, currentTime.minute)} | ${timezoneSelect.value}`;
  eventList.replaceChildren(
    ...resolved.map((event) => {
      const item = document.createElement("li");
      item.dataset.eventStatus = event.status;
      item.dataset.clockRing = event.ring;

      const details = document.createElement("span");
      details.className = "event-details";
      details.textContent = `${event.title} | ${formatTime(event.hour, event.minute)} | ${event.ring} | ${event.status}`;

      const kind = document.createElement("span");
      kind.className = `event-kind event-kind-${event.kind}`;
      kind.textContent = event.kind;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.eventId = event.id;
      remove.textContent = "Delete";

      item.append(kind, details, remove);
      return item;
    })
  );
}

function createEventId(): string {
  const hour = Number(hourInput.value);
  const minute = Number(minuteInput.value);
  return `${kindSelect.value}-${ringForTime(hour, minute)}-${hour}-${minute}-${Date.now()}`;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required demo element: ${selector}`);
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
