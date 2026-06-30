import type { Temporal } from "@js-temporal/polyfill";

export type EventDefinition = AbsoluteEventDefinition;

export interface AbsoluteEventDefinition {
  readonly id: string;
  readonly kind: "absolute";
  readonly instant: Temporal.Instant;
  readonly title: string;
}

export interface ResolvedClockItem {
  readonly id: string;
  readonly instant: Temporal.Instant;
  readonly title: string;
  readonly position: ClockFacePosition;
}

export interface ClockFacePosition {
  readonly cycle: "current-12-hour";
  readonly angleDegrees: number;
}
