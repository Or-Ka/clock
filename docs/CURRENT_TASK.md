# Current Task

Updated: 2026-07-06

## Active Task

T069: Frontend Architecture Refactor for the official Analog Event Clock Beta application.

## Context

T068 promoted the existing web product to the official Beta application under `apps/web`. The next step is to split the application architecture while preserving behavior and keeping `packages/clock` as the reusable embeddable library.

T069 is progressing through conservative extraction sessions. The current branch keeps the legacy state shape and control flow while extracting narrow module boundaries around existing responsibilities.

Completed in the current shallow extraction pass:

- `apps/web/src/app/lifecycle.ts`: lifecycle cleanup registry.
- `apps/web/src/event-editor/event-editor-controller.ts`: regular/special event form toggles, validation and submit event creation behind callbacks.
- Focused tests for the new lifecycle and event-editor boundaries.

The app still intentionally keeps `main.ts` as the owner of application state and orchestration until a later, explicit `createClockApp` step is approved.

## Out Of Scope

- No CSS split.
- No UX redesign.
- No behavior change in `packages/clock`.
- No marker accessibility API changes yet.
- No production cleanup for the dev stamp yet.
- No `createClockApp` boundary in this shallow extraction pass.

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
