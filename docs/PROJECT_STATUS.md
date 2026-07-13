# Project Status

Updated: 2026-07-13

## Current State

The project has two active product surfaces:

- `packages/clock`: the reusable TypeScript/SVG clock library.
- `apps/web`: the official Analog Event Clock Beta web application.

The previous web surface under `apps/demo` was promoted rather than rewritten. Historical prototype screens are preserved under `archive/legacy-app-screens` and are not part of the active Vite or TypeScript build.

## Active Task

T075: Extract Data/Provider Controller

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

Current extraction strategy: a temporary application boundary around the existing state and orchestration, shallow controller modules around stable responsibilities, and a small internal state/domain API around existing app state.

Extracted so far:

- `app/app-elements.ts`
- `app/lifecycle.ts`
- `app/create-clock-app.ts`
- `app-state/app-state.ts`
- `settings/settings-elements.ts`
- `settings/settings-controller.ts`
- `clock-shell/clock-shell-controller.ts`
- `data/locations.ts`
- `data/hebcal-service.ts`
- `data/provider-controller.ts`
- `ui/event-icons.ts`
- `event-editor/event-validation.ts`
- `event-editor/event-editor-controller.ts`

`main.ts` is a small entrypoint that imports styles, creates the app, starts it and wires HMR disposal. `create-clock-app.ts` owns application state, startup orchestration and runtime cleanup. T074 added an internal `app-state` API so part of that state access now goes through named methods and pure event-layer helpers instead of scattered direct mutations. T075 added a small provider controller for sunrise/sunset and Hebcal refresh orchestration.

## T075 Gate

T075 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser verification was attempted after the product-code change. A local static preview server started on `127.0.0.1:4176`, but the Codex in-app browser blocked the local URL with `ERR_BLOCKED_BY_CLIENT` before the app loaded. T075 is not browser verified; manual browser verification is required before merge. This is tracked as an environment/tooling blocker, not as an observed application failure.
