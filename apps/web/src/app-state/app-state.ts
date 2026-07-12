type EventLayerWithEvents<TEvent> = {
  readonly id: string;
  readonly events: readonly TEvent[];
};

type EventForLayer<TEventLayer extends EventLayerWithEvents<unknown>> = TEventLayer["events"][number];

export type AppStateSnapshot<TLocation, TDisplayPreferences, TEventLayer, TDerivedEvent, TRenderedEvent> = {
  readonly location: TLocation;
  readonly timeZone: string;
  readonly displayPreferences: TDisplayPreferences;
  readonly eventLayers: readonly TEventLayer[];
  readonly derivedEvents: readonly TDerivedEvent[];
  readonly renderedEventsById: ReadonlyMap<string, TRenderedEvent>;
};

export type AppStateApi<TLocation, TDisplayPreferences, TEventLayer, TDerivedEvent, TRenderedEvent> = {
  readonly getSnapshot: () => AppStateSnapshot<TLocation, TDisplayPreferences, TEventLayer, TDerivedEvent, TRenderedEvent>;
  readonly getLocation: () => TLocation;
  readonly setLocation: (next: TLocation) => void;
  readonly getTimeZone: () => string;
  readonly setTimeZone: (next: string) => void;
  readonly getDisplayPreferences: () => TDisplayPreferences;
  readonly setDisplayPreferences: (next: TDisplayPreferences) => void;
  readonly getEventLayers: () => readonly TEventLayer[];
  readonly setEventLayers: (next: readonly TEventLayer[]) => void;
  readonly getDerivedEvents: () => readonly TDerivedEvent[];
  readonly setDerivedEvents: (next: readonly TDerivedEvent[]) => void;
  readonly getRenderedEventsById: () => ReadonlyMap<string, TRenderedEvent>;
  readonly getRenderedEvent: (eventId: string) => TRenderedEvent | undefined;
  readonly setRenderedEventsById: (next: ReadonlyMap<string, TRenderedEvent>) => void;
  readonly setRenderedEvents: (next: readonly TRenderedEvent[], eventId: (event: TRenderedEvent) => string) => void;
};

export type AppStateApiOptions<
  TLocation,
  TDisplayPreferences,
  TEvent,
  TEventLayer extends EventLayerWithEvents<TEvent>,
  TDerivedEvent,
  TRenderedEvent
> = {
  readonly getLocation: () => TLocation;
  readonly setLocation: (next: TLocation) => void;
  readonly getTimeZone: () => string;
  readonly setTimeZone: (next: string) => void;
  readonly getDisplayPreferences: () => TDisplayPreferences;
  readonly setDisplayPreferences: (next: TDisplayPreferences) => void;
  readonly cloneDisplayPreferences: (preferences: TDisplayPreferences) => TDisplayPreferences;
  readonly getEventLayers: () => readonly TEventLayer[];
  readonly setEventLayers: (next: TEventLayer[]) => void;
  readonly getDerivedEvents: () => readonly TDerivedEvent[];
  readonly setDerivedEvents: (next: TDerivedEvent[]) => void;
  readonly getRenderedEventsById: () => ReadonlyMap<string, TRenderedEvent>;
  readonly setRenderedEventsById: (next: Map<string, TRenderedEvent>) => void;
};

export function createAppStateApi<
  TLocation,
  TDisplayPreferences,
  TEvent,
  TEventLayer extends EventLayerWithEvents<TEvent>,
  TDerivedEvent,
  TRenderedEvent
>(
  options: AppStateApiOptions<TLocation, TDisplayPreferences, TEvent, TEventLayer, TDerivedEvent, TRenderedEvent>
): AppStateApi<TLocation, TDisplayPreferences, TEventLayer, TDerivedEvent, TRenderedEvent> {
  function getEventLayers(): TEventLayer[] {
    return cloneEventLayers(options.getEventLayers());
  }

  function getDerivedEvents(): TDerivedEvent[] {
    return [...options.getDerivedEvents()];
  }

  function getRenderedEventsById(): ReadonlyMap<string, TRenderedEvent> {
    return new Map(options.getRenderedEventsById());
  }

  function setEventLayers(next: readonly TEventLayer[]): void {
    options.setEventLayers(cloneEventLayers(next));
  }

  function setDerivedEvents(next: readonly TDerivedEvent[]): void {
    options.setDerivedEvents([...next]);
  }

  function setRenderedEventsById(next: ReadonlyMap<string, TRenderedEvent>): void {
    options.setRenderedEventsById(new Map(next));
  }

  return {
    getSnapshot() {
      return {
        location: options.getLocation(),
        timeZone: options.getTimeZone(),
        displayPreferences: options.cloneDisplayPreferences(options.getDisplayPreferences()),
        eventLayers: getEventLayers(),
        derivedEvents: getDerivedEvents(),
        renderedEventsById: getRenderedEventsById()
      };
    },

    getLocation: options.getLocation,
    setLocation: options.setLocation,
    getTimeZone: options.getTimeZone,
    setTimeZone: options.setTimeZone,

    getDisplayPreferences() {
      return options.cloneDisplayPreferences(options.getDisplayPreferences());
    },

    setDisplayPreferences(next) {
      options.setDisplayPreferences(options.cloneDisplayPreferences(next));
    },

    getEventLayers,
    setEventLayers,
    getDerivedEvents,
    setDerivedEvents,
    getRenderedEventsById,

    getRenderedEvent(eventId) {
      return options.getRenderedEventsById().get(eventId);
    },

    setRenderedEventsById,

    setRenderedEvents(next, eventId) {
      setRenderedEventsById(new Map(next.map((event) => [eventId(event), event])));
    }
  };
}

export function cloneEventLayers<TEvent, TEventLayer extends EventLayerWithEvents<TEvent>>(
  layers: readonly TEventLayer[]
): TEventLayer[] {
  return layers.map(cloneEventLayer);
}

export function eventsForLayer<TEventLayer extends EventLayerWithEvents<unknown>>(
  layers: readonly TEventLayer[],
  layerId: string
): TEventLayer["events"] {
  return layers.find((layer) => layer.id === layerId)?.events ?? ([] as unknown as TEventLayer["events"]);
}

export function setEventLayerEnabled<TEventLayer extends EventLayerWithEvents<unknown> & { readonly enabled?: boolean }>(
  layers: readonly TEventLayer[],
  layerId: string,
  enabled: boolean
): TEventLayer[] {
  return layers.map((layer) => (layer.id === layerId ? ({ ...layer, enabled } as TEventLayer) : layer));
}

export function setEventLayerEvents<TEventLayer extends EventLayerWithEvents<unknown>>(
  layers: readonly TEventLayer[],
  layerId: string,
  events: readonly EventForLayer<TEventLayer>[]
): TEventLayer[] {
  return layers.map((layer) => (layer.id === layerId ? ({ ...layer, events: [...events] } as TEventLayer) : layer));
}

export function appendEventToLayer<TEventLayer extends EventLayerWithEvents<unknown>>(
  layers: readonly TEventLayer[],
  layerId: string,
  event: EventForLayer<TEventLayer>
): TEventLayer[] {
  return layers.map((layer) =>
    layer.id === layerId ? ({ ...layer, events: [...layer.events, event] } as TEventLayer) : layer
  );
}

export function removeEventFromLayers<TEventLayer extends EventLayerWithEvents<{ readonly id: string }>>(
  layers: readonly TEventLayer[],
  eventId: string
): TEventLayer[] {
  return layers.map((layer) => ({ ...layer, events: layer.events.filter((event) => event.id !== eventId) }) as TEventLayer);
}

function cloneEventLayer<TEvent, TEventLayer extends EventLayerWithEvents<TEvent>>(layer: TEventLayer): TEventLayer {
  return { ...layer, events: [...layer.events] } as TEventLayer;
}
