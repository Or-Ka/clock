# Changelog

## Unreleased

- Restored enabled-by-default automatic Shabbat times in the special-events layer: Friday entry 20 minutes before sunset and Saturday exit 35 minutes after sunset.
- Unified the event tooltip, timer action menu, clock context menu and event visual editor under one theme-aware floating-panel design.
- Replaced legacy raised menu controls with clean tab-like rows, fine dividers, active accent lines and the selected display font.
- Added a current-mode context-menu header, compact floating-mode styling and regression coverage for overlay ordering.
- Changed the first-run location to Tel Aviv and removed personal sample events.
- Unified fixed day-time defaults under the selected `sunrise-sunset` zmanit set.
- Added automatic localStorage persistence for events, location, zmanit configuration, display preferences, visuals, alerts, layer visibility and clock appearance.
- Added safe restore fallback, storage-failure messaging and version-1 JSON import compatibility for older exports.
- Refreshed the countdown action menu to use the active display font, colors, field treatment and primary/secondary button language.
- Added compact floating-clock/Picture-in-Picture layout, viewport-aware positioning and a layer above the floating clock.
- Prevented event tooltip overlap while the countdown action menu is open and added regression coverage.
- Added repository-owned Vercel deployment configuration for the npm workspace and official Vite application.
- Pinned deployment builds to Node.js 24, deterministic `npm ci` installation and the `apps/web/dist` output directory.
- Added an SPA navigation fallback and Vercel import instructions.
- Extracted a narrow import/export controller for browser file mechanics, JSON parsing, status messages and listener cleanup while preserving export schema version `1`.
- Added focused import/export controller tests for export, import success/error and lifecycle cleanup.
- Extracted provider refresh orchestration for sunrise/sunset and Hebcal data into a narrow provider controller.
- Added focused provider controller tests for caching, location changes and Hebrew-date detail refresh.
- Introduced an internal app state/domain API for existing location, timezone, display preference, event-layer, derived-event and rendered-event state.
- Added pure event-layer domain helpers and focused state/domain API tests.
- Routed part of `create-clock-app.ts` state access through the new app-state API without changing state shape, UX, CSS, storage, import/export or `packages/clock`.
- Extracted a shallow clock-shell controller for live clock creation, mount listeners, marker visual sync, clock mutation observer and visual timer cleanup.
- Added focused clock-shell controller tests for single-SVG rendering, refresh behavior, cleanup and marker visual updates.
- Extracted a shallow settings controller for location and display-preference listeners.
- Added settings controller cleanup and focused settings tests.
- Introduced `createClockApp` as the web app application boundary with `start()` and `destroy()`.
- Reduced `main.ts` to the official style import, app creation/start and HMR disposal entrypoint.
- Routed top-level startup listeners through lifecycle cleanup inside the new app boundary.
- Added focused tests for the `createClockApp` API and small-entrypoint shape.
- Continued T069 with a conservative frontend architecture extraction.
- Added a lifecycle cleanup registry for app listeners, timers and observers.
- Added a narrow event-editor controller for event form toggles and regular/special event submit handling.
- Added focused tests for the new lifecycle and event-editor boundaries.

## 0.1.0-beta.1 - 2026-07-05

- Promoted the web product to the official Analog Event Clock Beta application.
- Moved the active app workspace to `apps/web`.
- Renamed the app package to `@clock/web`.
- Promoted the active app entrypoint to `apps/web/index.html`.
- Moved historical prototype screens to `archive/legacy-app-screens`.
- Added compatibility for the previous display-mode localStorage key.
- Kept JSON export schema version `1` for imported state compatibility.
- Updated active documentation for the official Beta application.

## Historical Notes

Earlier project phases produced the clock library, live clock behavior, dual-ring event rendering, Hebrew/RTL UI, and prototype screens. Historical implementation notes are superseded by the current app migration documentation.
