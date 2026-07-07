# Frontend Refactor Map

Updated: 2026-07-07

## Scope

T069-T071 refactor the official Analog Event Clock Beta application under `apps/web` without changing UI behavior, CSS architecture, `packages/clock`, or the app state shape.

## Current Branch

`refactor/frontend-architecture-app`

## Extracted Boundaries

- `apps/web/src/app/app-elements.ts`: typed application DOM binding.
- `apps/web/src/app/lifecycle.ts`: cleanup registry for app-owned listeners, timers and observers.
- `apps/web/src/app/create-clock-app.ts`: temporary application boundary with `ClockApp.start()` and `ClockApp.destroy()`.
- `apps/web/src/settings/settings-elements.ts`: settings-focused element subset from the app DOM binding.
- `apps/web/src/settings/settings-controller.ts`: shallow settings listener/controller boundary.
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

- Settings state, display preference persistence helpers and display rendering side effects.
- Import/export persistence.
- Clock shell interactions and context menus.
- Event list rendering and visual editing.
- Zmanit/fixed day-time editing.
- Alert runtime checks.
- Floating clock and Picture-in-Picture orchestration.
- The current state shape and orchestration callbacks.

## Settings Boundary

T071 moved these concerns from `create-clock-app.ts` into `settings/settings-controller.ts`:

- Location select change listener.
- Display preferences panel toggle listener.
- Display template select listener.
- Display mode select listener for `fullMode`, `clockOnly` and `floatingClock`.
- Display font family, font scale and clock scale listeners.
- Basic display color input listeners.
- Settings listener cleanup.
- Display preference control syncing and panel open/close helpers.

Still intentionally kept in `create-clock-app.ts`:

- The `displayPreferences` state object.
- Display template definitions and validation helpers.
- `loadDisplayPreferences()` and `persistDisplayMode()`.
- `applyDisplayPreferences()` because it currently coordinates document CSS variables, floating clock styles, countdown layer and tooltip refresh.
- `syncFloatingClockMode()` and floating clock/Picture-in-Picture behavior.
- Layer toggles, because they directly mutate event layer state.
- The document `pointerdown` listener, because it closes settings, event visual editor, timer menu and clock context menu together.

Current awkward dependencies:

- Settings display mode changes still need clock-shell callbacks for floating clock and menu cleanup.
- Appearance changes still trigger clock visual sync and event list refresh callbacks.
- Import state restore still needs to call back into settings control syncing after replacing display preferences.

## Next Recommended Step

Prefer a clock-shell controller next. Data/provider extraction is also possible later, but the clock shell currently owns the densest remaining UI/event-listener cluster. State/domain APIs should wait until clock-shell and import/export boundaries are smaller.
