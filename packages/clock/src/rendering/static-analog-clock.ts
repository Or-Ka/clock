import { clockHandAngles } from "../time/clock-angles.js";
import type { ClockRing, ResolvedInstantEvent } from "../events/event-model.js";
import { assertValidStaticClockTime, type StaticClockTime } from "../time/static-clock-time.js";
import { defaultClockColors } from "../themes/clock-theme.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const activeClockContainers = new WeakMap<HTMLElement, SVGSVGElement>();
const CLOCK_COLORS = defaultClockColors;
const OUTER_TIME_MARKER_RADIUS = 92;
const INNER_TIME_MARKER_RADIUS = 74;
const DATE_LABEL_FONT_FAMILY = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

export interface StaticAnalogClockOptions {
  readonly container: HTMLElement;
  readonly time: StaticClockTime;
  readonly events?: readonly ResolvedInstantEvent[];
  readonly zmanitTicks?: readonly ZmanitTick[];
}

export interface StaticAnalogClock {
  setTime(time: StaticClockTime): void;
  setEvents(events: readonly ResolvedInstantEvent[]): void;
  setZmanitTicks(ticks: readonly ZmanitTick[]): void;
  destroy(): void;
}

// The rendering contract the live clock consumes. `createStaticAnalogClock` is
// the default implementation, but any factory of this shape can be injected —
// a headless fake in tests, or a future non-SVG renderer — without the live
// clock depending on a concrete renderer.
export type ClockRenderer = StaticAnalogClock;
export type ClockRendererOptions = StaticAnalogClockOptions;
export type ClockRendererFactory = (options: ClockRendererOptions) => ClockRenderer;

export interface ZmanitTick {
  readonly index: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

interface ClockDom {
  readonly svg: SVGSVGElement;
  readonly eventLayer: SVGGElement;
  readonly zmanitLayer: SVGGElement;
  readonly currentTimeMarker: SVGGElement;
  readonly dateDisplay: SVGGElement;
  readonly weekdayLabel: SVGTextElement;
  readonly hebrewDateLabel: SVGTextElement;
  readonly gregorianDateLabel: SVGTextElement;
  readonly hourHand: SVGLineElement;
  readonly minuteHand: SVGLineElement;
  readonly secondHand: SVGLineElement;
}

export function createStaticAnalogClock(options: StaticAnalogClockOptions): StaticAnalogClock {
  assertValidStaticClockTime(options.time);

  if (activeClockContainers.has(options.container)) {
    throw new Error("A static analog clock already exists in this container. Destroy it before creating another.");
  }

  const dom = createClockDom();
  const previousChildren = Array.from(options.container.childNodes);
  let resizeObserver: ResizeObserver | undefined;
  let destroyed = false;

  const updateSizeState = (): void => {
    ensureAttached(options.container, dom.svg);
    const { width, height } = options.container.getBoundingClientRect();
    dom.svg.dataset.clockWidth = String(Math.round(width));
    dom.svg.dataset.clockHeight = String(Math.round(height));
  };

  try {
    options.container.replaceChildren(dom.svg);
    applyTime(dom, options.time);
    applyEvents(dom, options.events ?? []);
    applyZmanitTicks(dom, options.zmanitTicks ?? []);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateSizeState);
      resizeObserver.observe(options.container);
    }

    updateSizeState();
    activeClockContainers.set(options.container, dom.svg);
  } catch (error) {
    resizeObserver?.disconnect();
    if (dom.svg.parentElement === options.container) {
      options.container.replaceChildren(...previousChildren);
    }
    throw error;
  }

  return {
    setTime(time: StaticClockTime) {
      if (destroyed) {
        throw new Error("Cannot update a destroyed static analog clock.");
      }

      assertValidStaticClockTime(time);
      ensureAttached(options.container, dom.svg);
      applyTime(dom, time);
    },
    setEvents(events: readonly ResolvedInstantEvent[]) {
      if (destroyed) {
        throw new Error("Cannot update events on a destroyed static analog clock.");
      }

      ensureAttached(options.container, dom.svg);
      applyEvents(dom, events);
    },
    setZmanitTicks(ticks: readonly ZmanitTick[]) {
      if (destroyed) {
        throw new Error("Cannot update zmanit ticks on a destroyed static analog clock.");
      }

      ensureAttached(options.container, dom.svg);
      applyZmanitTicks(dom, ticks);
    },
    destroy() {
      if (destroyed) {
        return;
      }

      resizeObserver?.disconnect();
      if (dom.svg.parentElement === options.container) {
        dom.svg.remove();
      }
      if (activeClockContainers.get(options.container) === dom.svg) {
        activeClockContainers.delete(options.container);
      }
      destroyed = true;
    }
  };
}

function ensureAttached(container: HTMLElement, svg: SVGSVGElement): void {
  if (svg.parentElement !== container) {
    throw new Error("Cannot update a static analog clock after its SVG has been detached.");
  }
}

function createClockDom(): ClockDom {
  const svg = createSvgElement("svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "שעון אנלוגי");
  svg.style.display = "block";
  svg.style.width = "100%";
  svg.style.height = "100%";
  appendClockEffects(svg);

  const face = createSvgElement("circle");
  face.setAttribute("cx", "100");
  face.setAttribute("cy", "100");
  face.setAttribute("r", "98");
  face.setAttribute("fill", CLOCK_COLORS.faceFill);
  face.setAttribute("stroke", CLOCK_COLORS.faceStroke);
  face.setAttribute("stroke-width", "1.2");
  face.dataset.clockPart = "face";
  svg.append(face);

  appendMinuteTicks(svg);
  const innerRing = createRing("inner", 74);
  svg.append(innerRing);
  appendRingHourLabels(svg, "outer", [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], 88);
  appendRingHourLabels(svg, "inner", [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5], 74);

  const eventLayer = createSvgElement("g");
  eventLayer.dataset.clockPart = "event-layer";
  svg.append(eventLayer);

  const zmanitLayer = createSvgElement("g");
  zmanitLayer.dataset.clockPart = "zmanit-layer";
  svg.append(zmanitLayer);

  const currentTimeMarker = createCurrentTimeMarker();
  svg.append(currentTimeMarker);

  const hourHand = createHand("hour-hand", 34, 3.2, CLOCK_COLORS.hand);
  const minuteHand = createHand("minute-hand", 50, 2.4, CLOCK_COLORS.hand);
  const secondHand = createHand("second-hand", 56, 1, CLOCK_COLORS.secondHand);
  svg.append(hourHand, minuteHand, secondHand);

  const pin = createSvgElement("circle");
  pin.setAttribute("cx", "100");
  pin.setAttribute("cy", "100");
  pin.setAttribute("r", "4");
  pin.setAttribute("fill", "currentColor");
  pin.dataset.clockPart = "center-pin";
  svg.append(pin);

  const dateDisplay = createDateDisplay();
  svg.append(dateDisplay.group);

  return {
    svg,
    eventLayer,
    zmanitLayer,
    currentTimeMarker,
    dateDisplay: dateDisplay.group,
    weekdayLabel: dateDisplay.weekdayLabel,
    hebrewDateLabel: dateDisplay.hebrewDateLabel,
    gregorianDateLabel: dateDisplay.gregorianDateLabel,
    hourHand,
    minuteHand,
    secondHand
  };
}

function appendClockEffects(svg: SVGSVGElement): void {
  const style = createSvgElement("style");
  style.textContent = `
    [data-clock-part="current-time-marker"] {
      filter: drop-shadow(0 0 2px ${CLOCK_COLORS.zmanitTick}) drop-shadow(0 0 4px ${CLOCK_COLORS.zmanitTick});
      cursor: help;
    }

    [data-clock-part="event-marker"] {
      cursor: help;
    }

    [data-clock-part="hour-hand"],
    [data-clock-part="minute-hand"],
    [data-clock-part="second-hand"] {
      opacity: 0.68;
    }

    [data-clock-part="date-display"] {
      pointer-events: none;
    }

    [data-clock-part="current-time-halo"] {
      animation: clock-current-time-pulse 2600ms ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }

    @keyframes clock-current-time-pulse {
      0%, 100% { opacity: 0.2; transform: scale(0.9); }
      50% { opacity: 0.42; transform: scale(1.08); }
    }

    @media (prefers-reduced-motion: reduce) {
      [data-clock-part="current-time-halo"] {
        animation: none;
        opacity: 0.28;
      }
    }
  `;
  svg.append(style);
}

function createRing(ring: "inner", radius: number): SVGCircleElement {
  const circle = createSvgElement("circle");
  circle.setAttribute("cx", "100");
  circle.setAttribute("cy", "100");
  circle.setAttribute("r", String(radius));
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", CLOCK_COLORS.innerRing);
  circle.setAttribute("stroke-width", "2.4");
  circle.setAttribute("opacity", "0.46");
  circle.dataset.clockPart = `${ring}-ring`;
  circle.dataset.clockRing = ring;
  return circle;
}

function createCurrentTimeMarker(): SVGGElement {
  const marker = createSvgElement("g");
  const halo = createSvgElement("circle");
  const core = createSvgElement("circle");
  const title = createSvgElement("title");

  marker.dataset.clockPart = "current-time-marker";
  marker.setAttribute("aria-hidden", "true");

  halo.setAttribute("cx", "0");
  halo.setAttribute("cy", "0");
  halo.setAttribute("r", "3.2");
  halo.setAttribute("fill", CLOCK_COLORS.zmanitTick);
  halo.setAttribute("opacity", "0.26");
  halo.dataset.clockPart = "current-time-halo";

  core.setAttribute("cx", "0");
  core.setAttribute("cy", "0");
  core.setAttribute("r", "1.15");
  core.setAttribute("fill", "#fff7e6");
  core.setAttribute("stroke", CLOCK_COLORS.zmanitTick);
  core.setAttribute("stroke-width", "0.9");
  core.dataset.clockPart = "current-time-core";

  marker.append(title, halo, core);
  return marker;
}

function appendMinuteTicks(svg: SVGSVGElement): void {
  for (let minute = 0; minute < 60; minute += 1) {
    const isHourTick = minute % 5 === 0;
    const angle = minute * 6;
    const outer = pointOnClock(angle, isHourTick ? 98 : 96);
    const inner = pointOnClock(angle, isHourTick ? 88 : 93);
    const tick = createSvgElement("line");
    tick.setAttribute("x1", String(inner.x));
    tick.setAttribute("y1", String(inner.y));
    tick.setAttribute("x2", String(outer.x));
    tick.setAttribute("y2", String(outer.y));
    tick.setAttribute("stroke", isHourTick ? CLOCK_COLORS.hourTick : CLOCK_COLORS.minuteTick);
    tick.setAttribute("stroke-linecap", "butt");
    tick.setAttribute("stroke-width", isHourTick ? "1.65" : "0.7");
    tick.dataset.clockPart = isHourTick ? "hour-tick" : "minute-tick";
    tick.dataset.clockTickKind = isHourTick ? "hour" : "minute";
    tick.dataset.clockTickMinute = String(minute);
    svg.append(tick);
  }
}

function appendRingHourLabels(svg: SVGSVGElement, ring: ClockRing, hours: readonly number[], radius: number): void {
  for (const hour of hours) {
    const angle = (((hour * 60 - 6 * 60 + 24 * 60) % (12 * 60)) / 2 + 180) % 360;
    const point = pointOnClock(angle, radius);
    const label = createSvgElement("text");
    label.textContent = pad(hour);
    label.setAttribute("x", String(point.x));
    label.setAttribute("y", String(point.y));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "central");
    label.setAttribute("font-size", ring === "outer" ? "7.6" : "5.4");
    label.setAttribute("font-weight", ring === "outer" ? "700" : "650");
    if (ring === "outer") {
      label.setAttribute("font-family", "Georgia, 'Times New Roman', serif");
    }
    label.setAttribute("fill", ring === "outer" ? CLOCK_COLORS.outerLabel : CLOCK_COLORS.innerLabel);
    if (ring === "inner") {
      label.setAttribute("opacity", "0.58");
    }
    label.setAttribute("paint-order", "stroke");
    label.setAttribute("stroke", CLOCK_COLORS.textHalo);
    label.setAttribute("stroke-width", "2.4");
    label.setAttribute("stroke-linejoin", "round");
    label.dataset.clockPart = "ring-hour-label";
    label.dataset.clockRing = ring;
    label.dataset.clockHour = pad(hour);
    label.dataset.clockAngle = String(angle);
    svg.append(label);
  }
}

function createHand(part: string, length: number, width: number, stroke: string): SVGLineElement {
  const hand = createSvgElement("line");
  hand.setAttribute("x1", "100");
  hand.setAttribute("y1", "100");
  hand.setAttribute("stroke", stroke);
  hand.setAttribute("stroke-linecap", "butt");
  hand.setAttribute("stroke-width", String(width));
  hand.dataset.clockPart = part;
  hand.dataset.clockLength = String(length);
  return hand;
}

function createDateDisplay(): {
  group: SVGGElement;
  weekdayLabel: SVGTextElement;
  hebrewDateLabel: SVGTextElement;
  gregorianDateLabel: SVGTextElement;
} {
  const group = createSvgElement("g");
  group.dataset.clockPart = "date-display";
  group.setAttribute("direction", "rtl");

  const weekdayLabel = createDateLine("weekday-label", 66, "5.4", "700", CLOCK_COLORS.dateMuted);
  const hebrewDateLabel = createDateLine("hebrew-date-label", 82, "5.9", "700", CLOCK_COLORS.dateStrong);
  const gregorianDateLabel = createDateLine("gregorian-date-label", 124, "5.7", "700", CLOCK_COLORS.dateStrong);

  group.append(weekdayLabel, hebrewDateLabel, gregorianDateLabel);
  return { group, weekdayLabel, hebrewDateLabel, gregorianDateLabel };
}

function createDateLine(part: string, y: number, fontSize: string, fontWeight: string, fill: string): SVGTextElement {
  const label = createSvgElement("text");
  label.setAttribute("x", "100");
  label.setAttribute("y", String(y));
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "central");
  label.setAttribute("font-family", DATE_LABEL_FONT_FAMILY);
  label.setAttribute("font-size", fontSize);
  label.setAttribute("font-weight", fontWeight);
  label.setAttribute("fill", fill);
  label.setAttribute("paint-order", "stroke");
  label.setAttribute("stroke", CLOCK_COLORS.textHalo);
  label.setAttribute("stroke-width", "1.8");
  label.setAttribute("stroke-linejoin", "round");
  label.dataset.clockPart = part;
  return label;
}

function applyTime(dom: ClockDom, time: StaticClockTime): void {
  const angles = clockHandAngles(time);
  setHandPosition(dom.hourHand, angles.hourAngle);
  setHandPosition(dom.minuteHand, angles.minuteAngle);
  const second = time.second ?? new Date().getSeconds();
  const secondAngle = second * 6;
  setHandPosition(dom.secondHand, secondAngle);
  setCurrentTimeMarkerPosition(dom.currentTimeMarker, time.hour, time.minute, second);
  applyRingProminence(dom, time.hour >= 6 && time.hour < 18 ? "outer" : "inner");
  dom.svg.dataset.clockHourAngle = String(angles.hourAngle);
  dom.svg.dataset.clockMinuteAngle = String(angles.minuteAngle);
  dom.svg.dataset.clockSecondAngle = String(secondAngle);
  applyDateDisplay(dom, time);
  dom.svg.setAttribute("aria-label", `שעון אנלוגי מציג ${pad(time.hour)}:${pad(time.minute)}`);
}

function setCurrentTimeMarkerPosition(marker: SVGGElement, hour: number, minute: number, second: number): void {
  const ring = hour >= 6 && hour < 18 ? "outer" : "inner";
  const radius = ring === "outer" ? OUTER_TIME_MARKER_RADIUS : INNER_TIME_MARKER_RADIUS;
  const angle = ringTimeAngle(hour, minute, second);
  const point = pointOnClock(angle, radius);
  const title = marker.querySelector("title");

  marker.setAttribute("transform", `translate(${point.x} ${point.y})`);
  marker.dataset.clockRing = ring;
  marker.dataset.clockAngle = String(angle);
  marker.dataset.clockRadius = String(radius);
  marker.dataset.clockTime = formatTimeWithSeconds(hour, minute, second);
  if (title !== null) {
    title.textContent = `זמן נוכחי ${formatTimeWithSeconds(hour, minute, second)}`;
  }
}

function applyRingProminence(dom: ClockDom, activeRing: ClockRing): void {
  dom.svg.dataset.activeRing = activeRing;

  for (const label of Array.from(dom.svg.querySelectorAll<SVGTextElement>('[data-clock-part="ring-hour-label"]'))) {
    const isActive = label.dataset.clockRing === activeRing;
    label.setAttribute("opacity", isActive ? "1" : "0.28");
    label.setAttribute("font-weight", isActive ? "800" : "650");
  }
}

function ringTimeAngle(hour: number, minute: number, second: number): number {
  const minutesFromSix = (hour * 60 + minute + second / 60 - 6 * 60 + 24 * 60) % (12 * 60);
  return (minutesFromSix / 2 + 180) % 360;
}

function applyDateDisplay(dom: ClockDom, time: StaticClockTime): void {
  const display = time.dateDisplay;
  applyWeekdayLabel(dom.weekdayLabel, display?.weekday ?? "");
  dom.hebrewDateLabel.textContent = display?.hebrewDate ?? "";
  dom.gregorianDateLabel.textContent = display?.gregorianDate ?? "";
}

function applyWeekdayLabel(label: SVGTextElement, weekday: string): void {
  const match = /^(.*?)\s*(\([^()]+\))$/.exec(weekday);
  if (match === null) {
    label.textContent = weekday;
    return;
  }

  const weekdayLine = createSvgElement("tspan");
  const nightLine = createSvgElement("tspan");

  weekdayLine.textContent = match[1]?.trim() ?? "";
  weekdayLine.setAttribute("x", "100");
  weekdayLine.setAttribute("dy", "0");

  nightLine.textContent = match[2] ?? "";
  nightLine.setAttribute("x", "100");
  nightLine.setAttribute("dy", "6.5");
  nightLine.setAttribute("font-size", "4.4");
  nightLine.setAttribute("font-weight", "700");

  label.replaceChildren(weekdayLine, nightLine);
}

function applyEvents(dom: ClockDom, events: readonly ResolvedInstantEvent[]): void {
  dom.eventLayer.replaceChildren(...events.map((event, index) => createEventMarker(event, markerLayerIndex(events, event, index))));
  dom.svg.dataset.clockEventCount = String(events.length);
}

function applyZmanitTicks(dom: ClockDom, ticks: readonly ZmanitTick[]): void {
  dom.zmanitLayer.replaceChildren(...ticks.map(createZmanitTickMarker));
  dom.svg.dataset.zmanitTickCount = String(ticks.length);
}

function createZmanitTickMarker(tick: ZmanitTick): SVGGElement {
  const group = createSvgElement("g");
  const angle = standardClockAngle(tick.hour, tick.minute, tick.second);
  const isNightRingTick = tick.hour < 6 || tick.hour >= 18;
  const inner = pointOnClock(angle, isNightRingTick ? 58 : 85);
  const outer = pointOnClock(angle, isNightRingTick ? 70 : 97);
  const line = createSvgElement("line");

  group.dataset.clockPart = "zmanit-tick";
  group.dataset.zmanitIndex = String(tick.index);
  group.dataset.zmanitTitle = displayZmanitIndex(tick.index);
  group.dataset.zmanitTime = formatTimeWithSeconds(tick.hour, tick.minute, tick.second);
  group.dataset.zmanitHour = String(tick.hour);
  group.dataset.zmanitMinute = String(tick.minute);
  group.dataset.zmanitSecond = String(tick.second);
  group.dataset.clockAngle = String(angle);
  group.dataset.clockRing = isNightRingTick ? "inner" : "outer";
  group.setAttribute("aria-label", `${displayZmanitIndex(tick.index)}, ${formatTimeWithSeconds(tick.hour, tick.minute, tick.second)}`);

  line.setAttribute("x1", String(inner.x));
  line.setAttribute("y1", String(inner.y));
  line.setAttribute("x2", String(outer.x));
  line.setAttribute("y2", String(outer.y));
  line.setAttribute("stroke", CLOCK_COLORS.zmanitTick);
  line.setAttribute("stroke-width", "0.85");
  line.setAttribute("stroke-linecap", "butt");
  line.setAttribute("opacity", "0.95");

  group.append(line);
  return group;
}

function createEventMarker(event: ResolvedInstantEvent, layerIndex: number): SVGGElement {
  const marker = createSvgElement("g");
  const radii = eventMarkerRadii(event.ring, layerIndex);
  const displayAngle = ringDisplayAngle(event.angle);
  const inner = pointOnClock(displayAngle, radii.inner);
  const outer = pointOnClock(displayAngle, radii.outer);
  const line = createSvgElement("line");

  marker.dataset.clockPart = "event-marker";
  marker.dataset.eventId = event.id;
  marker.dataset.eventKind = event.kind;
  marker.dataset.eventTitle = event.title;
  marker.dataset.eventTime = formatEventTime(event);
  marker.dataset.eventStatus = event.status;
  marker.dataset.clockRing = event.ring;
  marker.dataset.eventAngle = String(event.angle);
  marker.dataset.eventDisplayAngle = String(displayAngle);
  marker.setAttribute("aria-label", `${event.title}, ${formatEventTime(event)}, ${displayStatus(event.status)}`);
  if (event.layerId !== undefined) {
    marker.dataset.eventLayerId = event.layerId;
  }
  if (event.layerTitle !== undefined) {
    marker.dataset.eventLayerTitle = event.layerTitle;
  }
  if (event.layerKind !== undefined) {
    marker.dataset.eventLayerKind = event.layerKind;
  }
  if (event.description !== undefined) {
    marker.dataset.eventDescription = event.description;
  }

  line.setAttribute("x1", String(inner.x));
  line.setAttribute("y1", String(inner.y));
  line.setAttribute("x2", String(outer.x));
  line.setAttribute("y2", String(outer.y));
  line.setAttribute("stroke", eventColor(event.kind));
  line.setAttribute("stroke-width", event.status === "next" ? "1.55" : "1.25");
  line.setAttribute("stroke-linecap", "butt");
  line.setAttribute("opacity", event.status === "past" ? "0.58" : "1");

  marker.append(line);

  return marker;
}

function eventMarkerRadii(ring: ClockRing, layerIndex: number): { inner: number; outer: number } {
  if (ring === "outer") {
    const offset = layerIndex * 1.6;
    return { inner: 89 - offset, outer: 98 - offset };
  }

  const offset = layerIndex * 1.8;
  return { inner: 62 - offset, outer: 73 - offset };
}

function markerLayerIndex(events: readonly ResolvedInstantEvent[], event: ResolvedInstantEvent, index: number): number {
  return events
    .slice(0, index)
    .filter((candidate) => candidate.ring === event.ring && candidate.angle === event.angle).length;
}

function ringDisplayAngle(angle: number): number {
  return (angle + 180) % 360;
}

function standardClockAngle(hour: number, minute: number, second: number): number {
  return ((hour % 12) + minute / 60 + second / 3600) * 30;
}

function eventColor(kind: ResolvedInstantEvent["kind"]): string {
  if (kind === "sunrise") {
    return CLOCK_COLORS.sunrise;
  }
  if (kind === "sunset") {
    return CLOCK_COLORS.sunset;
  }
  return CLOCK_COLORS.custom;
}

function displayStatus(status: ResolvedInstantEvent["status"]): string {
  if (status === "past") {
    return "עבר";
  }
  if (status === "next") {
    return "האירוע הבא";
  }
  return "עתידי";
}

function displayZmanitIndex(index: number): string {
  return `שעה זמנית ${index}`;
}

function setHandPosition(hand: SVGLineElement, angle: number): void {
  const length = Number(hand.dataset.clockLength);
  const end = pointOnClock(angle, length);
  hand.setAttribute("x2", String(end.x));
  hand.setAttribute("y2", String(end.y));
}

function pointOnClock(angleDegrees: number, radius: number): { x: number; y: number } {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: round(100 + Math.sin(radians) * radius),
    y: round(100 - Math.cos(radians) * radius)
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatEventTime(event: { readonly hour: number; readonly minute: number; readonly second?: number }): string {
  if (event.second === undefined) {
    return `${pad(event.hour)}:${pad(event.minute)}`;
  }

  return `${pad(event.hour)}:${pad(event.minute)}:${pad(event.second)}`;
}

function formatTimeWithSeconds(hour: number, minute: number, second: number): string {
  return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(tagName: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tagName);
}
