import { describe, expect, it } from "vitest";

import {
  appendEventToLayer,
  createAppStateApi,
  eventsForLayer,
  removeEventFromLayers,
  setEventLayerEnabled,
  setEventLayerEvents
} from "./app-state.js";

type TestLocation = {
  readonly id: string;
  readonly timeZone: string;
};

type TestPreferences = {
  readonly mode: string;
  readonly nested: {
    readonly value: string;
  };
};

type TestEvent = {
  readonly id: string;
  readonly title: string;
};

type TestLayer = {
  readonly id: string;
  readonly title: string;
  readonly enabled?: boolean;
  readonly events: readonly TestEvent[];
};

type TestRenderedEvent = {
  readonly id: string;
  readonly title: string;
};

function clonePreferences(preferences: TestPreferences): TestPreferences {
  return {
    ...preferences,
    nested: { ...preferences.nested }
  };
}

describe("createAppStateApi", () => {
  it("creates a state API with the initial values", () => {
    const state = createTestState();
    const api = state.api;

    expect(api.getLocation()).toEqual({ id: "jerusalem", timeZone: "Asia/Jerusalem" });
    expect(api.getTimeZone()).toBe("Asia/Jerusalem");
    expect(api.getDisplayPreferences()).toEqual({ mode: "full", nested: { value: "night" } });
    expect(api.getEventLayers()).toHaveLength(2);
    expect(api.getDerivedEvents()).toEqual([{ id: "derived-sunrise", title: "Derived sunrise" }]);
  });

  it("returns a consistent snapshot", () => {
    const { api } = createTestState();
    const snapshot = api.getSnapshot();

    expect(snapshot.location.id).toBe("jerusalem");
    expect(snapshot.timeZone).toBe("Asia/Jerusalem");
    expect(snapshot.displayPreferences.mode).toBe("full");
    expect(snapshot.eventLayers.map((layer) => layer.id)).toEqual(["personal", "special"]);
    expect(snapshot.derivedEvents.map((event) => event.id)).toEqual(["derived-sunrise"]);
    expect(snapshot.renderedEventsById.get("rendered-1")).toEqual({ id: "rendered-1", title: "Rendered" });
  });

  it("changes location and timezone through the API", () => {
    const state = createTestState();

    state.api.setLocation({ id: "london", timeZone: "Europe/London" });
    state.api.setTimeZone("Europe/London");

    expect(state.location).toEqual({ id: "london", timeZone: "Europe/London" });
    expect(state.timeZone).toBe("Europe/London");
  });

  it("changes display preferences without exposing the stored object", () => {
    const state = createTestState();
    const nextPreferences = { mode: "clockOnly", nested: { value: "paper" } };

    state.api.setDisplayPreferences(nextPreferences);
    nextPreferences.nested.value = "mutated";

    const readPreferences = state.api.getDisplayPreferences();
    (readPreferences.nested as { value: string }).value = "read-mutation";

    expect(state.displayPreferences).toEqual({ mode: "clockOnly", nested: { value: "paper" } });
  });

  it("changes event layers without exposing the stored array", () => {
    const state = createTestState();
    const nextLayers = setEventLayerEvents(state.api.getEventLayers(), "personal", [
      { id: "meeting", title: "Meeting" }
    ]);

    state.api.setEventLayers(nextLayers);
    (nextLayers[0]!.events as TestEvent[]).push({ id: "mutated", title: "Mutation" });

    expect(state.eventLayers[0]!.events).toEqual([{ id: "meeting", title: "Meeting" }]);
  });

  it("changes derived events and rendered events", () => {
    const state = createTestState();

    state.api.setDerivedEvents([{ id: "derived-sunset", title: "Derived sunset" }]);
    state.api.setRenderedEvents(
      [
        { id: "rendered-2", title: "Rendered 2" },
        { id: "rendered-3", title: "Rendered 3" }
      ],
      (event) => event.id
    );

    expect(state.derivedEvents).toEqual([{ id: "derived-sunset", title: "Derived sunset" }]);
    expect(state.api.getRenderedEvent("rendered-3")).toEqual({ id: "rendered-3", title: "Rendered 3" });
    expect([...state.api.getRenderedEventsById().keys()]).toEqual(["rendered-2", "rendered-3"]);
  });
});

describe("event layer domain helpers", () => {
  it("updates layer enabled state", () => {
    const layers = [layer("personal", [{ id: "one", title: "One" }])];

    expect(setEventLayerEnabled(layers, "personal", false)).toEqual([
      { id: "personal", title: "personal", enabled: false, events: [{ id: "one", title: "One" }] }
    ]);
  });

  it("sets, appends and removes layer events", () => {
    const layers = [layer("personal", [{ id: "one", title: "One" }]), layer("special", [])];
    const withSetEvents = setEventLayerEvents(layers, "special", [{ id: "two", title: "Two" }]);
    const withAppended = appendEventToLayer(withSetEvents, "personal", { id: "three", title: "Three" });
    const withoutOne = removeEventFromLayers(withAppended, "one");

    expect(eventsForLayer(withoutOne, "personal")).toEqual([{ id: "three", title: "Three" }]);
    expect(eventsForLayer(withoutOne, "special")).toEqual([{ id: "two", title: "Two" }]);
  });
});

function createTestState() {
  let location: TestLocation = { id: "jerusalem", timeZone: "Asia/Jerusalem" };
  let timeZone = "Asia/Jerusalem";
  let displayPreferences: TestPreferences = { mode: "full", nested: { value: "night" } };
  let eventLayers: TestLayer[] = [
    layer("personal", [{ id: "standup", title: "Standup" }]),
    layer("special", [])
  ];
  let derivedEvents: TestEvent[] = [{ id: "derived-sunrise", title: "Derived sunrise" }];
  let renderedEventsById = new Map<string, TestRenderedEvent>([["rendered-1", { id: "rendered-1", title: "Rendered" }]]);

  const state = {
    get location() {
      return location;
    },
    get timeZone() {
      return timeZone;
    },
    get displayPreferences() {
      return displayPreferences;
    },
    get eventLayers() {
      return eventLayers;
    },
    get derivedEvents() {
      return derivedEvents;
    },
    api: createAppStateApi<TestLocation, TestPreferences, TestEvent, TestLayer, TestEvent, TestRenderedEvent>({
      getLocation: () => location,
      setLocation: (next) => {
        location = next;
      },
      getTimeZone: () => timeZone,
      setTimeZone: (next) => {
        timeZone = next;
      },
      getDisplayPreferences: () => displayPreferences,
      setDisplayPreferences: (next) => {
        displayPreferences = next;
      },
      cloneDisplayPreferences: clonePreferences,
      getEventLayers: () => eventLayers,
      setEventLayers: (next) => {
        eventLayers = next;
      },
      getDerivedEvents: () => derivedEvents,
      setDerivedEvents: (next) => {
        derivedEvents = next;
      },
      getRenderedEventsById: () => renderedEventsById,
      setRenderedEventsById: (next) => {
        renderedEventsById = next;
      }
    })
  };

  return state;
}

function layer(id: string, events: readonly TestEvent[]): TestLayer {
  return {
    id,
    title: id,
    enabled: true,
    events
  };
}
