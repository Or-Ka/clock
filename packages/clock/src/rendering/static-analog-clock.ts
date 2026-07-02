import { clockHandAngles } from "../time/clock-angles.js";
import type { ClockRing, ResolvedInstantEvent } from "../events/event-model.js";
import { assertValidStaticClockTime, type StaticClockTime } from "../time/static-clock-time.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const activeClockContainers = new WeakMap<HTMLElement, SVGSVGElement>();

export interface StaticAnalogClockOptions {
  readonly container: HTMLElement;
  readonly time: StaticClockTime;
  readonly events?: readonly ResolvedInstantEvent[];
}

export interface StaticAnalogClock {
  setTime(time: StaticClockTime): void;
  setEvents(events: readonly ResolvedInstantEvent[]): void;
  destroy(): void;
}

interface ClockDom {
  readonly svg: SVGSVGElement;
  readonly eventLayer: SVGGElement;
  readonly weekdayLabel: SVGTextElement;
  readonly hebrewDateLine1: SVGTextElement;
  readonly hebrewDateLine2: SVGTextElement;
  readonly gregorianDateLine1: SVGTextElement;
  readonly gregorianDateLine2: SVGTextElement;
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

  const face = createSvgElement("circle");
  face.setAttribute("cx", "100");
  face.setAttribute("cy", "100");
  face.setAttribute("r", "98");
  face.setAttribute("fill", "white");
  face.setAttribute("stroke", "#cbd5df");
  face.setAttribute("stroke-width", "1.2");
  face.dataset.clockPart = "face";
  svg.append(face);

  appendMinuteTicks(svg);
  svg.append(createRing("outer", 80), createRing("inner", 58));
  appendRingHourLabels(svg, "outer", [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], 80);
  appendRingHourLabels(svg, "inner", [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5], 58);

  const eventLayer = createSvgElement("g");
  eventLayer.dataset.clockPart = "event-layer";
  svg.append(eventLayer);

  const dateDisplay = createDateDisplay();
  svg.append(dateDisplay.group);

  const hourHand = createHand("hour-hand", 34, 3.2, "#213447");
  const minuteHand = createHand("minute-hand", 50, 2.4, "#213447");
  const secondHand = createHand("second-hand", 56, 1, "#b64a3a");
  svg.append(hourHand, minuteHand, secondHand);

  const pin = createSvgElement("circle");
  pin.setAttribute("cx", "100");
  pin.setAttribute("cy", "100");
  pin.setAttribute("r", "4");
  pin.setAttribute("fill", "currentColor");
  pin.dataset.clockPart = "center-pin";
  svg.append(pin);

  return {
    svg,
    eventLayer,
    weekdayLabel: dateDisplay.weekdayLabel,
    hebrewDateLine1: dateDisplay.hebrewDateLine1,
    hebrewDateLine2: dateDisplay.hebrewDateLine2,
    gregorianDateLine1: dateDisplay.gregorianDateLine1,
    gregorianDateLine2: dateDisplay.gregorianDateLine2,
    hourHand,
    minuteHand,
    secondHand
  };
}

function createRing(ring: ClockRing, radius: number): SVGCircleElement {
  const circle = createSvgElement("circle");
  circle.setAttribute("cx", "100");
  circle.setAttribute("cy", "100");
  circle.setAttribute("r", String(radius));
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", ring === "outer" ? "#d69a49" : "#5f7fa6");
  circle.setAttribute("stroke-width", "2.4");
  circle.dataset.clockPart = `${ring}-ring`;
  circle.dataset.clockRing = ring;
  return circle;
}

function appendMinuteTicks(svg: SVGSVGElement): void {
  for (let minute = 0; minute < 60; minute += 1) {
    const isHourTick = minute % 5 === 0;
    const angle = minute * 6;
    const outer = pointOnClock(angle, 97);
    const inner = pointOnClock(angle, isHourTick ? 90 : 94);
    const tick = createSvgElement("line");
    tick.setAttribute("x1", String(inner.x));
    tick.setAttribute("y1", String(inner.y));
    tick.setAttribute("x2", String(outer.x));
    tick.setAttribute("y2", String(outer.y));
    tick.setAttribute("stroke", isHourTick ? "#243746" : "#8fa1b2");
    tick.setAttribute("stroke-linecap", "butt");
    tick.setAttribute("stroke-width", isHourTick ? "1.5" : "0.7");
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
    label.setAttribute("font-size", ring === "outer" ? "7.2" : "6.6");
    label.setAttribute("font-weight", "700");
    label.setAttribute("fill", ring === "outer" ? "#17293a" : "#26384a");
    label.setAttribute("paint-order", "stroke");
    label.setAttribute("stroke", "white");
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
  hebrewDateLine1: SVGTextElement;
  hebrewDateLine2: SVGTextElement;
  gregorianDateLine1: SVGTextElement;
  gregorianDateLine2: SVGTextElement;
} {
  const group = createSvgElement("g");
  group.dataset.clockPart = "date-display";
  group.setAttribute("direction", "rtl");

  const weekdayLabel = createDateLine("weekday-label", 69, "5.4", "700", "#5b6672");
  const hebrewDateLine1 = createDateLine("hebrew-date-line-1", 78, "5.9", "800", "#1f2933");
  const hebrewDateLine2 = createDateLine("hebrew-date-line-2", 86, "5.4", "700", "#334155");
  const gregorianDateLine1 = createDateLine("gregorian-date-line-1", 121, "5.7", "800", "#1f2933");
  const gregorianDateLine2 = createDateLine("gregorian-date-line-2", 129, "5.3", "700", "#334155");

  group.append(weekdayLabel, hebrewDateLine1, hebrewDateLine2, gregorianDateLine1, gregorianDateLine2);
  return { group, weekdayLabel, hebrewDateLine1, hebrewDateLine2, gregorianDateLine1, gregorianDateLine2 };
}

function createDateLine(part: string, y: number, fontSize: string, fontWeight: string, fill: string): SVGTextElement {
  const label = createSvgElement("text");
  label.setAttribute("x", "100");
  label.setAttribute("y", String(y));
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "central");
  label.setAttribute("font-size", fontSize);
  label.setAttribute("font-weight", fontWeight);
  label.setAttribute("fill", fill);
  label.setAttribute("paint-order", "stroke");
  label.setAttribute("stroke", "white");
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
  dom.svg.dataset.clockHourAngle = String(angles.hourAngle);
  dom.svg.dataset.clockMinuteAngle = String(angles.minuteAngle);
  dom.svg.dataset.clockSecondAngle = String(secondAngle);
  applyDateDisplay(dom, time);
  dom.svg.setAttribute("aria-label", `שעון אנלוגי מציג ${pad(time.hour)}:${pad(time.minute)}`);
}

function applyDateDisplay(dom: ClockDom, time: StaticClockTime): void {
  const display = time.dateDisplay;
  dom.weekdayLabel.textContent = display?.weekday ?? "";
  dom.hebrewDateLine1.textContent = display?.hebrewDateLine1 ?? "";
  dom.hebrewDateLine2.textContent = display?.hebrewDateLine2 ?? "";
  dom.gregorianDateLine1.textContent = display?.gregorianDateLine1 ?? "";
  dom.gregorianDateLine2.textContent = display?.gregorianDateLine2 ?? "";
}

function applyEvents(dom: ClockDom, events: readonly ResolvedInstantEvent[]): void {
  dom.eventLayer.replaceChildren(...events.map((event, index) => createEventMarker(event, markerLayerIndex(events, event, index))));
  dom.svg.dataset.clockEventCount = String(events.length);
}

function createEventMarker(event: ResolvedInstantEvent, layerIndex: number): SVGGElement {
  const marker = createSvgElement("g");
  const markerRadius = event.ring === "outer" ? 80 - layerIndex * 5 : 58 - layerIndex * 5;
  const displayAngle = ringDisplayAngle(event.angle);
  const inner = pointOnClock(displayAngle, markerRadius - 3);
  const outer = pointOnClock(displayAngle, markerRadius + 3);
  const dot = pointOnClock(displayAngle, markerRadius);
  const line = createSvgElement("line");
  const circle = createSvgElement("circle");
  const title = createSvgElement("title");

  marker.dataset.clockPart = "event-marker";
  marker.dataset.eventId = event.id;
  marker.dataset.eventKind = event.kind;
  marker.dataset.eventStatus = event.status;
  marker.dataset.clockRing = event.ring;
  marker.dataset.eventAngle = String(event.angle);
  marker.dataset.eventDisplayAngle = String(displayAngle);
  if (event.layerId !== undefined) {
    marker.dataset.eventLayerId = event.layerId;
  }
  if (event.layerKind !== undefined) {
    marker.dataset.eventLayerKind = event.layerKind;
  }

  line.setAttribute("x1", String(inner.x));
  line.setAttribute("y1", String(inner.y));
  line.setAttribute("x2", String(outer.x));
  line.setAttribute("y2", String(outer.y));
  line.setAttribute("stroke", eventColor(event.kind));
  line.setAttribute("stroke-width", event.status === "next" ? "3" : "2");
  line.setAttribute("stroke-linecap", "butt");
  line.setAttribute("opacity", event.status === "past" ? "0.45" : "1");

  circle.setAttribute("cx", String(dot.x));
  circle.setAttribute("cy", String(dot.y));
  circle.setAttribute("r", event.status === "next" ? "3.4" : "2.4");
  circle.setAttribute("fill", eventColor(event.kind));
  circle.setAttribute("stroke", event.status === "next" ? "#111827" : "white");
  circle.setAttribute("stroke-width", event.status === "next" ? "1.4" : "0.8");
  circle.setAttribute("opacity", event.status === "past" ? "0.45" : "1");

  title.textContent = `${event.title}, ${pad(event.hour)}:${pad(event.minute)}, ${displayRing(event.ring)}, ${displayStatus(event.status)}`;
  marker.append(title, line, circle);

  return marker;
}

function markerLayerIndex(events: readonly ResolvedInstantEvent[], event: ResolvedInstantEvent, index: number): number {
  return events
    .slice(0, index)
    .filter((candidate) => candidate.ring === event.ring && candidate.angle === event.angle).length;
}

function ringDisplayAngle(angle: number): number {
  return (angle + 180) % 360;
}

function eventColor(kind: ResolvedInstantEvent["kind"]): string {
  if (kind === "sunrise") {
    return "#e76f51";
  }
  if (kind === "sunset") {
    return "#5b5f97";
  }
  return "#2a9d8f";
}

function displayRing(ring: ClockRing): string {
  return ring === "outer" ? "טבעת יום" : "טבעת לילה";
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

function createSvgElement<K extends keyof SVGElementTagNameMap>(tagName: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tagName);
}
