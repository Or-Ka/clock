export type { ClockContext } from "./core/clock-context.js";
export type { TimeSource } from "./time/time-source.js";
export { type StaticClockTime } from "./time/static-clock-time.js";
export type { EventDefinition, ResolvedClockItem } from "./events/event-model.js";
export {
  createStaticAnalogClock,
  type StaticAnalogClock,
  type StaticAnalogClockOptions
} from "./rendering/static-analog-clock.js";
