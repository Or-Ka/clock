# Current Task

עודכן: 2026-07-05

## משימה פעילה

T069: Frontend Architecture Refactor for the official Analog Event Clock Beta application.

## Context

T068 promoted the existing web product to the official Beta application under `apps/web`. The next step is to split the application architecture while preserving behavior and keeping `packages/clock` as the reusable embeddable library.

The application still intentionally has the pre-refactor shape:

- `apps/web/index.html`
- `apps/web/src/main.ts`
- `apps/web/src/styles.css`

T069 should begin by creating clear application modules around existing responsibilities, without redesigning the UI and without changing the state shape unless a small local adapter is unavoidable.

## Out Of Scope

- No CSS split.
- No UX redesign.
- No behavior change in `packages/clock`.
- No marker accessibility API changes yet.
- No production cleanup for the dev stamp yet.

## Gate

Run:

```powershell
npm.cmd run docs:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Also verify the official app in desktop and mobile browser viewports with no console errors or warnings.
