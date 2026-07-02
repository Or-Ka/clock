import { describe, expect, it } from "vitest";

import {
  dualRingAngle,
  resolveEventLayers,
  resolveInstantEvents,
  ringForTime,
  type EventLayerDefinition,
  type InstantEventDefinition
} from "./event-model.js";

describe("ringForTime", () => {
  it.each([
    [5, 59, "inner"],
    [6, 0, "outer"],
    [17, 59, "outer"],
    [18, 0, "inner"],
    [23, 59, "inner"],
    [0, 0, "inner"]
  ] as const)("maps %s:%s to the %s ring", (hour, minute, ring) => {
    expect(ringForTime(hour, minute)).toBe(ring);
  });
});

describe("dualRingAngle", () => {
  it.each([
    [6, 0, 0],
    [9, 0, 90],
    [12, 0, 180],
    [15, 0, 270],
    [18, 0, 0],
    [21, 0, 90],
    [0, 0, 180],
    [3, 0, 270]
  ] as const)("maps %s:%s to %s degrees", (hour, minute, angle) => {
    expect(dualRingAngle(hour, minute)).toBe(angle);
  });
});

describe("resolveInstantEvents", () => {
  it("assigns sunrise and sunset events to rings by their actual local time", () => {
    const resolved = resolveInstantEvents(
      [
        event("sunrise-before-six", "sunrise", 5, 40),
        event("sunrise-after-six", "sunrise", 6, 20),
        event("sunset-before-six", "sunset", 17, 50),
        event("sunset-after-six", "sunset", 18, 40)
      ],
      { hour: 5, minute: 0 }
    );

    expect(resolved.map(({ id, ring }) => [id, ring])).toEqual([
      ["sunrise-before-six", "inner"],
      ["sunrise-after-six", "outer"],
      ["sunset-before-six", "outer"],
      ["sunset-after-six", "inner"]
    ]);
  });

  it("marks only the next event later today", () => {
    const resolved = resolveInstantEvents(
      [event("past", "custom", 8, 0), event("next", "custom", 11, 30), event("future", "custom", 15, 0)],
      { hour: 10, minute: 15 }
    );

    expect(resolved.map(({ id, status }) => [id, status])).toEqual([
      ["past", "past"],
      ["next", "next"],
      ["future", "future"]
    ]);
  });

  it("does not roll the next event to tomorrow when all events are past", () => {
    const resolved = resolveInstantEvents([event("morning", "custom", 8, 0)], { hour: 23, minute: 0 });

    expect(resolved[0]?.status).toBe("past");
  });

  it("rejects duplicate ids and invalid local times without mutating input", () => {
    const events = [event("same", "custom", 8, 0), event("same", "sunrise", 9, 0)];

    expect(() => resolveInstantEvents(events, { hour: 7, minute: 0 })).toThrow("Duplicate");
    expect(events[0]?.kind).toBe("custom");
    expect(() => resolveInstantEvents([event("bad", "custom", 24, 0)], { hour: 7, minute: 0 })).toThrow(RangeError);
  });
});

describe("resolveEventLayers", () => {
  it("resolves only enabled layers and preserves layer metadata", () => {
    const resolved = resolveEventLayers(
      [
        layer("day-times", "day-times", true, [event("sunrise", "sunrise", 5, 40)]),
        layer("personal", "personal", false, [event("meeting", "custom", 9, 0)])
      ],
      { hour: 5, minute: 0 }
    );

    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({
      id: "sunrise",
      layerId: "day-times",
      layerTitle: "day-times",
      layerKind: "day-times",
      status: "next"
    });
  });

  it("computes the next event across all enabled layers", () => {
    const resolved = resolveEventLayers(
      [
        layer("day-times", "day-times", true, [event("sunset", "sunset", 18, 40)]),
        layer("personal", "personal", true, [event("meeting", "custom", 9, 0)])
      ],
      { hour: 8, minute: 0 }
    );

    expect(resolved.map(({ id, status }) => [id, status])).toEqual([
      ["sunset", "future"],
      ["meeting", "next"]
    ]);
  });

  it("rejects duplicate layer ids and duplicate event ids across layers", () => {
    expect(() =>
      resolveEventLayers(
        [layer("same", "day-times", true, []), layer("same", "personal", true, [])],
        { hour: 8, minute: 0 }
      )
    ).toThrow("Duplicate event layer id");

    expect(() =>
      resolveEventLayers(
        [
          layer("one", "day-times", true, [event("same", "sunrise", 6, 0)]),
          layer("two", "personal", true, [event("same", "custom", 7, 0)])
        ],
        { hour: 8, minute: 0 }
      )
    ).toThrow("Duplicate event id across layers");
  });
});

function event(
  id: string,
  kind: InstantEventDefinition["kind"],
  hour: number,
  minute: number
): InstantEventDefinition {
  return {
    id,
    type: "instant",
    title: id,
    hour,
    minute,
    ...(kind === undefined ? {} : { kind })
  };
}

function layer(
  id: string,
  kind: EventLayerDefinition["kind"],
  enabled: boolean,
  events: readonly InstantEventDefinition[]
): EventLayerDefinition {
  return {
    id,
    title: id,
    enabled,
    events,
    ...(kind === undefined ? {} : { kind })
  };
}
