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
