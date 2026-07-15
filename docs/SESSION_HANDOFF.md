# Session Handoff

Updated: 2026-07-15

## Current Branch

`codex/refresh-countdown-menu`

## T078 Progress

T078 refreshes the countdown action menu without changing countdown behavior or persistence:

- Added a current-design dialog hierarchy with an eyebrow, title and contextual description.
- Restyled the color field and primary/secondary actions with active display tokens.
- Kept the selected display font through `--display-font-family`.
- Added compact layout rules for floating-clock and Picture-in-Picture roots.
- Positioned the menu from its measured size so it remains inside the viewport.
- Raised the menu above the floating clock layer.
- Suppressed the event tooltip while the countdown menu is open.
- Added regression assertions to `analog-event-clock.test.ts`.

T078 verification passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test` (`147` tests)
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`
- Focused Prettier check for the three changed product/test files.
- Browser checks for dark/light templates, all three display modes and a compact viewport requested at 200×200 (the browser runtime enforced a 240×200 minimum).
- No browser console errors or warnings.

## T077 Progress

T077 prepares the repository for Vercel deployment without changing product behavior:

- Added a root-level `vercel.json`.
- Pinned Vercel builds to Node.js `24.x`.
- Configured `npm ci`, the root workspace build and `apps/web/dist` output.
- Added an `index.html` rewrite for direct SPA navigation.
- Documented that Vercel should import the repository root and that no environment variables are currently required.

T077 verification passed:

- `npm.cmd ci`
- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test` (`146` tests)
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`
- Production-preview browser check with no console errors or warnings.
- Generated-asset check with zero missing references.

The next external step is to import the Git repository into Vercel with the repository root selected. No Vercel environment variables are required. A custom domain can be attached after the first successful deployment.

## Completed Migration Task

T068: Promote the web surface to the official Analog Event Clock Beta application.

## Completed In T068

- Confirmed `main` was clean and up to date with `origin/main`.
- Ran baseline docs/typecheck/tests/build before migration.
- Created the migration branch.
- Moved tracked app files from `apps/demo` to `apps/web` with Git rename operations.
- Confirmed rename detection with `git diff --cached --summary`.
- Renamed the package to `@clock/web`.
- Promoted the active web application entrypoint to `apps/web/index.html`.
- Moved historical prototype screens to `archive/legacy-app-screens`.
- Added localStorage compatibility for the previous display-mode key.
- Kept JSON export schema at version `1` for import compatibility.
- Added `docs/APP_MIGRATION.md`.
- Ran the final migration gate.
- Created logical migration commits.

## Not Done In T068

- No `main.ts` refactor.
- No state model refactor.
- No CSS split.
- No UX redesign.
- No `packages/clock` behavior change.

## T069 Progress

Foundation and shallow controller modules were extracted without intended behavior changes:

- `apps/web/src/app/app-elements.ts`
- `apps/web/src/app/lifecycle.ts`
- `apps/web/src/data/locations.ts`
- `apps/web/src/data/hebcal-service.ts`
- `apps/web/src/ui/event-icons.ts`
- `apps/web/src/event-editor/event-validation.ts`
- `apps/web/src/event-editor/event-editor-controller.ts`

The latest shallow extraction pass moved lifecycle cleanup and event form submit/toggle behavior behind narrow APIs. `main.ts` still owns state updates through callbacks, so this is not yet a deep app-controller refactor.

## T070 Progress

T070 introduced the explicit application boundary:

- `apps/web/src/main.ts` is now only the style import, `createClockApp({ document, window })`, `app.start()` and HMR disposal.
- `apps/web/src/app/create-clock-app.ts` owns current application startup, state, orchestration and teardown.
- `ClockApp` exposes `start()` and `destroy()`.
- `start()` is guarded so repeated calls do not attach duplicate runtime listeners or timers.
- `destroy()` is idempotent and delegates to the runtime `destroyClock()` cleanup.
- Top-level listeners registered during startup now go through the lifecycle registry helper.
- Focused tests were added for the new boundary API and entrypoint shape.

This is intentionally a large temporary application boundary. It moves ownership out of `main.ts` without rewriting the internal state model or UX.

## T070 Verification

Final CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser gate was completed manually outside Codex in a regular browser:

- The application loads.
- The clock is displayed.
- Existing events are displayed.
- Adding an event works.
- Deleting an event works.
- Opening display preferences works.
- No console errors were observed.

Codex browser tooling was blocked by environment constraints only, not by an application failure. Vite failed from Codex with `EPERM` on `D:\Oriya\Projects`, the in-app browser blocked localhost with `ERR_BLOCKED_BY_CLIENT`, and `file://` is blocked by browser-tool policy.

## T071 Progress

T071 extracted the first settings boundary:

- `apps/web/src/settings/settings-elements.ts` defines the settings element subset selected from the app DOM binding.
- `apps/web/src/settings/settings-controller.ts` owns the listeners for location selection, display preferences panel toggle, display template selection, display mode selection, display font family/scale, clock scale and basic display color controls.
- The controller exposes `start()`, `destroy()`, `syncDisplayPreferenceControls()`, `setDisplayPreferencesOpen()` and `setDisplayMode()`.
- Settings state remains inside `create-clock-app.ts`; the controller receives explicit callbacks for state reads/writes, rendering side effects and clock-shell menu cleanup.
- Focused tests cover panel open/close, `fullMode` / `clockOnly` / `floatingClock`, location callback, appearance changes and listener cleanup.

T071 verification passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`
- Browser verification in the Codex in-app browser against the built app served locally.

Browser verification covered app load, clock display, existing events, display preferences open/close, display mode changes, location/timezone change, adding an event, deleting the added event and no console errors or warnings.

Not extracted in T071:

- Layer toggles remain in `create-clock-app.ts` because they directly update event layers.
- The document `pointerdown` listener remains in `create-clock-app.ts` because it coordinates settings, visual editor, timer menu and clock context menu closing.
- Storage schema and import/export remain unchanged.

## T072 Progress

T072 extracted the first clock-shell boundary:

- `apps/web/src/clock-shell/clock-shell-controller.ts` owns live clock creation and startup.
- The controller owns the clock mount listeners for pointer/mouse tooltip handling, marker clicks and context menu opening.
- The controller owns the clock mutation observer and schedules marker visual sync after clock SVG changes.
- The controller owns the visual timer that drives countdown layer refresh, active tooltip refresh and alert checks through an explicit callback.
- The controller exposes `start()`, `setTimeZone()`, `setEventLayers()`, `setZmanitTicks()`, `refresh()`, `syncEventVisuals()` and `destroy()`.
- `create-clock-app.ts` still owns `eventLayers`, rendered event state, tooltip/menu/countdown state, floating clock/Picture-in-Picture orchestration, providers, import/export and storage.
- Focused tests cover single-SVG creation, refresh without duplicate SVGs, listener/timer/observer cleanup and marker visual updates.

Not extracted in T072:

- Tooltip, timer menu, countdown arc and context menu rendering still live in `create-clock-app.ts` because they still share state with event lists, display preferences and floating window restoration.
- Floating clock/Picture-in-Picture orchestration remains in `create-clock-app.ts`.
- Provider/data flow, import/export and state/domain APIs remain unchanged.

T072 verification passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`
- Browser verification in the Codex in-app browser against the built app served locally from `apps/web/dist`.

Browser verification covered app load, one active clock SVG, existing events and markers, display preferences open/close, location/timezone change, adding an event, deleting the added event, marker tooltip, timer menu, clock context menu and no console errors or warnings.

## T073 Progress

T073 was a documentation-only architecture review after T072:

- Reviewed the remaining callback pressure between `create-clock-app.ts`, settings and clock-shell boundaries.
- Kept product code unchanged.
- Recommended `T074 - Introduce State/Domain APIs` as the next step before provider or import/export extraction.

T073 commit:

- `9078bc0 docs review frontend architecture after T072`

## T074 Progress

T074 introduced the first internal state/domain API:

- `apps/web/src/app-state/app-state.ts` defines `createAppStateApi()`.
- The API covers location, timezone, display preferences, event layers, derived events, rendered event map access and snapshot creation.
- The same module also provides pure event-layer helpers for reading a layer's events, toggling enabled state, setting layer events, appending an event to a layer and removing an event from all layers.
- `create-clock-app.ts` now routes part of state access through `appState`, including settings display preference reads/writes, location/timezone changes, event-layer mutations, derived event mutations, rendered event lookup and export snapshot creation.
- `apps/web/src/app-state/app-state.test.ts` adds focused DOM-free coverage for the new API and event-layer helpers.
- Existing app source tests were updated so the expected event-layer handoff goes through `appState.getEventLayers()`.

Not extracted in T074:

- Provider/data flow remains in `create-clock-app.ts`.
- Import/export parsing and UI status remain in `create-clock-app.ts`.
- Storage reads and legacy display-mode migration remain unchanged.
- Tooltip, timer menu, clock context menu, countdown rendering, floating clock behavior and alert behavior remain in `create-clock-app.ts`.
- `packages/clock`, CSS, UX and import/export JSON format remain unchanged.

## Next Recommended Work

Stop after T074. The next recommended task is:

`T075 - Extract Data/Provider Controller`

This should be a conservative extraction of sunrise/sunset and Hebcal provider orchestration behind the new state/domain API. Import/export should wait until provider refresh state has a clearer boundary.

## T075 Progress

T075 extracted the provider/data orchestration boundary:

- Added `apps/web/src/data/provider-controller.ts`.
- The provider controller owns sunrise/sunset refresh cache keys, abort controllers, `SunriseSunsetEventLayerProvider` creation and `loadLayer()` calls.
- The provider controller owns Hebcal refresh cache keys, abort controllers, date/window selection, URL creation and detail parsing through `hebcal-service.ts`.
- The controller reads location, timezone and event layers through the app-state API.
- `create-clock-app.ts` still owns app state mutation, status text, fixed day-time events, zmanit tick calculation, special-layer refresh, event list rendering and clock-shell refreshes.
- Added `apps/web/src/data/provider-controller.test.ts`.
- Updated source-level app tests so provider construction is asserted in the provider controller rather than the app boundary.

Not extracted in T075:

- Import/export parsing and restore.
- Storage reads and legacy display-mode migration.
- Tooltip, timer menu, clock context menu, countdown rendering, floating clock behavior and alert behavior.
- Zmanit set editing and fixed day-time resolution.
- CSS or UX changes.
- `packages/clock`.

T076 was selected explicitly after T075 as a conservative import/export boundary extraction. The controller should own stable browser/file/UI mechanics, while `create-clock-app.ts` keeps import state restoration and cross-surface rendering side effects.

T075 commits:

- `ba883e3 refactor extract data provider controller`
- `0efac6c docs update T075 provider boundary`
- `3c833e9 fix provider event Hebrew encoding`

## T076 Progress

T076 extracted stable import/export browser mechanics:

- Added `apps/web/src/data/import-export-controller.ts`.
- The controller owns export/import button listeners, JSON serialization and download creation, file reading, JSON parsing, status messages, file-input reset and cleanup.
- `create-clock-app.ts` supplies the version-1 export snapshot and applies imported state through two explicit callbacks.
- Imported state restoration remains in `create-clock-app.ts` because it updates location, zmanit sets, event layers, display preferences, visual overrides, alerts and dependent UI surfaces.
- Added `apps/web/src/data/import-export-controller.test.ts` covering export, import success/error, repeated start and cleanup.

Not changed in T076:

- Export schema version and file name.
- UX, CSS, storage schema and app state shape.
- `packages/clock`.

T076 CLI verification passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test` (`146` tests)
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser verification could not start because the in-app browser control tool is not exposed in the current session. This is an environment/tooling blocker, not an observed application failure.
