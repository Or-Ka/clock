import { renderSvgClockSpike, type SvgClockSpikeHandle } from "./svg-clock-spike.js";

const root = document.querySelector<HTMLElement>("#spike-root");
const statusTarget = document.querySelector<HTMLElement>("#spike-status");

if (!root || !statusTarget) {
  throw new Error("SVG clock spike root elements are missing.");
}

const clockConfigs = [
  { label: "קטן", size: "small" },
  { label: "בינוני", size: "medium" },
  { label: "גדול", size: "large" }
] as const;

const handles: SvgClockSpikeHandle[] = [];

for (const config of clockConfigs) {
  const panel = document.createElement("article");
  panel.className = `clock-panel clock-panel--${config.size}`;

  const title = document.createElement("h2");
  title.textContent = config.label;

  const mount = document.createElement("div");
  mount.className = "clock-mount";

  panel.append(title, mount);
  root.append(panel);

  handles.push(
    renderSvgClockSpike(mount, {
      fixedTime: "2026-06-30T10:10:00+03:00",
      markerTime: "2026-06-30T11:20:00+03:00",
      markerTitle: "פגישה",
      statusTarget
    })
  );
}

const destroyAll = () => {
  for (const handle of handles) {
    handle.destroy();
  }
};

window.addEventListener("beforeunload", destroyAll);

const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot;
hot?.dispose(() => {
  window.removeEventListener("beforeunload", destroyAll);
  destroyAll();
});
