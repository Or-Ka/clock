# Current Task

Updated: 2026-07-07

## Active Task

T071: Extract settings controller / settings binder

## Context

T068 promoted the existing web product to the official Beta application under `apps/web`. T069 extracted narrow app/data/event-editor/lifecycle modules. T070 established an explicit application boundary while preserving behavior and keeping `packages/clock` as the reusable embeddable library.

T071 is a shallow settings extraction. The current state shape and control flow remain inside `create-clock-app.ts`; the new settings controller receives explicit callbacks and elements.

Completed in T071:

- Added `apps/web/src/settings/settings-elements.ts`.
- Added `apps/web/src/settings/settings-controller.ts`.
- Moved location and display-preference listeners out of `create-clock-app.ts`.
- Kept display preference state, persistence helpers and rendering side effects in `create-clock-app.ts`.
- Added focused settings-controller tests for panel open/close, display modes, location callback, appearance changes and listener cleanup.

`create-clock-app.ts` remains the application state owner. The settings boundary is intentionally shallow and delegates behavior through callbacks.

## Out Of Scope

- No CSS split.
- No UX redesign.
- No behavior change in `packages/clock`.
- No clock-shell controller extraction.
- No state manager or state model rewrite.
- No import/export extraction.
- No provider extraction.
- No marker accessibility API changes yet.
- No production cleanup for the dev stamp yet.

## Gate

Final T071 CLI gate passed:

```powershell
npm.cmd run docs:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification passed in the Codex in-app browser against the built app served locally. The app loaded, the clock and existing events were displayed, display preferences opened and closed, display mode changes worked, location/timezone changed, adding and deleting an event worked, and no console errors or warnings were observed.
