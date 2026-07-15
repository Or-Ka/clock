# Test Status

Updated: 2026-07-15

## T080 Floating Panel Design Checks

The source-level application test now asserts the shared floating-panel classes, context-menu hierarchy, active mode state, theme-token styling, clean tab-like controls and overlay layer ordering.

Final T080 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test` (`150` tests across `21` files)
- `npm.cmd run build`

Browser verification passed against the production preview:

- The event tooltip, timer action menu and clock context menu use the same surface, font, fine border and accent line.
- Dark and light templates produce matching dark and light panel colors.
- Timer and context-menu buttons are transparent, square and separated by tab-like lines.
- The active display mode has an accent underline and the context menu reports the current mode.
- Floating-clock mode applies compact context-menu spacing and keeps the panel above the clock.

## T079 Persistence And Defaults Checks

Added focused coverage for safe browser JSON storage and source-level regression assertions for:

- Tel Aviv as the first-run location.
- An empty personal-event layer.
- One shared default zmanit set for fixed day-time events.
- Automatic full-state save and restore.
- Layer visibility and clock appearance in version-1-compatible snapshots.

Final T079 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test` (`150` tests)
- `npm.cmd run build`

Browser verification passed against the production build: a personal event, Haifa location and disabled special layer all survived reload; no console errors or warnings were recorded.

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

## T075 Provider Controller Checks

Added focused tests:

- `apps/web/src/data/provider-controller.test.ts`

The provider-controller tests cover:

- Loading sunrise/sunset layers through `SunriseSunsetEventLayerProvider`.
- Skipping cached day-times requests.
- Reloading when the location cache key changes.
- Loading Hebcal details for the displayed Hebrew date after sunset.
- Skipping cached Hebcal detail requests.
- Computing location date keys by time zone.

The source-level app tests now assert that `create-clock-app.ts` uses `createProviderController()` and that provider construction/date-window logic lives in `data/provider-controller.ts`.

Final T075 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser verification was attempted after the product-code change. A local static preview server started on `127.0.0.1:4176`, but the Codex in-app browser blocked the local URL with `ERR_BLOCKED_BY_CLIENT` before the app loaded. T075 is not browser verified; manual browser verification is required before merge. This is an environment/tooling blocker, not an observed application failure.

## T076 Import/Export Controller Checks

Added focused tests:

- `apps/web/src/data/import-export-controller.test.ts`

The import/export controller tests cover:

- Serializing and downloading the current schema-version-1 state.
- Reading and applying a selected JSON file.
- Showing application validation errors and resetting the file input.
- Guarding repeated `start()` calls and removing listeners on `destroy()`.

The source-level app tests now assert that `create-clock-app.ts` uses `createImportExportController()` and that serialization, file reading and download creation live in `data/import-export-controller.ts`.

Final T076 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test` (`146` tests)
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser verification could not start because the in-app browser control tool is not exposed in the current session. T076 is not browser verified; this is an environment/tooling blocker, not an observed application failure.

## T077 Vercel Deployment Checks

The Vercel-equivalent local install and the full project gate passed:

- `npm.cmd ci`
- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test` (`146` tests)
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Deployment-output verification passed:

- `apps/web/dist/index.html` exists.
- All three `/assets/` references in the generated HTML resolve to files in `apps/web/dist`.
- The Vite production preview loaded with Hebrew `lang`, RTL `dir`, a rendered analog clock, `12` event rows and Jerusalem day-time data.
- No horizontal overflow was detected.
- No console errors or warnings were recorded.

## T078 Countdown Action Menu Checks

The source-level application test now asserts the refreshed menu structure, primary/secondary actions, tooltip suppression and compact floating-mode rules.

Final T078 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test` (`147` tests across `20` files)
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`
- Focused Prettier check for the three changed product/test files.

Browser verification passed against the local Vite app:

- The refreshed menu uses the active font and display colors in dark and light templates.
- Full, clock-only and floating-clock modes open the menu successfully.
- The floating layout is compact, above the clock layer and contained within the runtime's 240×200 minimum after requesting a 200×200 viewport.
- Show and hide actions render the correct content and focus the primary action.
- The event tooltip remains hidden while the action menu is open.
- No console errors or warnings were recorded.
