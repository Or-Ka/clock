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
  const svg = createSvgElement("svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Static analog clock");
  svg.style.display = "block";
  svg.style.width = "100%";
  svg.style.height = "100%";

  const face = createSvgElement("circle");
  face.setAttribute("cx", "100");
  face.setAttribute("cy", "100");
  face.setAttribute("r", "92");
  face.setAttribute("fill", "white");
  face.setAttribute("stroke", "currentColor");
  face.setAttribute("stroke-width", "2");
  face.dataset.clockPart = "face";
  svg.append(face);

  svg.append(createRing("outer", 88), createRing("inner", 64));
  appendRingHourLabels(svg, "outer", [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], 78);
  appendRingHourLabels(svg, "inner", [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5], 58);

  for (let hour = 0; hour < 12; hour += 1) {
    const angle = hour * 30;
    const outer = pointOnClock(angle, 48);
    const inner = pointOnClock(angle, 42);
    const tick = createSvgElement("line");
    tick.setAttribute("x1", String(inner.x));
    tick.setAttribute("y1", String(inner.y));
    tick.setAttribute("x2", String(outer.x));
    tick.setAttribute("y2", String(outer.y));
    tick.setAttribute("stroke", "currentColor");
    tick.setAttribute("stroke-linecap", "round");
    tick.setAttribute("stroke-width", "3");
    tick.dataset.clockPart = "hour-tick";
    svg.append(tick);
  }

  const eventLayer = createSvgElement("g");
  eventLayer.dataset.clockPart = "event-layer";
  svg.append(eventLayer);

  const hourHand = createHand("hour-hand", 42, 6);
  const minuteHand = createHand("minute-hand", 56, 4);
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

function createRing(ring: ClockRing, radius: number): SVGCircleElement {
  const circle = createSvgElement("circle");
  circle.setAttribute("cx", "100");
  circle.setAttribute("cy", "100");
  circle.setAttribute("r", String(radius));
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", ring === "outer" ? "#62788d" : "#91a3b5");
  circle.setAttribute("stroke-width", "1.2");
  circle.dataset.clockPart = `${ring}-ring`;
  circle.dataset.clockRing = ring;
  return circle;
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
  dom.svg.setAttribute("aria-label", `Static analog clock showing ${pad(time.hour)}:${pad(time.minute)}`);
}

function applyEvents(dom: ClockDom, events: readonly ResolvedInstantEvent[]): void {
  dom.eventLayer.replaceChildren(...events.map((event, index) => createEventMarker(event, markerLayerIndex(events, event, index))));
  dom.svg.dataset.clockEventCount = String(events.length);
}

function createEventMarker(event: ResolvedInstantEvent, layerIndex: number): SVGGElement {
  const marker = createSvgElement("g");
  const markerRadius = event.ring === "outer" ? 88 - layerIndex * 5 : 64 - layerIndex * 5;
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

  title.textContent = `${event.title}, ${pad(event.hour)}:${pad(event.minute)}, ${event.ring}, ${event.status}`;
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
