# Project Status

עודכן: 2026-07-05

## מצב נוכחי

The project now has two active product surfaces:

- `packages/clock`: the reusable TypeScript/SVG clock library.
- `apps/web`: the official Analog Event Clock Beta web application.

The previous web surface under `apps/demo` has been promoted rather than rewritten. Historical prototype screens are preserved under `archive/legacy-app-screens` and are not part of the active Vite or TypeScript build.

## משימה פעילה

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

## Next Gate

T069 must run:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`
- Desktop and mobile browser verification.
- Clean working tree after logical commits.

## Next Task

Continue T069 after choosing the next extraction strategy for `main.ts`: shallow controller modules around the current state, or a deeper `createClockApp` boundary with explicit state/domain APIs.
