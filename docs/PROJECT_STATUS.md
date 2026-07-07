# Project Status

Updated: 2026-07-07

## Current State

The project has two active product surfaces:

- `packages/clock`: the reusable TypeScript/SVG clock library.
- `apps/web`: the official Analog Event Clock Beta web application.

The previous web surface under `apps/demo` was promoted rather than rewritten. Historical prototype screens are preserved under `archive/legacy-app-screens` and are not part of the active Vite or TypeScript build.

## Active Task

T070: Introduce createClockApp application boundary

## Current Branch

`refactor/frontend-architecture-app`

## Migration Status

- Chosen app path: `apps/web`.
- Chosen package name: `@clock/web`.
- Chosen app version: `0.1.0-beta.1`.
- Product name: `Analog Event Clock` / `שעון אירועים אנלוגי`.
- Core library behavior: unchanged.
- T068 final gate passed.
- T068 commits were created.

## Frontend Refactor Progress

Current extraction strategy: a temporary application boundary around the existing state and orchestration, plus shallow controller modules around stable responsibilities.

Extracted so far:

- `app/app-elements.ts`
- `app/lifecycle.ts`
- `app/create-clock-app.ts`
- `data/locations.ts`
- `data/hebcal-service.ts`
- `ui/event-icons.ts`
- `event-editor/event-validation.ts`
- `event-editor/event-editor-controller.ts`

`main.ts` is now a small entrypoint that imports styles, creates the app, starts it and wires HMR disposal. `create-clock-app.ts` owns the current application state, startup orchestration and runtime cleanup. This is intentionally a large temporary application boundary; internal decomposition is deferred to later focused extractions.

## T070 Gate

T070 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser gate was completed manually outside Codex in a regular browser. The app loaded, the clock and existing events were displayed, adding and deleting an event worked, display preferences opened, and no console errors were observed.

Codex browser tooling was blocked by environment constraints only, not by an app failure: Vite failed from Codex with `EPERM` on `D:\Oriya\Projects`, localhost was blocked with `ERR_BLOCKED_BY_CLIENT`, and `file://` is blocked by browser-tool policy.
