# Current Task

עודכן: 2026-07-05

## משימה פעילה

T068: Promote the web surface to the official Analog Event Clock Beta application.

## Context

The experimental phase is complete. The existing web product is now being promoted to the official Beta application while preserving behavior and keeping `packages/clock` as the reusable embeddable library.

This migration is intentionally limited to productization:

- Rename the active app workspace from `apps/demo` to `apps/web`.
- Rename the package from `@clock/demo` to `@clock/web`.
- Promote the active analog event clock screen to the official app entrypoint.
- Move historical prototype screens outside active `src` so they are not built.
- Update documentation to describe a Beta application, not an experimental surface.
- Preserve import compatibility for old exported JSON files and display-mode localStorage.

## Out Of Scope

- No `main.ts` architecture refactor.
- No state-shape changes.
- No module extraction.
- No CSS split.
- No UX redesign.
- No behavior change in `packages/clock`.

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
