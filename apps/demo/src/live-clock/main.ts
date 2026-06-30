import { Temporal } from "@js-temporal/polyfill";
import {
  createLiveAnalogClock,
  FixedTimeSource,
  projectInstantToStaticClockTime,
  SimulatedTimeSource,
  SystemTimeSource,
  type TimeSource
} from "@clock/clock";

type TimeSourceMode = "system" | "fixed" | "simulated";

class DelegatingTimeSource implements TimeSource {
  constructor(private activeSource: TimeSource) {}

  now(): Temporal.Instant {
    return this.activeSource.now();
  }

  setSource(source: TimeSource): void {
    this.activeSource = source;
  }
}

const mount = getRequiredElement<HTMLElement>("#live-clock");
const status = getRequiredElement<HTMLElement>("#clock-status");
const timezoneSelect = getRequiredElement<HTMLSelectElement>("#timezone");
const fixedTimeInput = getRequiredElement<HTMLInputElement>("#fixed-time");
const speedSelect = getRequiredElement<HTMLSelectElement>("#simulated-speed");
const startButton = getRequiredElement<HTMLButtonElement>("#start-clock");
const stopButton = getRequiredElement<HTMLButtonElement>("#stop-clock");
const refreshButton = getRequiredElement<HTMLButtonElement>("#refresh-clock");

const systemSource = new SystemTimeSource();
const fixedSource = new FixedTimeSource(parseUtcDateTime(fixedTimeInput.value));
const simulatedSource = new SimulatedTimeSource({
  initialInstant: Temporal.Instant.fromEpochMilliseconds(Date.now()),
  speed: Number(speedSelect.value)
});
const source = new DelegatingTimeSource(systemSource);

let currentMode: TimeSourceMode = "system";

const clock = createLiveAnalogClock({
  container: mount,
  timeSource: source,
  timeZone: timezoneSelect.value
});

clock.start();
syncStatus();

timezoneSelect.addEventListener("change", () => {
  clock.setTimeZone(timezoneSelect.value);
  syncStatus();
});

startButton.addEventListener("click", () => {
  if (currentMode === "simulated") {
    simulatedSource.resume();
  }
  clock.start();
  syncStatus();
});

stopButton.addEventListener("click", () => {
  clock.stop();
  if (currentMode === "simulated") {
    simulatedSource.pause();
  }
  syncStatus();
});

refreshButton.addEventListener("click", () => {
  clock.refresh();
  syncStatus();
});

fixedTimeInput.addEventListener("change", () => {
  fixedSource.setInstant(parseUtcDateTime(fixedTimeInput.value));
  if (currentMode === "fixed") {
    clock.refresh();
    syncStatus();
  }
});

speedSelect.addEventListener("change", () => {
  simulatedSource.setSpeed(Number(speedSelect.value));
  if (currentMode === "simulated") {
    clock.refresh();
    syncStatus();
  }
});

for (const input of Array.from(document.querySelectorAll<HTMLInputElement>('input[name="time-source"]'))) {
  input.addEventListener("change", () => {
    if (!input.checked) {
      return;
    }

    setMode(input.value as TimeSourceMode);
  });
}

window.addEventListener("beforeunload", destroyClock);

function setMode(mode: TimeSourceMode): void {
  currentMode = mode;

  if (mode === "system") {
    source.setSource(systemSource);
  } else if (mode === "fixed") {
    source.setSource(fixedSource);
  } else {
    simulatedSource.resume();
    source.setSource(simulatedSource);
  }

  clock.refresh();
  syncStatus();
}

function syncStatus(): void {
  const projected = projectInstantToStaticClockTime(source.now(), timezoneSelect.value);
  status.textContent = `${formatTime(projected.hour, projected.minute)} | ${currentMode} | ${timezoneSelect.value}`;
}

function parseUtcDateTime(value: string): Temporal.Instant {
  if (!value) {
    return Temporal.Instant.fromEpochMilliseconds(Date.now());
  }

  return Temporal.Instant.from(`${value}:00Z`);
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
  window.removeEventListener("beforeunload", destroyClock);
  clock.destroy();
}

const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot;
hot?.dispose(destroyClock);
