import { assertValidStaticClockTime, type StaticClockTime } from "../time/static-clock-time.js";

export type ClockRing = "outer" | "inner";
export type InstantEventKind = "sunrise" | "sunset" | "custom";
export type InstantEventStatus = "past" | "next" | "future";
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

function minutesOfDay(hour: number, minute: number): number {
  return hour * 60 + minute;
}
