# Project Status

Updated: 2026-07-06

## Current State

The project has two active product surfaces:

- `packages/clock`: the reusable TypeScript/SVG clock library.
- `apps/web`: the official Analog Event Clock Beta web application.

The previous web surface under `apps/demo` was promoted rather than rewritten. Historical prototype screens are preserved under `archive/legacy-app-screens` and are not part of the active Vite or TypeScript build.

## Active Task

T069: Frontend Architecture Refactor for the official Analog Event Clock Beta application.

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

## T069 Current Progress

Current extraction strategy: shallow controller modules around the existing `main.ts` state.

Extracted so far:

- `app/app-elements.ts`
- `app/lifecycle.ts`
- `data/locations.ts`
- `data/hebcal-service.ts`
- `ui/event-icons.ts`
- `event-editor/event-validation.ts`
- `event-editor/event-editor-controller.ts`

`main.ts` still owns application state and orchestration. The next recommended extraction is a narrow settings controller/binder, not a deep `createClockApp` boundary yet.

## Next Gate

T069 must run:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`
- Desktop and mobile browser verification.
- Clean working tree after logical commits.
