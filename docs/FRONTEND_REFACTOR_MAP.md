# Frontend Refactor Map

Updated: 2026-07-07

## Scope

T069/T070 refactor the official Analog Event Clock Beta application under `apps/web` without changing UI behavior, CSS architecture, `packages/clock`, or the app state shape.

## Current Branch

`refactor/frontend-architecture-app`

## Extracted Boundaries

- `apps/web/src/app/app-elements.ts`: typed application DOM binding.
- `apps/web/src/app/lifecycle.ts`: cleanup registry for app-owned listeners, timers and observers.
- `apps/web/src/app/create-clock-app.ts`: temporary application boundary with `ClockApp.start()` and `ClockApp.destroy()`.
- `apps/web/src/data/locations.ts`: location metadata and lookup.
- `apps/web/src/data/hebcal-service.ts`: Hebcal URL/date/detail helpers.
- `apps/web/src/ui/event-icons.ts`: event icon options and SVG/HTML icon helpers.
- `apps/web/src/event-editor/event-validation.ts`: event time and offset validation.
- `apps/web/src/event-editor/event-editor-controller.ts`: add-event form toggles and regular/special submit handling.

## Application Boundary

T070 moved the runtime body of `main.ts` into `apps/web/src/app/create-clock-app.ts`.

Moved from `main.ts`:

- DOM binding via `bindAppElements`.
- Runtime state variables and default layer setup.
- Clock creation/startup.
- Initial render and data refresh calls.
- Location, layer, fixed day-time, display preference, import/export, alert and clock interaction listeners.
- Existing helper functions for rendering, day-times, Hebcal, import/export, alerts, floating clock and menus.
- Runtime cleanup through `destroyClock()`.

Remaining in `main.ts`:

- `styles.css` import.
- `createClockApp({ document, window })`.
- `app.start()`.
- HMR disposal via `app.destroy()`.

`create-clock-app.ts` is a large temporary application boundary. This is intentional for T070: it creates a clear app lifecycle API before splitting settings, clock-shell and state/domain responsibilities into smaller modules.

## Lifecycle Cleanup Moved

The application boundary registers these resources with the lifecycle registry:

- Clock mutation observer cleanup.
- Event-editor controller cleanup.
- Clock tooltip and marker interaction listeners on the clock mount.
- Document `mousemove` and `pointerdown` listeners used by app menus.
- Status and visual timers.
- `beforeunload` listener.

T070 also routes the top-level app startup listeners through a small lifecycle helper, so `destroy()` has one cleanup path for the listeners created by `start()`.

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

`main.ts` no longer owns application behavior.

## Still In The Application Boundary

- Settings controls and display preferences.
- Import/export persistence.
- Clock shell interactions and context menus.
- Event list rendering and visual editing.
- Zmanit/fixed day-time editing.
- Alert runtime checks.
- Floating clock and Picture-in-Picture orchestration.
- The current state shape and orchestration callbacks.

## Next Recommended Step

Continue with a narrow settings extraction inside `create-clock-app.ts`: start with display preferences controls or alert settings controls, keeping state updates in the application boundary through callbacks. After that, consider a clock-shell controller. State/domain APIs should wait until the UI controller boundaries are smaller.
