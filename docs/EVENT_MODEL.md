# Event Model

## Current Scope

The library supports instant event definitions and resolves them into display-ready clock events.

The official web application uses event layers for:

- `day-times`: sunrise/sunset-derived day times.
- `personal`: user-created events.
- `special`: derived/special application events.

## Resolution Rules

- Event resolution happens before rendering.
- The renderer receives resolved events.
- A disabled layer is not displayed and does not participate in `next` status.
- Resolved events may include `layerId`, `layerTitle` and `layerKind` so the application can render labels and controls.

## Ring Model

- Outer ring: 06:00-17:59.
- Inner ring: 18:00-05:59.
- Events are assigned to rings by local event time.

## Future Work

Future phases may formalize richer event types, ranges, derived events and external providers as public library APIs.
