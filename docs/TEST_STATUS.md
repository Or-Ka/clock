# Test Status

Updated: 2026-07-06

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
