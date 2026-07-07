# Tasks

Updated: 2026-07-07

## Active Task

T072: Extract clock shell controller

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

## T070 Checklist

- `[x]` Add `apps/web/src/app/create-clock-app.ts`.
- `[x]` Define `ClockApp` with `start()` and `destroy()`.
- `[x]` Define `ClockAppDeps` with `document` and `window`.
- `[x]` Move app initialization out of `main.ts`.
- `[x]` Keep current state shape inside the new application boundary.
- `[x]` Keep `main.ts` free of business logic and DOM queries.
- `[x]` Route top-level startup listeners through lifecycle cleanup.
- `[x]` Add focused tests for the boundary and entrypoint.
- `[ ]` Run final docs/typecheck/tests/build and browser verification.
- `[ ]` Create T070 commit.

## T071 Checklist

- `[x]` Create a narrow settings controller/binder.
- `[x]` Move location and display preference listeners out of `create-clock-app.ts`.
- `[x]` Keep settings state ownership in `create-clock-app.ts`.
- `[x]` Add explicit dependencies through controller callbacks.
- `[x]` Add cleanup for moved listeners.
- `[x]` Add focused settings-controller tests.
- `[x]` Run final docs/typecheck/tests/build and browser verification.
- `[x]` Create T071 commit.

## T072 Checklist

- `[x]` Create a narrow clock-shell controller.
- `[x]` Move live clock creation out of `create-clock-app.ts`.
- `[x]` Move clock mount listeners out of `create-clock-app.ts`.
- `[x]` Move clock marker visual sync and mutation observer into the clock-shell controller.
- `[x]` Move the visual timer into the clock-shell controller.
- `[x]` Keep state ownership and provider/data flow in `create-clock-app.ts`.
- `[x]` Add explicit callbacks for event lookup, visuals, tooltip/menu handlers and visual timer work.
- `[x]` Add cleanup for moved listeners, timers and observer.
- `[x]` Add focused clock-shell controller tests.
- `[x]` Run final docs/typecheck/tests/build and browser verification.
- `[x]` Create T072 commit.
