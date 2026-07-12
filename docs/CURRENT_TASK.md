# Current Task

Updated: 2026-07-07

## Active Task

T074: Introduce State/Domain APIs

## Context

T068 promoted the existing web product to the official Beta application under `apps/web`. T069 extracted narrow app/data/event-editor/lifecycle modules. T070 established an explicit application boundary while preserving behavior and keeping `packages/clock` as the reusable embeddable library. T071 extracted the first settings listener boundary. T072 extracted the first clock-shell wiring boundary. T073 reviewed the frontend architecture after T072 and recommended introducing state/domain APIs before extracting another controller.

T074 introduces a small internal `app-state` API around the existing state held by `create-clock-app.ts`. It does not replace the state manager, does not change the state shape, and does not change storage, import/export, CSS, UX or `packages/clock`.

Completed in T074:

- Added `apps/web/src/app-state/app-state.ts`.
- Added `createAppStateApi()` for location, timezone, display preferences, event layers, derived events and rendered event lookup/snapshot access.
- Added pure event-layer domain helpers for reading layer events, setting layer events, toggling layer enabled state, appending events and removing events across layers.
- Routed part of `create-clock-app.ts` state access through the new API, including settings display preferences, location/timezone changes, event-layer updates, derived event updates, rendered event lookup and export snapshot creation.
- Added focused state/domain API tests in `apps/web/src/app-state/app-state.test.ts`.

`create-clock-app.ts` remains the main orchestration boundary. Provider/data flow, import/export parsing, storage, alerts, overlays, floating clock behavior, tooltip/timer/context menu behavior and controller coordination intentionally stay there for this step.

## Out Of Scope

- No UX changes.
- No CSS changes.
- No storage schema changes.
- No import/export format changes.
- No provider controller extraction.
- No import/export controller extraction.
- No clock-shell split continuation.
- No state manager, event bus, Redux, Zustand or MobX.
- No `packages/clock` public API changes.
- No production cleanup for the dev stamp yet.

## Gate

Final T074 CLI gate passed:

```powershell
npm.cmd run docs:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification must cover app load, clock display, existing events, display preferences, location/timezone change, adding and deleting an event and no console errors or warnings.

Browser verification was attempted against a locally served app. The server started successfully on `127.0.0.1:4174`, but Edge headless crashed before CDP verification could complete in this Codex environment.
