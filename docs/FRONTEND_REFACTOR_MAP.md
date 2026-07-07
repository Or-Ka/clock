# Frontend Refactor Map

Updated: 2026-07-07

## Scope

T069-T073 refactor and review the official Analog Event Clock Beta application under `apps/web` without changing UI behavior, CSS architecture, `packages/clock`, providers, storage schema, import/export schema or the app state shape.

T073 is a review and stabilization checkpoint after T069-T072. No product code was changed in this checkpoint.

## Current Branch

`refactor/frontend-architecture-app`

## Current Boundaries

- `apps/web/src/main.ts`: small entrypoint only. It imports styles, creates `createClockApp({ document, window })`, starts the app and disposes it during HMR.
- `apps/web/src/app/app-elements.ts`: typed application DOM binding.
- `apps/web/src/app/lifecycle.ts`: cleanup registry for app-owned listeners, timers and observers.
- `apps/web/src/app/create-clock-app.ts`: temporary application boundary. It still owns the current app state, startup orchestration, data/provider flow, import/export, storage, display side effects, event rendering, overlays, floating clock and alert runtime behavior.
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

`create-clock-app.ts` remains a large temporary application boundary after T072. This is not a new intended architecture; it is the staging area that allowed `main.ts`, settings, event-editor and the first clock-shell responsibilities to be separated without changing behavior.

## Lifecycle Cleanup

After T072, the application boundary registers these resources with the lifecycle registry:

- Clock-shell controller cleanup.
- Settings controller cleanup.
- Event-editor controller cleanup.
- Document `pointerdown` listener used by app menus.
- Status timer.
- `beforeunload` listener.

The clock-shell controller owns cleanup for its live clock instance, mount listeners, document mousemove listener, mutation observer, animation frame and visual timer. `destroyClock()` still owns non-listener teardown for app-owned state: aborting active fetches, closing floating clock windows and removing generated overlay UI nodes.

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

This boundary is stable and intentionally shallow. It should not be deepened before the app has explicit state/domain APIs for event mutations.

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

Current awkward dependencies:

- Settings display mode changes still need callbacks for floating clock orchestration and menu cleanup.
- Appearance changes still trigger app-owned rendering, clock visual sync and event list refresh callbacks.
- Import state restore still needs to call back into settings control syncing after replacing display preferences.

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
- Provider/data refreshes, import/export and storage.
- The document `pointerdown` listener because it coordinates settings, event visual editor, timer menu and clock context menu closing.

The clock-shell controller has not become a new monolith. It is still a narrow shell adapter around the live clock instance and shell-level DOM wiring. Its callback list is the main sign that the surrounding app lacks explicit state/domain APIs.

## Remaining Responsibilities In `create-clock-app.ts`

`create-clock-app.ts` still owns these responsibilities after T072:

- App state shape and all mutable state variables.
- Event layer mutations and resolved event list rendering.
- Zmanit set editing, fixed day-time editing and derived event resolution.
- Provider/data flow for sunrise/sunset and Hebcal details.
- Storage reads for display mode and legacy display mode migration.
- Import/export JSON creation, parsing and state restoration.
- Display preference application and CSS variable side effects.
- Tooltip, timer menu, context menu and countdown SVG rendering.
- Floating clock/Picture-in-Picture window lifecycle and overlay relocation.
- Alert settings, due-alert checks, sound and desktop notification behavior.
- Coordination between extracted controllers.

This file is still the temporary monolith. T072 did not create a second monolith in `clock-shell-controller.ts`; it made the remaining state coupling easier to see.

## Known Coupling Points

- `clock-shell-controller.ts` receives `getRenderedEvent`, `eventVisualForEvent`, tooltip callbacks, click/context-menu callbacks, a floating-document mousemove callback and a visual-timer callback. These are symptoms of app state that is not exposed through a stable domain API.
- `settings-controller.ts` receives callbacks for display state writes, display rendering, event list refresh, clock visual sync, floating clock mode and overlay cleanup.
- `applyDisplayPreferences()` changes document-level CSS variables, updates floating window styles, refreshes countdown arcs and refreshes the active tooltip.
- `applyEventLayers()` updates the clock shell, event list and marker visuals as one operation.
- Provider refreshes update day-time layers, fixed day-time status, zmanit ticks, special layers, Hebcal details and rendered clock state in one flow.
- Import restore replaces location, zmanit sets, personal events, derived events, fixed day-time events, display preferences, visual overrides and alert settings, then manually resyncs every dependent UI surface.
- Floating clock behavior moves the shell mount and overlay elements between documents, so tooltip/menu/countdown ownership cannot be moved cleanly without a clearer state and shell API.
- Countdown state is app-owned but renders directly into the clock SVG.
- Alert checks depend on the rendered visual event map, global alert settings and per-event overrides.

## Rejected Next Steps

- `T074 - Continue Clock Shell Split`: rejected for the next step. Tooltip, timer, context menu, countdown and floating-clock behavior are not only shell concerns; they depend on shared app state, display preferences, rendered events and alert timing. Moving them now would mostly move callbacks around.
- `T074 - Extract Data/Provider Controller`: rejected for the next step. Provider refresh mutates event layers, zmanit ticks, fixed day-time status, special events, Hebcal date details and clock rendering. Extracting it first would require a broad callback API around unstable state.
- `T074 - Extract Import/Export Controller`: rejected for the next step. Import restore touches nearly every state slice and UI surface. Extracting it before state/domain APIs would freeze the current monolithic state shape behind a large controller interface.

## Recommended Next Step

`T074 - Introduce State/Domain APIs`

The next step should introduce narrow, behavior-preserving state/domain APIs inside `apps/web` before extracting another controller. The goal is not a state manager and not a state shape rewrite. The goal is to name and centralize the existing operations that are already being coordinated manually:

- event-layer reads and mutations;
- rendered event lookup and visual style lookup;
- display preference reads/writes;
- import-restore application points;
- provider refresh application points;
- countdown and tooltip target lookup.

This is the lowest-risk next step because it reduces callback pressure without changing UX, CSS, providers, storage schema or `packages/clock`. After these APIs exist, the project can choose a smaller follow-up extraction with clearer ownership.
