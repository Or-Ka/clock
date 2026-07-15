# Current Task

Updated: 2026-07-15

## Active Task

T078: Refresh Countdown Action Menu

## Goal

Bring the countdown action menu opened from clock events into the current application design language in every display mode.

## Scope

- Use the active display font and color tokens.
- Restyle the dialog hierarchy, color field and primary/secondary buttons.
- Adapt spacing and sizing for full, clock-only and floating-clock modes.
- Keep the menu inside the viewport and above the floating clock layer.
- Prevent the event tooltip from overlapping the action menu.
- Add regression assertions and browser verification.

## Out Of Scope

- No countdown timing or persistence changes.
- No event-model or `packages/clock` changes.
- No broader settings or clock-context-menu redesign.

## Gate

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification must cover dark and light templates plus `fullMode`, `clockOnly` and `floatingClock`, including a compact floating viewport.

## Result

T078 implementation and verification are complete on `codex/refresh-countdown-menu`. The CLI gate passed with `147` tests, and browser verification passed without console errors or warnings.
