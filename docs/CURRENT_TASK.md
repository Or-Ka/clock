# Current Task

Updated: 2026-07-13

## Active Task

T076: Extract Import/Export Controller

## Context

T075 extracted provider request orchestration and left import/export browser mechanics, JSON parsing and state restoration inside `create-clock-app.ts`.

T076 extracts a conservative import/export controller for the stable browser and UI boundary while keeping application state restoration and its rendering side effects in `create-clock-app.ts`.

Completed in T076:

- Added `apps/web/src/data/import-export-controller.ts`.
- Moved export/import button listeners and cleanup into the controller.
- Moved JSON download creation, file reading, JSON parsing, status messages and file-input reset into the controller.
- Kept export schema version `1` and the current file name.
- Kept export snapshot assembly and imported state application in `create-clock-app.ts` through explicit callbacks.
- Added focused controller tests for export, import success/error and cleanup.

## Out Of Scope

- No UX or CSS changes.
- No storage schema changes.
- No import/export schema changes.
- No app state shape changes.
- No relocation of cross-surface state restoration side effects.
- No `packages/clock` changes.
- No T077 work.

## Gate

Final T076 CLI gate:

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Because Codex shell cwd handling can fall back to `C:\` in this environment, the same commands may be run with `npm.cmd --prefix D:\Oriya\Projects\clock ...` during verification.
