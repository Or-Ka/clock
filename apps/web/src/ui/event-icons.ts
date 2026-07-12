export type EventIconId =
  | "sunrise"
  | "moon"
  | "dawn"
  | "tefillin"
  | "open-book"
  | "half-disc"
  | "stars"
  | "candles"
  | "spark"
  | "dot"
  | "diamond"
  | "target";

export const EVENT_ICON_OPTIONS: readonly { readonly id: EventIconId; readonly label: string }[] = [
  { id: "sunrise", label: "זריחה" },
  { id: "moon", label: "ירח" },
  { id: "dawn", label: "שחר" },
  { id: "tefillin", label: "תפילין" },
  { id: "open-book", label: "ספר פתוח" },
  { id: "half-disc", label: "חצות" },
  { id: "stars", label: "כוכבים" },
  { id: "candles", label: "נרות" },
  { id: "spark", label: "ניצוץ" },
  { id: "dot", label: "נקודה" },
  { id: "diamond", label: "מעוין" },
  { id: "target", label: "יעד" }
];

export function createHtmlIcon(icon: EventIconId): SVGSVGElement {
  const svg = createSvgIconShell();
  svg.classList.add("event-icon");
  appendIconPaths(svg, icon);
  return svg;
}

export function createClockIcon(icon: EventIconId, x: string, y: string, color: string): SVGGElement {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.dataset.clockPart = "event-symbol";
  group.setAttribute("transform", `translate(${x} ${y}) scale(0.34) translate(-12 -12)`);
  group.setAttribute("color", color);
  group.setAttribute("stroke", "currentColor");
  group.setAttribute("fill", "none");
  group.setAttribute("stroke-width", "1.9");
  group.setAttribute("stroke-linecap", "round");
  group.setAttribute("stroke-linejoin", "round");
  appendIconPaths(group, icon);
  return group;
}

function createSvgIconShell(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}

function appendIconPaths(parent: SVGElement, icon: EventIconId): void {
  for (const part of iconParts(icon)) {
    if (part.tag === "circle") {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", part.cx);
      circle.setAttribute("cy", part.cy);
      circle.setAttribute("r", part.r);
      if (part.fill !== undefined) {
        circle.setAttribute("fill", part.fill);
      }
      parent.append(circle);
      continue;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", part.d);
    if (part.fill !== undefined) {
      path.setAttribute("fill", part.fill);
    }
    parent.append(path);
  }
}

function iconParts(icon: EventIconId): readonly (
  | { readonly tag: "path"; readonly d: string; readonly fill?: string }
  | { readonly tag: "circle"; readonly cx: string; readonly cy: string; readonly r: string; readonly fill?: string }
)[] {
  if (icon === "sunrise") {
    return [
      { tag: "path", d: "M4 17h16" },
      { tag: "path", d: "M7 17a5 5 0 0 1 10 0" },
      { tag: "path", d: "M12 4v3" },
      { tag: "path", d: "m5.8 8.2 2.1 2.1" },
      { tag: "path", d: "m18.2 8.2-2.1 2.1" }
    ];
  }
  if (icon === "moon") {
    return [{ tag: "path", d: "M18.5 15.5A7 7 0 0 1 8.6 5.6 8 8 0 1 0 18.5 15.5Z" }];
  }
  if (icon === "dawn") {
    return [
      { tag: "path", d: "M4 18h16" },
      { tag: "path", d: "M7 15h10" },
      { tag: "path", d: "M9 15a3 3 0 0 1 6 0" },
      { tag: "path", d: "M12 7v3" },
      { tag: "path", d: "M5.5 11.5h2" },
      { tag: "path", d: "M16.5 11.5h2" }
    ];
  }
  if (icon === "tefillin") {
    return [
      { tag: "path", d: "M8 7h8v8H8z" },
      { tag: "path", d: "M10 5h4" },
      { tag: "path", d: "M12 15v5" },
      { tag: "path", d: "M8 18c-2 0-3-1-3-2.5S6.4 13 8 13" },
      { tag: "path", d: "M16 18c2 0 3-1 3-2.5S17.6 13 16 13" }
    ];
  }
  if (icon === "open-book") {
    return [
      { tag: "path", d: "M4 6.5c2.7-.8 5.2-.2 8 1.5v11c-2.8-1.7-5.3-2.3-8-1.5z" },
      { tag: "path", d: "M20 6.5c-2.7-.8-5.2-.2-8 1.5v11c2.8-1.7 5.3-2.3 8-1.5z" },
      { tag: "path", d: "M12 8v11" }
    ];
  }
  if (icon === "half-disc") {
    return [
      { tag: "circle", cx: "12", cy: "12", r: "7" },
      { tag: "path", d: "M12 5a7 7 0 0 1 0 14Z", fill: "currentColor" }
    ];
  }
  if (icon === "stars") {
    return [
      { tag: "path", d: "M12 3v5" },
      { tag: "path", d: "M9.5 5.5h5" },
      { tag: "path", d: "m10.4 4.4 3.2 3.2" },
      { tag: "path", d: "m13.6 4.4-3.2 3.2" },
      { tag: "path", d: "M6 14v3" },
      { tag: "path", d: "M4.5 15.5h3" },
      { tag: "path", d: "M18 13v4" },
      { tag: "path", d: "M16 15h4" }
    ];
  }
  if (icon === "candles") {
    return [
      { tag: "path", d: "M8 10h3v9H8z" },
      { tag: "path", d: "M13 9h3v10h-3z" },
      { tag: "path", d: "M9.5 6c1.2 1 1.2 2.3 0 3.2C8.3 8.3 8.3 7 9.5 6Z" },
      { tag: "path", d: "M14.5 5c1.2 1 1.2 2.3 0 3.2-1.2-.9-1.2-2.2 0-3.2Z" },
      { tag: "path", d: "M6 19h12" }
    ];
  }
  if (icon === "spark") {
    return [
      { tag: "path", d: "M12 3v6" },
      { tag: "path", d: "M12 15v6" },
      { tag: "path", d: "M3 12h6" },
      { tag: "path", d: "M15 12h6" },
      { tag: "path", d: "m7 7 3 3" },
      { tag: "path", d: "m14 14 3 3" },
      { tag: "path", d: "m17 7-3 3" },
      { tag: "path", d: "m10 14-3 3" }
    ];
  }
  if (icon === "dot") {
    return [{ tag: "circle", cx: "12", cy: "12", r: "5", fill: "currentColor" }];
  }
  if (icon === "diamond") {
    return [{ tag: "path", d: "m12 4 8 8-8 8-8-8z" }];
  }
  return [
    { tag: "circle", cx: "12", cy: "12", r: "7" },
    { tag: "circle", cx: "12", cy: "12", r: "2", fill: "currentColor" }
  ];
}
