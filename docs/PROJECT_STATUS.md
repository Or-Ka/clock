# Project Status

Updated: 2026-07-17

## Current State

The project has two active product surfaces:

- `packages/clock`: the reusable TypeScript/SVG clock library.
- `apps/web`: the official Analog Event Clock Beta web application.

The previous web surface under `apps/demo` was promoted rather than rewritten. Historical prototype screens are preserved under `archive/legacy-app-screens` and are not part of the active Vite or TypeScript build.

## Active Task

T081: Restore Weekend Shabbat Times

## Current Branch

`codex/restore-shabbat-times`

## T081 Scope

- Restore automatic Shabbat entry and exit events as first-run defaults.
- Show Shabbat entry only on Friday, 20 minutes before sunset.
- Show Shabbat exit only on Saturday, 35 minutes after sunset.
- Keep both events in the enabled-by-default special-events layer.

## T081 Gate

- Friday resolves only `כניסת שבת` at sunset minus 20 minutes.
- Saturday resolves only `יציאת שבת` at sunset plus 35 minutes.
- Sunday through Thursday resolve neither automatic Shabbat event.
- Documentation, lint, typecheck, tests and the production build pass.
- Browser verification on Friday confirms entry exactly 20 minutes before the loaded sunset with no console errors or warnings.

## T080 Scope

- Bring the event hover tooltip, timer action menu and clock context menu into one current design language.
- Use active display colors and the selected font in dark and light themes.
- Replace legacy raised/boxed button treatments with clean tab-like lines and states.
- Keep floating panels usable in full, clock-only, floating-clock and Picture-in-Picture modes.
- Add regression coverage and browser verification.

## T080 Gate

- The event hover tooltip, timer action menu, clock context menu and event visual editor share one theme-aware surface and selected display font.
- Timer and context-menu actions use flat tab-like lines instead of legacy raised controls.
- Dark and light display templates were browser verified for hover, timer and secondary-click flows.
- Floating-clock mode was browser verified with compact context-menu spacing and a layer above the clock.
- Documentation, lint, typecheck, all `150` tests and the production build passed.

## T079 Scope

- Use Tel Aviv as the first-run location.
- Start with no personal sample events.
- Resolve fixed day-time events from one selected zmanit set unless the user explicitly changes it.
- Persist the full configurable application snapshot automatically in browser storage and restore it on reload.
- Keep the existing JSON import/export format compatible.

## T079 Gate

- First-run browser verification starts in Tel Aviv with no personal sample events.
- All seven fixed day-time events show the selected `sunrise-sunset` set as their default.
- A personal event, changed location and changed layer visibility survived a full browser reload.
- Browser verification completed with no console errors or warnings.
- Documentation, lint, typecheck, all `150` tests and the production build passed.

## T078 Gate

- The countdown action menu now follows the active display colors, font and control styling.
- Full, clock-only and floating-clock modes were browser verified, including a compact viewport requested at 200×200 (the browser runtime enforced a 240×200 minimum).
- Dark and light display templates were browser verified.
- The timer tooltip closes while the action menu is open, and the menu stays above the floating clock layer.
- Documentation, lint, typecheck, all `147` tests, the web production build and the core-library build passed.

## Deployment Readiness

- Vercel is configured from the repository root.
- Node.js is pinned to major version `24.x`.
- Dependency installation uses the committed lockfile through `npm ci`.
- The root workspace build produces the deployable site in `apps/web/dist`.
- Direct SPA navigation falls back to `index.html`.
- No deployment environment variables are currently required.

## T077 Gate

- `npm.cmd ci` passed after stopping a stale local Vite process that held `esbuild.exe` open.
- Documentation, lint, typecheck, all `146` tests and both builds passed.
- The generated `apps/web/dist/index.html` references three production assets; all three exist.
- Browser verification of the production preview passed with Hebrew/RTL content, a rendered clock, loaded Jerusalem day-time data, no horizontal overflow and no console errors or warnings.

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
- `data/import-export-controller.ts`
- `data/provider-controller.ts`
- `ui/event-icons.ts`
- `event-editor/event-validation.ts`
- `event-editor/event-editor-controller.ts`

`main.ts` is a small entrypoint that imports styles, creates the app, starts it and wires HMR disposal. `create-clock-app.ts` owns application state, startup orchestration and runtime cleanup. T074 added an internal `app-state` API so part of that state access now goes through named methods and pure event-layer helpers instead of scattered direct mutations. T075 added a small provider controller for sunrise/sunset and Hebcal refresh orchestration. T076 added a narrow import/export controller for browser file mechanics while leaving export snapshot assembly and imported state restoration in the application boundary.

## T076 Gate

T076 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser verification could not start because the in-app browser control tool is not exposed in the current session. T076 is not browser verified; this is an environment/tooling blocker, not an observed application failure.

## T075 Gate

T075 CLI gate passed:

- `npm.cmd run docs:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

Browser verification was attempted after the product-code change. A local static preview server started on `127.0.0.1:4176`, but the Codex in-app browser blocked the local URL with `ERR_BLOCKED_BY_CLIENT` before the app loaded. T075 is not browser verified; manual browser verification is required before merge. This is tracked as an environment/tooling blocker, not as an observed application failure.
