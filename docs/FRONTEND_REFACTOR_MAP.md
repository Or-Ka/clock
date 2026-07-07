# Frontend Refactor Map

Updated: 2026-07-07

## Scope

T069-T072 refactor the official Analog Event Clock Beta application under `apps/web` without changing UI behavior, CSS architecture, `packages/clock`, or the app state shape.

## Current Branch

`refactor/frontend-architecture-app`

## Extracted Boundaries

- `apps/web/src/app/app-elements.ts`: typed application DOM binding.
- `apps/web/src/app/lifecycle.ts`: cleanup registry for app-owned listeners, timers and observers.
- `apps/web/src/app/create-clock-app.ts`: temporary application boundary with `ClockApp.start()` and `ClockApp.destroy()`.
- `apps/web/src/settings/settings-elements.ts`: settings-focused element subset from the app DOM binding.
- `apps/web/src/settings/settings-controller.ts`: shallow settings listener/controller boundary.
- `apps/web/src/clock-shell/clock-shell-controller.ts`: shallow live clock shell wiring/controller boundary.
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

After T072, the application boundary registers these resources with the lifecycle registry:

- Clock-shell controller cleanup.
- Event-editor controller cleanup.
- Document `pointerdown` listener used by app menus.
- Status timer.
- `beforeunload` listener.

T070 also routes the top-level app startup listeners through a small lifecycle helper, so `destroy()` has one cleanup path for the listeners created by `start()`. T072 moves clock mount listener cleanup, the clock mutation observer and the visual timer cleanup into the clock-shell controller.

`destroyClock()` still owns non-listener teardown for app-owned state: aborting active fetches, closing floating clock windows and removing generated UI nodes. The live clock instance is destroyed by the clock-shell controller.

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
- Tooltip, timer menu, context menu and countdown state/rendering callbacks.
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

## Clock Shell Boundary

T072 moved these concerns from `create-clock-app.ts` into `clock-shell/clock-shell-controller.ts`:

- `createLiveAnalogClock()` creation and `clock.start()`.
- Clock time-zone, event-layer, zmanit-tick and refresh forwarding.
- Clock marker SVG visual sync.
- Clock mount pointer/mouse/click/contextmenu listener registration and cleanup.
- The document `mousemove` listener used while the clock can live in the main document or floating window.
- The clock mutation observer.
- The visual timer cleanup and tick callback.

Still intentionally kept in `create-clock-app.ts`:

- `eventLayers`, `renderedEventsById`, `activeTooltipTarget`, `activeCountdowns` and other app-owned state.
- Tooltip, timer action menu, context menu and countdown arc rendering.
- Floating clock/Picture-in-Picture window creation and mount restoration.
- Provider/data refreshes, import/export and storage.
- The document `pointerdown` listener because it coordinates settings, event visual editor, timer menu and clock context menu closing.

Current awkward dependencies:

- The clock-shell controller receives callbacks for tooltip/menu behavior instead of owning that state directly.
- Floating clock restoration still moves shell-owned overlay elements from `create-clock-app.ts`.
- Countdown rendering still reaches into the clock SVG because countdown state remains app-owned.

## Next Recommended Step

After T072, prefer either a conservative follow-up clock-shell pass for tooltip/timer/context/floating responsibilities or state/domain APIs if those responsibilities remain too state-coupled. Data/provider and import/export extraction should wait until the state/domain boundary is clearer.
