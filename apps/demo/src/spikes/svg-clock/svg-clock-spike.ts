const SVG_NS = "http://www.w3.org/2000/svg";

export interface SvgClockSpikeHandle {
  destroy(): void;
}

export interface SvgClockSpikeOptions {
  fixedTime: string;
  markerTime: string;
  markerTitle: string;
  statusTarget: HTMLElement;
}

type ListenerTarget = HTMLElement | SVGElement | Window;

interface RegisteredListener {
  target: ListenerTarget;
  type: string;
  listener: EventListener;
}

export function renderSvgClockSpike(
  container: HTMLElement,
  options: SvgClockSpikeOptions
): SvgClockSpikeHandle {
  const listeners: RegisteredListener[] = [];
  const fixedDate = new Date(options.fixedTime);
  const markerDate = new Date(options.markerTime);

  container.replaceChildren();

  const svg = createSvgElement("svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `שעון אנלוגי, שעה קבועה ${formatTime(fixedDate)}`);
  svg.classList.add("clock-svg");

  const face = createSvgElement("circle");
  face.setAttribute("cx", "100");
  face.setAttribute("cy", "100");
  face.setAttribute("r", "92");
  face.classList.add("clock-face");
  svg.append(face);

  drawTicks(svg);
  drawHand(svg, hourAngle(fixedDate), 48, "hour-hand");
  drawHand(svg, minuteAngle(fixedDate), 70, "minute-hand");
  drawMarker(svg, markerDate, options.markerTitle, options.statusTarget, listeners);

  const pin = createSvgElement("circle");
  pin.setAttribute("cx", "100");
  pin.setAttribute("cy", "100");
  pin.setAttribute("r", "4");
  pin.classList.add("center-pin");
  svg.append(pin);

  container.append(svg);

  const updateResponsiveState = () => {
    const width = Math.round(container.getBoundingClientRect().width);
    container.dataset.observedWidth = String(width);
    container.dataset.clockDensity = width < 220 ? "compact" : "comfortable";
  };

  const resizeObserver = new ResizeObserver(updateResponsiveState);
  resizeObserver.observe(container);
  updateResponsiveState();

  addListener(window, "resize", updateResponsiveState, listeners);

  return {
    destroy() {
      resizeObserver.disconnect();
      for (const registered of listeners) {
        registered.target.removeEventListener(registered.type, registered.listener);
      }
      listeners.length = 0;
      container.replaceChildren();
    }
  };
}

function drawTicks(svg: SVGSVGElement): void {
  for (let index = 0; index < 60; index += 1) {
    const isHour = index % 5 === 0;
    const angle = index * 6;
    const outer = pointOnClock(angle, 84);
    const inner = pointOnClock(angle, isHour ? 72 : 79);
    const tick = createSvgElement("line");
    tick.setAttribute("x1", String(inner.x));
    tick.setAttribute("y1", String(inner.y));
    tick.setAttribute("x2", String(outer.x));
    tick.setAttribute("y2", String(outer.y));
    tick.classList.add(isHour ? "hour-tick" : "minute-tick");
    svg.append(tick);
  }
}

function drawHand(svg: SVGSVGElement, angle: number, length: number, className: string): void {
  const end = pointOnClock(angle, length);
  const hand = createSvgElement("line");
  hand.setAttribute("x1", "100");
  hand.setAttribute("y1", "100");
  hand.setAttribute("x2", String(end.x));
  hand.setAttribute("y2", String(end.y));
  hand.classList.add("clock-hand", className);
  svg.append(hand);
}

function drawMarker(
  svg: SVGSVGElement,
  markerDate: Date,
  title: string,
  statusTarget: HTMLElement,
  listeners: RegisteredListener[]
): void {
  const angle = hourAngle(markerDate);
  const position = pointOnClock(angle, 62);
  const marker = createSvgElement("g");
  marker.setAttribute("tabindex", "0");
  marker.setAttribute("role", "button");
  marker.setAttribute("aria-label", `${title}, ${formatTime(markerDate)}`);
  marker.classList.add("event-marker");

  const focusRing = createSvgElement("circle");
  focusRing.setAttribute("cx", String(position.x));
  focusRing.setAttribute("cy", String(position.y));
  focusRing.setAttribute("r", "12");
  focusRing.classList.add("marker-focus-ring");

  const dot = createSvgElement("circle");
  dot.setAttribute("cx", String(position.x));
  dot.setAttribute("cy", String(position.y));
  dot.setAttribute("r", "7");
  dot.classList.add("marker-dot");

  const label = createSvgElement("text");
  label.setAttribute("x", String(position.x));
  label.setAttribute("y", String(position.y - 15));
  label.setAttribute("text-anchor", "middle");
  label.classList.add("marker-label");
  label.textContent = title;

  marker.append(focusRing, dot, label);
  svg.append(marker);

  const activate = () => {
    marker.classList.toggle("event-marker--selected");
    statusTarget.textContent = `${title}: ${formatTime(markerDate)}`;
  };

  addListener(marker, "click", activate, listeners);
  addListener(
    marker,
    "keydown",
    (event) => {
      if (!(event instanceof KeyboardEvent)) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    },
    listeners
  );
}

function addListener(
  target: ListenerTarget,
  type: string,
  listener: EventListener,
  listeners: RegisteredListener[]
): void {
  target.addEventListener(type, listener);
  listeners.push({ target, type, listener });
}

function hourAngle(date: Date): number {
  return (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;
}

function minuteAngle(date: Date): number {
  return date.getMinutes() * 6;
}

function pointOnClock(angleDegrees: number, radius: number): { x: number; y: number } {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: round(100 + Math.sin(radians) * radius),
    y: round(100 - Math.cos(radians) * radius)
  };
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem"
  }).format(date);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(tagName: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tagName);
}
