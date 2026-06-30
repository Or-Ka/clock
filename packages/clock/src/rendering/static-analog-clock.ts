import { clockHandAngles } from "../time/clock-angles.js";
import { assertValidStaticClockTime, type StaticClockTime } from "../time/static-clock-time.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export interface StaticAnalogClockOptions {
  readonly container: HTMLElement;
  readonly time: StaticClockTime;
}

export interface StaticAnalogClock {
  setTime(time: StaticClockTime): void;
  destroy(): void;
}

interface ClockDom {
  readonly svg: SVGSVGElement;
  readonly hourHand: SVGLineElement;
  readonly minuteHand: SVGLineElement;
}

export function createStaticAnalogClock(options: StaticAnalogClockOptions): StaticAnalogClock {
  assertValidStaticClockTime(options.time);

  const dom = createClockDom();
  let resizeObserver: ResizeObserver | undefined;
  let destroyed = false;

  options.container.replaceChildren(dom.svg);
  applyTime(dom, options.time);

  const updateSizeState = () => {
    const { width, height } = options.container.getBoundingClientRect();
    dom.svg.dataset.clockWidth = String(Math.round(width));
    dom.svg.dataset.clockHeight = String(Math.round(height));
  };

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(updateSizeState);
    resizeObserver.observe(options.container);
  }

  updateSizeState();

  return {
    setTime(time: StaticClockTime) {
      if (destroyed) {
        throw new Error("Cannot update a destroyed static analog clock.");
      }

      assertValidStaticClockTime(time);
      applyTime(dom, time);
    },
    destroy() {
      if (destroyed) {
        return;
      }

      resizeObserver?.disconnect();
      options.container.replaceChildren();
      destroyed = true;
    }
  };
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

  for (let hour = 0; hour < 12; hour += 1) {
    const angle = hour * 30;
    const outer = pointOnClock(angle, 82);
    const inner = pointOnClock(angle, 70);
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

  const hourHand = createHand("hour-hand", 52, 6);
  const minuteHand = createHand("minute-hand", 72, 4);
  svg.append(hourHand, minuteHand);

  const pin = createSvgElement("circle");
  pin.setAttribute("cx", "100");
  pin.setAttribute("cy", "100");
  pin.setAttribute("r", "4");
  pin.setAttribute("fill", "currentColor");
  pin.dataset.clockPart = "center-pin";
  svg.append(pin);

  return { svg, hourHand, minuteHand };
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
