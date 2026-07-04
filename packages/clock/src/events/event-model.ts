import { assertValidStaticClockTime, type StaticClockTime } from "../time/static-clock-time.js";

export type ClockRing = "outer" | "inner";
export type InstantEventKind = "sunrise" | "sunset" | "custom";
export type InstantEventStatus = "past" | "next" | "future";
export type EventLayerKind = "day-times" | "personal" | "special" | "api" | "custom";
export type EventDefinition = InstantEventDefinition;
export type ResolvedClockItem = ResolvedInstantEvent;

export interface InstantEventDefinition {
  readonly id: string;
  readonly type: "instant";
  readonly kind?: InstantEventKind;
  readonly title: string;
  readonly hour: number;
  readonly minute: number;
  readonly second?: number;
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
  readonly second?: number;
  readonly ring: ClockRing;
  readonly angle: number;
  readonly status: InstantEventStatus;
  readonly layerId?: string;
  readonly layerTitle?: string;
  readonly layerKind?: EventLayerKind;
  readonly description?: string;
}

export function ringForTime(hour: number, minute: number, second = 0): ClockRing {
  assertValidStaticClockTime({ hour, minute, second });
  return hour >= 6 && hour < 18 ? "outer" : "inner";
}

export function dualRingAngle(hour: number, minute: number, second = 0): number {
  assertValidStaticClockTime({ hour, minute, second });
  const secondsSinceMidnight = secondsOfDay(hour, minute, second);
  const shiftedSeconds = (secondsSinceMidnight - 6 * 60 * 60 + 24 * 60 * 60) % (12 * 60 * 60);
  return (shiftedSeconds / (12 * 60 * 60)) * 360;
}

export function resolveInstantEvents(
  events: readonly InstantEventDefinition[],
  currentTime: StaticClockTime
): ResolvedInstantEvent[] {
  assertValidStaticClockTime(currentTime);
  validateInstantEvents(events);

  const currentSeconds = secondsOfDay(currentTime.hour, currentTime.minute, currentTime.second ?? 0);
  const nextEventId = findNextEventId(events, currentSeconds);

  return events.map((event) => resolveEvent(event, currentSeconds, nextEventId));
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
  const currentSeconds = secondsOfDay(currentTime.hour, currentTime.minute, currentTime.second ?? 0);
  const nextEventId = findNextEventId(
    enabledLayerEvents.map((entry) => entry.event),
    currentSeconds
  );

  return enabledLayerEvents.map(({ event, layer }) => resolveEvent(event, currentSeconds, nextEventId, layer));
}

// Builds a ResolvedInstantEvent for a single event; when a layer is supplied its
// identity is attached. Shared by resolveInstantEvents and resolveEventLayers.
function resolveEvent(
  event: EventDefinition,
  currentSeconds: number,
  nextEventId: string | undefined,
  layer?: EventLayerDefinition
): ResolvedInstantEvent {
  if (event.type !== "instant") {
    throw new Error("Only instant events are supported in the current resolver.");
  }

  const eventSeconds = eventSecondsOfDay(event);
  const status: InstantEventStatus =
    event.id === nextEventId ? "next" : eventSeconds < currentSeconds ? "past" : "future";

  return {
    id: event.id,
    type: "instant",
    kind: event.kind ?? "custom",
    title: event.title,
    hour: event.hour,
    minute: event.minute,
    ...(event.second === undefined ? {} : { second: event.second }),
    ring: ringForTime(event.hour, event.minute, event.second ?? 0),
    angle: dualRingAngle(event.hour, event.minute, event.second ?? 0),
    status,
    ...(layer === undefined
      ? {}
      : { layerId: layer.id, layerTitle: layer.title, layerKind: layer.kind ?? "custom" }),
    ...(event.description === undefined ? {} : { description: event.description })
  };
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
    assertValidStaticClockTime({ hour: event.hour, minute: event.minute, second: event.second ?? 0 });
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

// Returns the id of the earliest event at or after the current time; skips
// non-instant events (none exist yet, but the resolver stays forward-compatible).
function findNextEventId(events: readonly EventDefinition[], currentSeconds: number): string | undefined {
  let nextEvent: EventDefinition | undefined;
  let nextSeconds = Number.POSITIVE_INFINITY;

  for (const event of events) {
    if (event.type !== "instant") {
      continue;
    }

    const eventSeconds = eventSecondsOfDay(event);
    if (eventSeconds < currentSeconds || eventSeconds >= nextSeconds) {
      continue;
    }

    nextEvent = event;
    nextSeconds = eventSeconds;
  }

  return nextEvent?.id;
}

function eventSecondsOfDay(event: InstantEventDefinition): number {
  return secondsOfDay(event.hour, event.minute, event.second ?? 0);
}

function secondsOfDay(hour: number, minute: number, second: number): number {
  return hour * 60 * 60 + minute * 60 + second;
}
