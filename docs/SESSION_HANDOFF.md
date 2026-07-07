# Session Handoff

Updated: 2026-07-07

## Current Branch

`refactor/frontend-architecture-app`

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

## Next Recommended Work

Stop after T071. The next refactor should likely be a clock-shell controller, because context menus, floating clock behavior, tooltip/timer menu coordination and clock mount interactions are now the next large UI cluster. State/domain APIs should wait until one more UI controller boundary is smaller.
