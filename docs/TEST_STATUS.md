# Test Status

עודכן: 2026-07-05

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

## Final Gate

Final migration verification passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Final browser verification covered desktop and mobile with no console errors or warnings.

## Known QA Note

The in-app browser automation did not successfully trigger the regular event form submit, although the page reported no console errors. Because T068 was migration-only, no behavior change was made for this. T069 should preserve existing behavior and may add stronger interaction tests around event creation before extracting the event editor.
