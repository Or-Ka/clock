# Test Status

Updated: 2026-07-07

## Baseline Before Migration

Passed before renaming:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser baseline passed on desktop and mobile:

- Hebrew `lang` and RTL `dir`.
- One active clock SVG.
- Default events visible.
- Display mode starts in `fullMode`.
- No console errors or warnings.
- No horizontal mobile overflow.

## Migration Tests Added

- App test file renamed to `apps/web/src/analog-event-clock.test.ts`.
- Tests now read the official app entrypoint.
- Added coverage for the new app export filename prefix.
- Added coverage for legacy display-mode localStorage migration.
- Kept JSON export schema at version `1` for compatibility.

## Final Migration Gate

Final migration verification passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Final browser verification covered desktop and mobile with no console errors or warnings.

## Known QA Note

The in-app browser automation did not successfully trigger the regular event form submit during T068, although the page reported no console errors. T069 added focused event-editor controller tests around event creation before extracting more of the editor.

## T069 Baseline And Foundation Checks

Baseline before T069 code movement passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

After extracting the first `app`, `data`, `ui`, and `event-editor` modules, the same gate passed again.

## T069 Shallow Extraction Checks

Added focused tests:

- `apps/web/src/app/lifecycle.test.ts`
- `apps/web/src/event-editor/event-editor-controller.test.ts`

The new tests cover lifecycle cleanup ordering/idempotency, immediate cleanup after destroy, regular event form submission, invalid regular event validation, derived event submission, and listener removal on controller destroy.

## T070 Application Boundary Checks

Added focused tests:

- `apps/web/src/app/create-clock-app.test.ts`

The new boundary tests cover the exported `ClockApp` lifecycle API, idempotent `destroy()` before startup, guarded `start()` source shape and delegation to runtime cleanup. The app source assertions now read behavior from `app/create-clock-app.ts`, while a new assertion keeps `main.ts` as a small entrypoint without DOM queries or business logic.

Final T070 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

T070 browser gate was verified manually outside Codex in a regular browser:

- The application loads.
- The clock is displayed.
- Existing events are displayed.
- Adding an event works.
- Deleting an event works.
- Opening display preferences works.
- No console errors were observed.

Codex browser tooling could not complete this browser gate because of environment constraints, not because of an application failure:

- Vite dev server startup from Codex failed with `EPERM` on `D:\Oriya\Projects`.
- The in-app browser blocked `localhost` / `127.0.0.1` with `ERR_BLOCKED_BY_CLIENT`.
- `file://` verification is blocked by browser-tool policy.

## T071 Settings Boundary Checks

Added focused tests:

- `apps/web/src/settings/settings-controller.test.ts`

The settings-controller tests cover:

- Opening and closing the display preferences panel.
- Changing display mode to `fullMode`, `clockOnly` and `floatingClock`.
- Location change callback and timezone select update through the app-owned callback.
- Display template, font, scale and color preference changes.
- Listener cleanup and repeated `start()` guarding.

Final T071 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

T071 browser verification passed in the Codex in-app browser against the built app served locally:

- The application loads.
- The clock is displayed.
- Existing events are displayed.
- The display preferences panel opens.
- The display preferences panel closes by outside click.
- Display mode changes work for `fullMode`, `clockOnly` and `floatingClock`.
- Location/timezone change works.
- Adding an event still works.
- Deleting the added event still works.
- No console errors or warnings were observed.

## T072 Clock Shell Boundary Checks

Added focused tests:

- `apps/web/src/clock-shell/clock-shell-controller.test.ts`

The clock-shell controller tests cover:

- Creating the live clock shell with one SVG.
- Refreshing without creating an extra SVG.
- Listener, visual timer and mutation observer cleanup.
- Idempotent `destroy()`.
- Marker visual sync after event-layer updates.

The source-level app tests now assert that `create-clock-app.ts` delegates event-layer updates through the clock-shell controller and that clock mount contextmenu wiring lives in `clock-shell/clock-shell-controller.ts`.

Final T072 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Final T072 browser verification passed in the Codex in-app browser against the built app served locally from `apps/web/dist`:

- The application loads.
- Exactly one clock SVG is active.
- Existing events and markers are displayed.
- The display preferences panel opens and closes.
- Location/timezone change keeps the clock working without creating another SVG.
- Adding an event works and adds one event/marker.
- Deleting the added event works and returns to the original event/marker count.
- Marker tooltip, timer menu and clock context menu open.
- No console errors or warnings were observed.

## T074 State/Domain API Checks

Added focused tests:

- `apps/web/src/app-state/app-state.test.ts`

The state/domain API tests cover:

- Creating the API with initial location, timezone, display preferences, event layers and derived events.
- Returning a consistent snapshot.
- Updating location and timezone.
- Updating display preferences without exposing the stored nested object.
- Updating event layers without exposing the stored event array.
- Updating derived events and rendered event lookup state.
- Pure event-layer helpers for enabled toggles, setting layer events, appending events, removing events and reading events by layer.

The source-level app tests now assert that `create-clock-app.ts` uses `createAppStateApi()` and routes clock-shell event-layer updates through `appState.getEventLayers()`.

Final T074 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser verification was attempted against a locally served app on `127.0.0.1:4174`. Vite could not start inside the sandbox because of the known `EPERM` issue on `D:\Oriya\Projects`, then started successfully outside the sandbox. Edge headless crashed before CDP verification could complete, so no browser result was recorded. This is an environment/tooling blocker, not an observed application failure.
