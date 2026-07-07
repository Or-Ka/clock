# Current Task

Updated: 2026-07-07

## Active Task

T070: Introduce createClockApp application boundary

## Context

T068 promoted the existing web product to the official Beta application under `apps/web`. T069 extracted narrow app/data/event-editor/lifecycle modules. T070 establishes an explicit application boundary while preserving behavior and keeping `packages/clock` as the reusable embeddable library.

T070 is a conservative boundary move, not a state or UX rewrite. The current state shape and control flow remain inside the new app boundary.

Completed in T070:

- Added `apps/web/src/app/create-clock-app.ts`.
- Added `ClockApp` and `ClockAppDeps` internal API with `start()` and `destroy()`.
- Moved application initialization, state ownership and orchestration out of `main.ts`.
- Kept `main.ts` as the style import plus app creation/start/HMR disposal entrypoint.
- Routed top-level app listeners through the lifecycle registry helper so `destroy()` centralizes cleanup.
- Added focused `createClockApp` coverage and updated app source assertions.

`create-clock-app.ts` is intentionally large for this step. It is a temporary application boundary; settings, clock-shell and state/domain API extraction remain future work.

## Out Of Scope

- No CSS split.
- No UX redesign.
- No behavior change in `packages/clock`.
- No settings controller extraction.
- No clock-shell controller extraction.
- No state manager or state model rewrite.
- No marker accessibility API changes yet.
- No production cleanup for the dev stamp yet.

## Gate

Final CLI gate passed:

```powershell
npm.cmd run docs:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification was completed manually outside Codex in a regular browser. The app loaded, the clock and existing events were displayed, adding and deleting an event worked, display preferences opened, and no console errors were observed.

Codex browser tooling was blocked by environment constraints only: Vite failed from Codex with `EPERM` on `D:\Oriya\Projects`, the in-app browser blocked localhost with `ERR_BLOCKED_BY_CLIENT`, and `file://` is blocked by browser-tool policy.
