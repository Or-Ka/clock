import { createStaticAnalogClock, type StaticAnalogClock, type StaticClockTime } from "@clock/clock";

const clocks: StaticAnalogClock[] = [];
const status = document.querySelector<HTMLElement>("#demo-status");
const mounts = document.querySelectorAll<HTMLElement>("[data-demo-clock]");

if (!status || mounts.length === 0) {
  throw new Error("Static clock demo root elements are missing.");
}

const initialTime: StaticClockTime = { hour: 15, minute: 45 };

for (const mount of Array.from(mounts)) {
  clocks.push(
    createStaticAnalogClock({
      container: mount,
      time: initialTime
    })
  );
}

for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>("[data-time]"))) {
  button.addEventListener("click", () => {
    const time = parseTime(button.dataset.time ?? "");
    for (const clock of clocks) {
      clock.setTime(time);
    }
    status.textContent = formatTime(time);
  });
}

window.addEventListener("beforeunload", destroyAll);

function destroyAll(): void {
  for (const clock of clocks) {
    clock.destroy();
  }
}

function parseTime(value: string): StaticClockTime {
  const [hour, minute] = value.split(":").map(Number);
  return { hour: hour ?? 0, minute: minute ?? 0 };
}

function formatTime(time: StaticClockTime): string {
  return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot;
hot?.dispose(() => {
  window.removeEventListener("beforeunload", destroyAll);
  destroyAll();
});
