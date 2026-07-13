# Frontend Refactor Map

Updated: 2026-07-13

## Scope

T069-T076 refactor and review the official Analog Event Clock Beta application under `apps/web` without changing UI behavior, CSS architecture, `packages/clock`, storage schema, import/export schema or the app state shape.

T073 is a review and stabilization checkpoint after T069-T072. No product code was changed in this checkpoint.

T074 introduced a small internal state/domain API around existing app state. It does not introduce a state manager and does not change the state shape. T075 introduced a small provider/data controller around sunrise/sunset and Hebcal refresh orchestration. T076 introduced a narrow import/export controller around stable browser file mechanics and UI listeners.

## Current Branch

`refactor/import-export-controller`

## Current Boundaries

- `apps/web/src/main.ts`: small entrypoint only. It imports styles, creates `createClockApp({ document, window })`, starts the app and disposes it during HMR.
- `apps/web/src/app/app-elements.ts`: typed application DOM binding.
- `apps/web/src/app/lifecycle.ts`: cleanup registry for app-owned listeners, timers and observers.
- `apps/web/src/app/create-clock-app.ts`: temporary application boundary. It still owns the current app state, startup orchestration, export snapshot assembly, imported state restoration, storage, display side effects, event rendering, overlays, floating clock and alert runtime behavior.
- `apps/web/src/app-state/app-state.ts`: internal DOM-free state/domain API around existing app state, plus pure event-layer helpers.
- `apps/web/src/settings/settings-elements.ts`: settings-focused element subset from the app DOM binding.
- `apps/web/src/settings/settings-controller.ts`: shallow settings listener/controller boundary.
- `apps/web/src/clock-shell/clock-shell-controller.ts`: shallow live clock shell wiring/controller boundary.
- `apps/web/src/data/locations.ts`: location metadata and lookup.
- `apps/web/src/data/hebcal-service.ts`: Hebcal URL/date/detail helpers.
- `apps/web/src/data/import-export-controller.ts`: import/export browser file mechanics, UI listeners and cleanup.
- `apps/web/src/data/provider-controller.ts`: provider refresh controller for sunrise/sunset and Hebcal details.
- `apps/web/src/ui/event-icons.ts`: event icon options and SVG/HTML icon helpers.
- `apps/web/src/event-editor/event-validation.ts`: event time and offset validation.
- `apps/web/src/event-editor/event-editor-controller.ts`: add-event form toggles and regular/special submit handling.

## Application Boundary

T070 moved the runtime body of `main.ts` into `apps/web/src/app/create-clock-app.ts`.

Moved from `main.ts`:

- DOM binding via `bindAppElements`.
- Runtime state variables and default layer setup.
- Clock startup orchestration.
- Initial render and data refresh calls.
- Location, layer, fixed day-time, display preference, import/export, alert and clock interaction listeners.
- Existing helper functions for rendering, day-times, Hebcal, import/export, alerts, floating clock and menus.
- Runtime cleanup through `destroyClock()`.

Remaining in `main.ts`:

- `styles.css` import.
- `createClockApp({ document, window })`.
- `app.start()`.
- HMR disposal via `app.destroy()`.

`create-clock-app.ts` remains a large temporary application boundary after T076. This is not a new intended architecture; it is the staging area that allowed `main.ts`, settings, event-editor, the first clock-shell responsibilities, state/domain API, provider mechanics and import/export browser mechanics to be separated without changing behavior.

## State/Domain API

T074 added `apps/web/src/app-state/app-state.ts`.

Created API:

- `createAppStateApi()` wraps existing state variables through getter/setter callbacks.
- `getSnapshot()` returns a consistent read snapshot for location, timezone, display preferences, event layers, derived events and rendered events.
- `getLocation()` / `setLocation()`.
- `getTimeZone()` / `setTimeZone()`.
- `getDisplayPreferences()` / `setDisplayPreferences()`.
- `getEventLayers()` / `setEventLayers()`.
- `getDerivedEvents()` / `setDerivedEvents()`.
- `getRenderedEventsById()`, `getRenderedEvent()`, `setRenderedEventsById()` and `setRenderedEvents()`.

Pure event-layer helpers:

- `eventsForLayer()`.
- `setEventLayerEnabled()`.
- `setEventLayerEvents()`.
- `appendEventToLayer()`.
- `removeEventFromLayers()`.

Moved from direct access in `create-clock-app.ts` to the state/domain API:

- Settings display preference reads/writes.
- Location changes from settings and import restore.
- Timezone sync and clock-shell timezone handoff.
- Event-layer toggles.
- Personal event append.
- Derived event append/remove.
- Event removal across layers.
- Day-times and special-layer event replacement.
- Fixed day-time layer refresh.
- Rendered event lookup used by clock-shell, visual editor, tooltip target resolution and countdown target lookup.
- Rendered event map replacement in event-list rendering.
- Export snapshot reads for selected location, derived events and display preferences.

Still intentionally left in `create-clock-app.ts` after T076:

- The actual state variables.
- Export snapshot assembly and imported state restoration.
- Storage reads and legacy display-mode migration.
- Display preference side effects on document CSS variables and floating window styles.
- Event rendering, tooltip/timer/context menu behavior, countdown rendering, floating clock lifecycle and alerts.

Coupling reduced:

- Settings no longer receives direct closures over `displayPreferences`; it talks through `appState`.
- Clock-shell rendered event lookup now goes through `appState.getRenderedEvent()`.
- Event-layer mutation code is named through pure helpers instead of repeated ad hoc `map()` operations.
- Export can read a state snapshot instead of reaching into several local state variables.

Coupling still remaining:

- `create-clock-app.ts` still coordinates when state changes should trigger rendering, clock-shell refreshes, provider refreshes and UI control sync.
- Provider refresh still causes app-owned updates to day-times, fixed day-time status, zmanit ticks, special events and clock rendering in one flow.
- Import restore still touches many state slices and manually resyncs dependent UI surfaces.
- Display preferences still mix state writes with document CSS, floating clock style sync, countdown refresh and tooltip refresh.
- Tooltip/timer/context/floating clock behavior still depends on rendered events, display preferences and app-owned overlay state.

## Provider/Data Boundary

T075 added `apps/web/src/data/provider-controller.ts`.

Moved from `create-clock-app.ts`:

- Sunrise/sunset refresh cache key tracking.
- Sunrise/sunset abort controller ownership.
- `SunriseSunsetEventLayerProvider` construction.
- Sunrise/sunset `loadLayer()` calls.
- Hebcal refresh cache key tracking.
- Hebcal abort controller ownership.
- Hebcal date/window selection and URL creation.
- Hebcal detail parsing and date-display detail storage.

Still intentionally kept in `create-clock-app.ts`:

- Provider result application to event layers.
- Day-time status text.
- Fixed day-time resolution.
- Zmanit tick calculation and toggle handoff.
- Special-layer refresh.
- Event-list rendering and clock-shell refresh calls.

This keeps the provider boundary data-focused while `create-clock-app.ts` remains the owner of state writes and UI side effects.

## Import/Export Boundary

T076 added `apps/web/src/data/import-export-controller.ts`.

Moved from `create-clock-app.ts`:

- Export and import button listeners.
- Export JSON serialization, Blob creation, object URL lifecycle and download link activation.
- Import file reading and `JSON.parse()`.
- Import/export success and error status messages.
- File-input reset and listener cleanup.

Still intentionally kept in `create-clock-app.ts`:

- Schema-version-1 export snapshot assembly.
- Validation and application of imported state.
- Location/timezone/provider resynchronization after restore.
- Zmanit, event-layer, display preference, visual override and alert state replacement.
- Rendering and controller synchronization after restore.

This keeps the controller independent of the app state shape. A broader extraction was rejected because imported state restoration currently touches nearly every state slice and UI surface and would turn the controller into a callback-heavy replacement monolith.

## Lifecycle Cleanup

After T076, the application boundary registers these resources with the lifecycle registry:

- Clock-shell controller cleanup.
- Settings controller cleanup.
- Import/export controller cleanup.
- Event-editor controller cleanup.
- Document `pointerdown` listener used by app menus.
- Status timer.
- `beforeunload` listener.

The clock-shell controller owns cleanup for its live clock instance, mount listeners, document mousemove listener, mutation observer, animation frame and visual timer. `destroyClock()` still owns non-listener teardown for app-owned state: asking the provider controller to abort active fetches, closing floating clock windows and removing generated overlay UI nodes.

## Event Editor Boundary

The event-editor controller owns:

- Add-event form toggle listeners.
- Regular event submit validation and event object creation.
- Derived event submit validation and event object creation.
- Controller listener cleanup.

Still intentionally kept in `create-clock-app.ts`:

- `eventLayers`.
- `derivedEvents`.
- `eventAlertOverrides`.
- Desktop notification permission requests.
- Refreshing special layers and applying event layers.

This boundary is stable and intentionally shallow. T074 adds explicit state/domain APIs for event mutations, so a later pass can reduce event-editor callback pressure without changing behavior.

## Settings Boundary

The settings controller owns:

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
- `applyDisplayPreferences()` because it coordinates document CSS variables, floating clock styles, countdown layer refresh and tooltip refresh.
- `syncFloatingClockMode()` and floating clock/Picture-in-Picture behavior.
- Layer toggles, because they directly mutate event layer state.
- The document `pointerdown` listener, because it closes settings, event visual editor, timer menu and clock context menu together.

Current awkward dependencies after T074:

- Settings display mode changes still need callbacks for floating clock orchestration and menu cleanup.
- Appearance changes still trigger app-owned rendering, clock visual sync and event list refresh callbacks.
- Import state restore still needs to call back into settings control syncing after replacing display preferences.
- The settings controller still owns listeners only; display preference side effects stay in `create-clock-app.ts`.

## Clock Shell Boundary

The clock-shell controller owns:

- `createLiveAnalogClock()` creation and `clock.start()`.
- Clock time-zone, event-layer, zmanit-tick and refresh forwarding.
- Clock marker SVG visual sync.
- Clock mount pointer/mouse/click/contextmenu listener registration and cleanup.
- The document `mousemove` listener used while the clock can live in the main document or floating window.
- The clock mutation observer.
- The visual timer cleanup and tick callback.

Still intentionally kept in `create-clock-app.ts`:

- `eventLayers`, `renderedEventsById`, `activeTooltipTarget`, `activeCountdowns` and other app-owned state.
- Tooltip rendering and state.
- Timer action menu rendering and state.
- Clock context menu rendering and display-mode actions.
- Countdown arc rendering and state.
- Floating clock/Picture-in-Picture window creation and mount restoration.
- Provider result application, imported state restoration and storage.
- The document `pointerdown` listener because it coordinates settings, event visual editor, timer menu and clock context menu closing.

The clock-shell controller has not become a new monolith. It is still a narrow shell adapter around the live clock instance and shell-level DOM wiring. T074 reduced only the rendered-event lookup and event-layer handoff by routing them through `appState`; tooltip, timer, context and floating-window callback pressure remains.

## Remaining Responsibilities In `create-clock-app.ts`

`create-clock-app.ts` still owns these responsibilities after T076:

- App state shape and all mutable state variables, now partly wrapped by `appState`.
- Event layer mutations and resolved event list rendering.
- Zmanit set editing, fixed day-time editing and derived event resolution.
- Applying provider results to app state and UI.
- Storage reads for display mode and legacy display mode migration.
- Export snapshot assembly and imported state validation/application.
- Display preference application and CSS variable side effects.
- Tooltip, timer menu, context menu and countdown SVG rendering.
- Floating clock/Picture-in-Picture window lifecycle and overlay relocation.
- Alert settings, due-alert checks, sound and desktop notification behavior.
- Coordination between extracted controllers.

This file is still the temporary monolith. T074 did not move ownership out of it; it named the first state/domain operations so the next controller extraction can depend on a smaller interface.

## Known Coupling Points

- `clock-shell-controller.ts` still receives `getRenderedEvent`, `eventVisualForEvent`, tooltip callbacks, click/context-menu callbacks, a floating-document mousemove callback and a visual-timer callback. `getRenderedEvent` now routes through `appState`, but the surrounding tooltip/timer/context behavior is still app-owned.
- `settings-controller.ts` receives callbacks for display state writes, display rendering, event list refresh, clock visual sync, floating clock mode and overlay cleanup.
- `applyDisplayPreferences()` changes document-level CSS variables, updates floating window styles, refreshes countdown arcs and refreshes the active tooltip.
- `applyEventLayers()` updates the clock shell, event list and marker visuals as one operation. It now reads event layers through `appState`.
- Provider refreshes still cause the app boundary to update day-time layers, fixed day-time status, zmanit ticks, special layers and rendered clock state in one flow.
- Import restore replaces location, zmanit sets, personal events, derived events, fixed day-time events, display preferences, visual overrides and alert settings, then manually resyncs every dependent UI surface.
- `import-export-controller.ts` deliberately receives only `createExportState` and `applyImportedState`; widening that interface before the state/domain boundary is clearer would recreate the current coupling in callback form.
- Floating clock behavior moves the shell mount and overlay elements between documents, so tooltip/menu/countdown ownership cannot be moved cleanly without a clearer state and shell API.
- Countdown state is app-owned but renders directly into the clock SVG.
- Alert checks depend on the rendered visual event map, global alert settings and per-event overrides.

## Rejected Next Steps

- Continue Clock Shell Split: rejected as the immediate next step after T074. Tooltip, timer, context menu, countdown and floating-clock behavior are not only shell concerns; they depend on shared app state, display preferences, rendered events and alert timing.
- Extract Import/Export Controller: rejected as the immediate next step after T074. T076 later accepted only the stable browser/file subset after T075 clarified provider state pressure; imported state restoration remains app-owned.
- Continue State/Domain APIs: rejected as a standalone next step after T074. The useful pressure point was provider orchestration, and T075 used the existing API for that extraction.

## Recommended Next Step

T076 completed the conservative import/export browser boundary extraction. The next step should be chosen explicitly after reviewing the remaining callback pressure and app-owned side effects rather than started automatically.
