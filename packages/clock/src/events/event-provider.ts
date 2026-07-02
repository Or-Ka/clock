import type { EventLayerDefinition, InstantEventDefinition } from "./event-model.js";

export interface EventProviderRequest {
  readonly date: string;
  readonly timeZone: string;
  readonly signal?: AbortSignal;
}

export interface EventLayerProvider {
  loadLayer(request: EventProviderRequest): Promise<EventLayerDefinition>;
}

export interface ApiInstantEventPayload {
  readonly id: string;
  readonly kind?: InstantEventDefinition["kind"];
  readonly title: string;
  readonly hour: number;
  readonly minute: number;
  readonly description?: string;
}

export interface ApiEventLayerPayload {
  readonly events: readonly ApiInstantEventPayload[];
}

export type FetchLike = (input: string, init?: { readonly signal?: AbortSignal }) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}>;

export interface ApiEventLayerProviderOptions {
  readonly layerId: string;
  readonly layerTitle: string;
  readonly urlForDate: (request: EventProviderRequest) => string;
  readonly fetcher?: FetchLike;
}

export class ApiEventLayerProvider implements EventLayerProvider {
  private readonly fetcher: FetchLike;

  constructor(private readonly options: ApiEventLayerProviderOptions) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  async loadLayer(request: EventProviderRequest): Promise<EventLayerDefinition> {
    const response = await this.fetcher(
      this.options.urlForDate(request),
      request.signal === undefined ? undefined : { signal: request.signal }
    );
    if (!response.ok) {
      throw new Error(`Event API request failed with status ${response.status}.`);
    }

    return {
      id: this.options.layerId,
      title: this.options.layerTitle,
      kind: "api",
      enabled: true,
      events: parsePayload(await response.json())
    };
  }
}

function parsePayload(payload: unknown): InstantEventDefinition[] {
  if (!isApiEventLayerPayload(payload)) {
    throw new Error("Event API payload must contain an events array.");
  }

  return payload.events.map((event) => ({
    id: event.id,
    type: "instant",
    title: event.title,
    hour: event.hour,
    minute: event.minute,
    ...(event.kind === undefined ? {} : { kind: event.kind }),
    ...(event.description === undefined ? {} : { description: event.description })
  }));
}

function isApiEventLayerPayload(payload: unknown): payload is ApiEventLayerPayload {
  if (typeof payload !== "object" || payload === null || !("events" in payload)) {
    return false;
  }

  return Array.isArray((payload as { readonly events: unknown }).events);
}
