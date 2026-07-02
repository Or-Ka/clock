import { assertValidStaticClockTime, type StaticClockTime } from "../time/static-clock-time.js";

export type ClockRing = "outer" | "inner";
export type InstantEventKind = "sunrise" | "sunset" | "custom";
export type InstantEventStatus = "past" | "next" | "future";
export type EventLayerKind = "day-times" | "personal" | "api" | "custom";
export type EventDefinition = InstantEventDefinition;
export type ResolvedClockItem = ResolvedInstantEvent;

export interface InstantEventDefinition {
  readonly id: string;
  readonly type: "instant";
  readonly kind?: InstantEventKind;
  readonly title: string;
  readonly hour: number;
  readonly minute: number;
  readonly description?: string;
}

export interface EventLayerDefinition {
  readonly id: string;
  readonly title: string;
  readonly kind?: EventLayerKind;
  readonly enabled?: boolean;
  readonly events: readonly EventDefinition[];
}

export interface ResolvedInstantEvent {
  readonly id: string;
  readonly type: "instant";
  readonly kind: InstantEventKind;
  readonly title: string;
  readonly hour: number;
  readonly minute: number;
  readonly ring: ClockRing;
  readonly angle: number;
  readonly status: InstantEventStatus;
  readonly layerId?: string;
  readonly layerTitle?: string;
  readonly layerKind?: EventLayerKind;
  readonly description?: string;
}

export function ringForTime(hour: number, minute: number): ClockRing {
  assertValidStaticClockTime({ hour, minute });
  return hour >= 6 && hour < 18 ? "outer" : "inner";
}

export function dualRingAngle(hour: number, minute: number): number {
  assertValidStaticClockTime({ hour, minute });
  const minutesSinceMidnight = hour * 60 + minute;
  const shiftedMinutes = (minutesSinceMidnight - 6 * 60 + 24 * 60) % (12 * 60);
  return (shiftedMinutes / (12 * 60)) * 360;
}

export function resolveInstantEvents(
  events: readonly InstantEventDefinition[],
  currentTime: StaticClockTime
): ResolvedInstantEvent[] {
  assertValidStaticClockTime(currentTime);
  validateInstantEvents(events);

  const currentMinutes = minutesOfDay(currentTime.hour, currentTime.minute);
  const nextEventId = findNextEventId(events, currentMinutes);

  return events.map((event) => {
    const eventMinutes = minutesOfDay(event.hour, event.minute);
    const status: InstantEventStatus =
      event.id === nextEventId ? "next" : eventMinutes < currentMinutes ? "past" : "future";

    return {
      id: event.id,
      type: "instant",
      kind: event.kind ?? "custom",
      title: event.title,
      hour: event.hour,
      minute: event.minute,
      ring: ringForTime(event.hour, event.minute),
      angle: dualRingAngle(event.hour, event.minute),
      status,
      ...(event.description === undefined ? {} : { description: event.description })
    };
  });
}

export function resolveEventLayers(
  layers: readonly EventLayerDefinition[],
  currentTime: StaticClockTime
): ResolvedInstantEvent[] {
  assertValidStaticClockTime(currentTime);
  validateEventLayers(layers);

  const enabledLayerEvents = layers.flatMap((layer) =>
    layer.enabled === false
      ? []
      : layer.events.map((event) => ({
          event,
          layer
        }))
  );
  const currentMinutes = minutesOfDay(currentTime.hour, currentTime.minute);
  const nextEventId = findNextLayerEventId(enabledLayerEvents, currentMinutes);

  return enabledLayerEvents.map(({ event, layer }) => {
    if (event.type !== "instant") {
      throw new Error("Only instant events are supported in the current resolver.");
    }

    const eventMinutes = minutesOfDay(event.hour, event.minute);
    const status: InstantEventStatus =
      event.id === nextEventId ? "next" : eventMinutes < currentMinutes ? "past" : "future";

    return {
      id: event.id,
      type: "instant",
      kind: event.kind ?? "custom",
      title: event.title,
      hour: event.hour,
      minute: event.minute,
      ring: ringForTime(event.hour, event.minute),
      angle: dualRingAngle(event.hour, event.minute),
      status,
      layerId: layer.id,
      layerTitle: layer.title,
      layerKind: layer.kind ?? "custom",
      ...(event.description === undefined ? {} : { description: event.description })
    };
  });
}

function validateInstantEvents(events: readonly InstantEventDefinition[]): void {
  const ids = new Set<string>();

  for (const event of events) {
    if (!event.id) {
      throw new Error("Instant event id is required.");
    }
    if (ids.has(event.id)) {
      throw new Error(`Duplicate instant event id: ${event.id}.`);
    }
    ids.add(event.id);

    if (event.type !== "instant") {
      throw new Error("Only instant events are supported in Phase 3.");
    }
    if (event.kind !== undefined && event.kind !== "sunrise" && event.kind !== "sunset" && event.kind !== "custom") {
      throw new Error(`Unsupported instant event kind: ${event.kind}.`);
    }
    assertValidStaticClockTime({ hour: event.hour, minute: event.minute });
  }
}

function validateEventLayers(layers: readonly EventLayerDefinition[]): void {
  const layerIds = new Set<string>();
  const eventIds = new Set<string>();

  for (const layer of layers) {
    if (!layer.id) {
      throw new Error("Event layer id is required.");
    }
    if (!layer.title) {
      throw new Error("Event layer title is required.");
    }
    if (layerIds.has(layer.id)) {
      throw new Error(`Duplicate event layer id: ${layer.id}.`);
    }
    layerIds.add(layer.id);

    for (const event of layer.events) {
      if (eventIds.has(event.id)) {
        throw new Error(`Duplicate event id across layers: ${event.id}.`);
      }
      eventIds.add(event.id);
    }

    validateInstantEvents(layer.events);
  }
}

function findNextEventId(events: readonly InstantEventDefinition[], currentMinutes: number): string | undefined {
  let nextEvent: InstantEventDefinition | undefined;
  let nextMinutes = Number.POSITIVE_INFINITY;

  for (const event of events) {
    const eventMinutes = minutesOfDay(event.hour, event.minute);
    if (eventMinutes < currentMinutes || eventMinutes >= nextMinutes) {
      continue;
    }

    nextEvent = event;
    nextMinutes = eventMinutes;
  }

  return nextEvent?.id;
}

function findNextLayerEventId(
  entries: readonly { readonly event: EventDefinition; readonly layer: EventLayerDefinition }[],
  currentMinutes: number
): string | undefined {
  let nextEvent: EventDefinition | undefined;
  let nextMinutes = Number.POSITIVE_INFINITY;

  for (const { event } of entries) {
    if (event.type !== "instant") {
      continue;
    }

    const eventMinutes = minutesOfDay(event.hour, event.minute);
    if (eventMinutes < currentMinutes || eventMinutes >= nextMinutes) {
      continue;
    }

    nextEvent = event;
    nextMinutes = eventMinutes;
  }

  return nextEvent?.id;
}

function minutesOfDay(hour: number, minute: number): number {
  return hour * 60 + minute;
}
