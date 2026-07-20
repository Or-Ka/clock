# Current Task

Updated: 2026-07-20

## Active Task

T082: Halftone Past Events

## Goal

Make every event whose resolved status is `past` visibly recede while preserving full emphasis for the next and future events.

## Scope

- Render the complete past-event SVG marker, including its custom icon, at reduced opacity.
- Desaturate past-event markers without changing their configured event color.
- Apply the same halftone hierarchy to past-event rows in the event list.
- Continue using the existing resolved `past` status and automatic live-clock refresh.
- Keep `next` and `future` events at full opacity and saturation.
- Add focused regression coverage and browser verification.

## Out Of Scope

- No event-time or status-resolution changes.
- No storage or import/export schema changes.
- No user-configurable halftone setting.
- No layout redesign.

## Gate

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification must compare live `past`, `next` and `future` events on both the clock and event list, and confirm no console errors or warnings.

## Result

Completed on `codex/halftone-past-events`. Merge remains pending explicit user approval.

- Past SVG marker groups render at `0.46` opacity with reduced saturation, so the event line and icon recede together.
- Past event-list cells render at `0.52` opacity with the same reduced-saturation treatment.
- `next` and `future` events remain at full visual strength.
- Added focused renderer and application-style regression assertions.
- Normalized source-test line endings so multiline assertions are stable on Windows.
- Passed documentation, lint, typecheck, all `151` tests, the production build and the core-library build.
- Browser verified the live clock and event list with multiple past events, one next event and future events; no console errors or warnings were recorded.
