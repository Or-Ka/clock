# Project Status

עודכן: 2026-07-05

## מצב נוכחי

The project now has two active product surfaces:

- `packages/clock`: the reusable TypeScript/SVG clock library.
- `apps/web`: the official Analog Event Clock Beta web application.

The previous web surface under `apps/demo` is being promoted rather than rewritten. Historical prototype screens are preserved under `archive/legacy-app-screens` and are not part of the active Vite or TypeScript build.

## משימה פעילה

T068: Promote the web surface to the official Analog Event Clock Beta application.

## Current Branch

`refactor/promote-demo-to-beta-app`

## Migration Status

- Chosen app path: `apps/web`.
- Chosen package name: `@clock/web`.
- Chosen app version: `0.1.0-beta.1`.
- Product name: `Analog Event Clock` / `שעון אירועים אנלוגי`.
- Core library behavior: unchanged.

## Gates

The migration is complete only after:

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`
- Desktop and mobile browser verification
- Clean working tree after logical commits

## Next Task

After this migration is reviewed and merged, begin the Frontend Architecture Refactor in a separate branch.
