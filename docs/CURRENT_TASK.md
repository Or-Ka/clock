# Current Task

Updated: 2026-07-15

## Active Task

T080: Unify Floating Panel Design

## Goal

Make every clock-triggered floating panel feel like part of the current clean, theme-aware interface.

## Scope

- Restyle the event hover tooltip.
- Restyle the timer action menu opened from an event.
- Restyle the clock context menu opened with the secondary mouse button.
- Align panel surfaces, typography, dividers, fields and buttons with the management tabs.
- Derive dark/light colors from active display tokens.
- Cover full, clock-only, floating-clock and Picture-in-Picture layouts.
- Add focused regression tests and browser verification.

## Out Of Scope

- No timer behavior or event-resolution changes.
- No `packages/clock` API changes.
- No broad page-layout redesign.
- No storage-schema changes.

## Gate

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification must cover dark and light themes, event hover, event click/timer actions and the clock context menu.

## Result

Completed on `codex/unify-floating-panels`.

- Added one shared, theme-aware surface for the event tooltip, timer action menu, clock context menu and event visual editor.
- Replaced raised controls with flat, tab-like rows, fine dividers and accent lines.
- Added a context-menu header and an explicit active display-mode state.
- Preserved compact rules for floating-clock and Picture-in-Picture layouts.
- Added focused regression assertions.
- Passed documentation, lint, typecheck, all `150` tests and the production build.
- Browser verified dark and light themes for hover, timer and context-menu flows, plus the compact floating-clock context menu.
