# Tasks

Updated: 2026-07-06

## Active Task

T069: Frontend Architecture Refactor for the official Analog Event Clock Beta application.

## T068 Checklist

- `[x]` Confirm `main` is clean and up to date with `origin/main`.
- `[x]` Run pre-migration baseline checks.
- `[x]` Create branch `refactor/promote-demo-to-beta-app`.
- `[x]` Move tracked app files from `apps/demo` to `apps/web` using Git rename operations.
- `[x]` Confirm rename detection with `git diff --cached --summary`.
- `[x]` Rename package to `@clock/web`.
- `[x]` Promote the active app entrypoint to `apps/web/index.html`.
- `[x]` Move historical prototype screens outside active `src`.
- `[x]` Add backward compatibility for the legacy display-mode localStorage key.
- `[x]` Keep exported JSON schema compatible with previous version `1`.
- `[x]` Update active product documentation.
- `[x]` Add `docs/APP_MIGRATION.md`.
- `[x]` Run final checks and browser verification.
- `[x]` Create logical commits.

## T069 Checklist

- `[x]` Create a separate branch for the architecture refactor.
- `[x]` Run baseline docs/typecheck/tests/build before code movement.
- `[x]` Map responsibilities inside `apps/web/src/main.ts`.
- `[x]` Extract typed DOM binders by domain without changing behavior.
- `[x]` Extract app lifecycle cleanup boundaries.
- `[x]` Extract event-editor logic behind a narrow API.
- `[ ]` Extract settings logic behind a narrow API.
- `[x]` Extract data/import/export/provider helpers behind a narrow API.
- `[x]` Keep `packages/clock` behavior unchanged.
- `[ ]` Run final docs/typecheck/tests/build and browser verification.

## T069 Progress Notes

- Added `app/app-elements.ts` as the first typed DOM binder.
- Added `data/locations.ts` and `data/hebcal-service.ts`.
- Added `ui/event-icons.ts`.
- Added `event-editor/event-validation.ts`.
- Added `app/lifecycle.ts` and routed observer/timer/listener cleanup through it.
- Added `event-editor/event-editor-controller.ts` for event form toggles and regular/special event submits.
- Added focused tests for lifecycle cleanup and event-editor submit behavior.
- `main.ts` still owns state, settings, import/export, clock-shell interactions and rendering coordination.
- The next step should continue with shallow settings extraction before reconsidering a deeper `createClockApp` boundary.
