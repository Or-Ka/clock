# Current Task

Updated: 2026-07-13

## Active Task

T075: Extract Data/Provider Controller

## Context

T074 introduced a small internal `app-state` API around the existing state held by `create-clock-app.ts`. It did not replace the state manager, change the state shape, or change storage, import/export, CSS, UX or `packages/clock`.

T075 extracts a conservative provider/data controller for sunrise/sunset and Hebcal refresh orchestration while keeping app state ownership and rendering side effects inside `create-clock-app.ts`.

Completed in T075:

- Added `apps/web/src/data/provider-controller.ts`.
- Moved sunrise/sunset cache keys, abort controller ownership, provider construction and `loadLayer()` calls into the provider controller.
- Moved Hebcal cache keys, abort controller ownership, URL/date orchestration and detail parsing into the provider controller.
- Routed provider reads through the T074 app-state API for location, timezone and event-layer access.
- Kept `create-clock-app.ts` responsible for state mutation, status text, fixed day-time resolution, zmanit tick calculation, special-layer refresh, event-list rendering and clock-shell refreshes.
- Added focused tests in `apps/web/src/data/provider-controller.test.ts`.
- Updated source-level app assertions to expect the provider boundary.

## Out Of Scope

- No UX changes.
- No CSS changes.
- No storage schema changes.
- No import/export format changes.
- No `packages/clock` changes.
- No state manager, event bus, Redux, Zustand or MobX.
- No import/export controller extraction.
- No T076 work.

## Gate

Final T075 CLI gate:

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Because Codex shell cwd handling can fall back to `C:\` in this environment, the same commands may be run with `npm.cmd --prefix D:\Oriya\Projects\clock ...` during verification.
