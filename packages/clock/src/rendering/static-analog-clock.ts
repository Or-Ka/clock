import { clockHandAngles } from "../time/clock-angles.js";
import type { ClockRing, ResolvedInstantEvent } from "../events/event-model.js";
import { assertValidStaticClockTime, type StaticClockTime } from "../time/static-clock-time.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const activeClockContainers = new WeakMap<HTMLElement, SVGSVGElement>();
let nextClockId = 0;

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
  readonly hourHand: SVGLineElement;
  readonly minuteHand: SVGLineElement;
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
  const clockId = nextClockId;
  nextClockId += 1;

  const svg = createSvgElement("svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "שעון אנלוגי");
  svg.style.display = "block";
  svg.style.width = "100%";
  svg.style.height = "100%";

  svg.append(createDefs(clockId));

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
  svg.append(
    createRing("outer", 80, `url(#clock-${clockId}-day-ring)`),
    createRing("inner", 58, `url(#clock-${clockId}-night-ring)`)
  );
  appendTransitionMarkers(svg);
  appendRingHourLabels(svg, "outer", [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], 71);
  appendRingHourLabels(svg, "inner", [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5], 50);
  appendClockNumbers(svg);

  const eventLayer = createSvgElement("g");
  eventLayer.dataset.clockPart = "event-layer";
  svg.append(eventLayer);

  const hourHand = createHand("hour-hand", 34, 6);
  const minuteHand = createHand("minute-hand", 47, 4);
  svg.append(hourHand, minuteHand);

  const pin = createSvgElement("circle");
  pin.setAttribute("cx", "100");
  pin.setAttribute("cy", "100");
  pin.setAttribute("r", "4");
  pin.setAttribute("fill", "currentColor");
  pin.dataset.clockPart = "center-pin";
  svg.append(pin);

  return { svg, eventLayer, hourHand, minuteHand };
}

function createDefs(clockId: number): SVGDefsElement {
  const defs = createSvgElement("defs");
  defs.append(
    createLinearGradient(`clock-${clockId}-day-ring`, [
      ["0%", "#f7c76f"],
      ["52%", "#f1a85b"],
      ["100%", "#7a86b8"]
    ]),
    createLinearGradient(`clock-${clockId}-night-ring`, [
      ["0%", "#8ab6d6"],
      ["48%", "#4f5d95"],
      ["100%", "#f1b764"]
    ])
  );
  return defs;
}

function createLinearGradient(id: string, stops: readonly (readonly [string, string])[]): SVGLinearGradientElement {
  const gradient = createSvgElement("linearGradient");
  gradient.setAttribute("id", id);
  gradient.setAttribute("x1", "0");
  gradient.setAttribute("y1", "0");
  gradient.setAttribute("x2", "1");
  gradient.setAttribute("y2", "0");

  for (const [offset, color] of stops) {
    const stop = createSvgElement("stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", color);
    gradient.append(stop);
  }

  return gradient;
}

function createRing(ring: ClockRing, radius: number, stroke: string): SVGCircleElement {
  const circle = createSvgElement("circle");
  circle.setAttribute("cx", "100");
  circle.setAttribute("cy", "100");
  circle.setAttribute("r", String(radius));
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", stroke);
  circle.setAttribute("stroke-width", "3.2");
  circle.setAttribute("stroke-linecap", "round");
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
    tick.setAttribute("stroke-linecap", "round");
    tick.setAttribute("stroke-width", isHourTick ? "2.4" : "1");
    tick.dataset.clockPart = isHourTick ? "hour-tick" : "minute-tick";
    tick.dataset.clockTickKind = isHourTick ? "hour" : "minute";
    tick.dataset.clockTickMinute = String(minute);
    svg.append(tick);
  }
}

function appendClockNumbers(svg: SVGSVGElement): void {
  for (let number = 1; number <= 12; number += 1) {
    const angle = (number % 12) * 30;
    const point = pointOnClock(angle, 38);
    const label = createSvgElement("text");
    label.textContent = String(number);
    label.setAttribute("x", String(point.x));
    label.setAttribute("y", String(point.y));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "central");
    label.setAttribute("font-size", "9");
    label.setAttribute("font-weight", "800");
    label.setAttribute("fill", "#1f2933");
    label.dataset.clockPart = "clock-hour-number";
    label.dataset.clockHourNumber = String(number);
    label.dataset.clockAngle = String(angle);
    svg.append(label);
  }
}

function appendRingHourLabels(svg: SVGSVGElement, ring: ClockRing, hours: readonly number[], radius: number): void {
  for (const hour of hours) {
    const angle = ((hour * 60 - 6 * 60 + 24 * 60) % (12 * 60)) / 2;
    const point = pointOnClock(angle, radius);
    const label = createSvgElement("text");
    label.textContent = pad(hour);
    label.setAttribute("x", String(point.x));
    label.setAttribute("y", String(point.y));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "central");
    label.setAttribute("font-size", ring === "outer" ? "8" : "7");
    label.setAttribute("font-weight", "700");
    label.setAttribute("fill", ring === "outer" ? "#243746" : "#52616f");
    label.dataset.clockPart = "ring-hour-label";
    label.dataset.clockRing = ring;
    label.dataset.clockHour = pad(hour);
    svg.append(label);
  }
}

function appendTransitionMarkers(svg: SVGSVGElement): void {
  svg.append(
    createTransitionMarker("morning", "מעבר 05:59 ל-06:00", -7, 7, "#2f6f60"),
    createTransitionMarker("evening", "מעבר 17:59 ל-18:00", 7, -7, "#8a4d20")
  );
}

function createTransitionMarker(
  transition: "morning" | "evening",
  label: string,
  startAngle: number,
  endAngle: number,
  color: string
): SVGGElement {
  const group = createSvgElement("g");
  const startRadius = transition === "morning" ? 58 : 80;
  const endRadius = transition === "morning" ? 80 : 58;
  const start = pointOnClock(startAngle, startRadius);
  const end = pointOnClock(endAngle, endRadius);
  const control = pointOnClock(0, 70);
  const path = createSvgElement("path");
  const dot = createSvgElement("circle");
  const title = createSvgElement("title");

  path.setAttribute("d", `M ${start.x} ${start.y} Q ${control.x} ${control.y - 6} ${end.x} ${end.y}`);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", "1.8");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("opacity", "0.88");

  dot.setAttribute("cx", String(control.x));
  dot.setAttribute("cy", String(control.y - 6));
  dot.setAttribute("r", "2");
  dot.setAttribute("fill", color);
  dot.setAttribute("stroke", "white");
  dot.setAttribute("stroke-width", "0.7");

  title.textContent = label;
  group.dataset.clockPart = "transition-marker";
  group.dataset.transition = transition;
  group.append(title, path, dot);
  return group;
}

function createHand(part: string, length: number, width: number): SVGLineElement {
  const hand = createSvgElement("line");
  hand.setAttribute("x1", "100");
  hand.setAttribute("y1", "100");
  hand.setAttribute("stroke", "currentColor");
  hand.setAttribute("stroke-linecap", "round");
  hand.setAttribute("stroke-width", String(width));
  hand.dataset.clockPart = part;
  hand.dataset.clockLength = String(length);
  return hand;
}

function applyTime(dom: ClockDom, time: StaticClockTime): void {
  const angles = clockHandAngles(time);
  setHandPosition(dom.hourHand, angles.hourAngle);
  setHandPosition(dom.minuteHand, angles.minuteAngle);
  dom.svg.dataset.clockHourAngle = String(angles.hourAngle);
  dom.svg.dataset.clockMinuteAngle = String(angles.minuteAngle);
  dom.svg.setAttribute("aria-label", `שעון אנלוגי מציג ${pad(time.hour)}:${pad(time.minute)}`);
}

function applyEvents(dom: ClockDom, events: readonly ResolvedInstantEvent[]): void {
  dom.eventLayer.replaceChildren(...events.map((event, index) => createEventMarker(event, markerLayerIndex(events, event, index))));
  dom.svg.dataset.clockEventCount = String(events.length);
}

function createEventMarker(event: ResolvedInstantEvent, layerIndex: number): SVGGElement {
  const marker = createSvgElement("g");
  const markerRadius = event.ring === "outer" ? 80 - layerIndex * 5 : 58 - layerIndex * 5;
  const inner = pointOnClock(event.angle, markerRadius - 3);
  const outer = pointOnClock(event.angle, markerRadius + 3);
  const dot = pointOnClock(event.angle, markerRadius);
  const line = createSvgElement("line");
  const circle = createSvgElement("circle");
  const title = createSvgElement("title");

  marker.dataset.clockPart = "event-marker";
  marker.dataset.eventId = event.id;
  marker.dataset.eventKind = event.kind;
  marker.dataset.eventStatus = event.status;
  marker.dataset.clockRing = event.ring;
  marker.dataset.eventAngle = String(event.angle);

  line.setAttribute("x1", String(inner.x));
  line.setAttribute("y1", String(inner.y));
  line.setAttribute("x2", String(outer.x));
  line.setAttribute("y2", String(outer.y));
  line.setAttribute("stroke", eventColor(event.kind));
  line.setAttribute("stroke-width", event.status === "next" ? "3" : "2");
  line.setAttribute("stroke-linecap", "round");
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

  if (event.status === "next" || event.title.length <= 10) {
    marker.append(createEventLabel(event, markerRadius - 9));
  }

  return marker;
}

function createEventLabel(event: ResolvedInstantEvent, radius: number): SVGTextElement {
  const point = pointOnClock(event.angle, radius);
  const label = createSvgElement("text");
  label.textContent = event.title;
  label.setAttribute("x", String(point.x));
  label.setAttribute("y", String(point.y));
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "central");
  label.setAttribute("font-size", event.status === "next" ? "5.8" : "5");
  label.setAttribute("font-weight", event.status === "next" ? "700" : "600");
  label.setAttribute("fill", event.status === "past" ? "#7c8d9b" : "#1f2933");
  label.dataset.clockPart = "event-label";
  label.dataset.eventId = event.id;
  return label;
}

function markerLayerIndex(events: readonly ResolvedInstantEvent[], event: ResolvedInstantEvent, index: number): number {
  return events
    .slice(0, index)
    .filter((candidate) => candidate.ring === event.ring && candidate.angle === event.angle).length;
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
