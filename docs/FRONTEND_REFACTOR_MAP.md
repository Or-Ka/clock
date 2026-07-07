# Frontend Refactor Map

Updated: 2026-07-06

## Scope

T069 refactors the official Analog Event Clock Beta application under `apps/web` without changing UI behavior, CSS architecture, `packages/clock`, or the app state shape.

## Current Branch

`refactor/frontend-architecture-app`

## Extracted Boundaries

- `apps/web/src/app/app-elements.ts`: typed application DOM binding.
- `apps/web/src/app/lifecycle.ts`: cleanup registry for app-owned listeners, timers and observers.
- `apps/web/src/data/locations.ts`: location metadata and lookup.
- `apps/web/src/data/hebcal-service.ts`: Hebcal URL/date/detail helpers.
- `apps/web/src/ui/event-icons.ts`: event icon options and SVG/HTML icon helpers.
- `apps/web/src/event-editor/event-validation.ts`: event time and offset validation.
- `apps/web/src/event-editor/event-editor-controller.ts`: add-event form toggles and regular/special submit handling.

## Lifecycle Cleanup Moved

`main.ts` now registers these resources with the lifecycle registry:

- Clock mutation observer cleanup.
- Event-editor controller cleanup.
- Clock tooltip and marker interaction listeners on the clock mount.
- Document `mousemove` and `pointerdown` listeners used by app menus.
- Status and visual timers.
- `beforeunload` listener.

`destroyClock()` still owns non-listener teardown: aborting active fetches, closing floating clock windows, cancelling pending animation frames, removing generated UI nodes and destroying the live clock instance.

## Event Editor Boundary

The event-editor controller now owns:

- Add-event form toggle listeners.
- Regular event submit validation and event object creation.
- Derived event submit validation and event object creation.
- Controller listener cleanup.

`main.ts` still owns:

- `eventLayers`
- `derivedEvents`
- `eventAlertOverrides`
- Desktop notification permission requests.
- Refreshing special layers and applying event layers.

This keeps the extraction shallow and avoids changing application state ownership.

## Still In Main

- Settings controls and display preferences.
- Import/export persistence.
- Clock shell interactions and context menus.
- Event list rendering and visual editing.
- Zmanit/fixed day-time editing.
- Alert runtime checks.
- Floating clock and Picture-in-Picture orchestration.

## Next Recommended Step

Continue with a narrow settings extraction: start with display preferences controls or alert settings controls, keeping state updates in `main.ts` through callbacks. Do not introduce `createClockApp` until the shallow boundaries are smaller and stable.
