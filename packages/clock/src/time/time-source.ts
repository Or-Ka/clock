import type { Temporal } from "@js-temporal/polyfill";

export interface TimeSource {
  now(): Temporal.Instant;
}
