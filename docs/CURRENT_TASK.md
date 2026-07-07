# Current Task

Updated: 2026-07-07

## Active Task

T072: Extract clock shell controller

## Context

T068 promoted the existing web product to the official Beta application under `apps/web`. T069 extracted narrow app/data/event-editor/lifecycle modules. T070 established an explicit application boundary while preserving behavior and keeping `packages/clock` as the reusable embeddable library.

T072 is a shallow clock-shell extraction. The current state shape and data/provider control flow remain inside `create-clock-app.ts`; the new clock-shell controller receives explicit DOM, time, event and visual callbacks.

Completed in T072:

- Added `apps/web/src/clock-shell/clock-shell-controller.ts`.
- Moved live clock creation, clock DOM binding, marker visual sync, the clock mount listeners, the clock mutation observer and the visual timer out of `create-clock-app.ts`.
- Kept application state, event layer ownership, tooltip/context/countdown state, floating clock orchestration and provider refreshes in `create-clock-app.ts`.
- Routed shell behavior through explicit callbacks for rendered events, visual styles, tooltip/menu handlers and visual timer work.
- Added focused clock-shell controller tests for single-SVG creation, refresh behavior, listener/timer/observer cleanup and marker visual sync.

`create-clock-app.ts` remains the application state owner. The clock-shell boundary is intentionally shallow and delegates behavior through callbacks.

## Out Of Scope

- No CSS split.
- No UX redesign.
- No behavior change in `packages/clock`.
- No state manager or state model rewrite.
- No import/export extraction.
- No provider extraction.
- No marker accessibility API changes yet.
- No production cleanup for the dev stamp yet.

## Gate

Final T072 CLI gate passed:

```powershell
npm.cmd run docs:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification must cover app load, clock display, existing events, display preferences, location/timezone change, adding and deleting an event, marker tooltip/menu behavior where available and no console errors or warnings.

Browser verification passed in the Codex in-app browser against the built app served from `apps/web/dist`. Verification covered app load, one active clock SVG, existing events and markers, display preferences open/close, location/timezone change, adding and deleting an event, marker tooltip, timer menu, clock context menu and no console errors or warnings.
