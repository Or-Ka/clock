# Current Task

Updated: 2026-07-15

## Active Task

T079: Persist User Configuration And Refresh Defaults

## Goal

Make the application reopen with the user's events and configuration while improving the first-run defaults.

## Scope

- Default first-run location to Tel Aviv.
- Remove the three personal sample events.
- Make fixed day-time events use the selected default zmanit set consistently.
- Save user-controlled location, zmanit sets, events, display preferences, visuals, alerts and layer visibility automatically.
- Restore saved state safely on reload and preserve version-1 JSON import compatibility.
- Add focused regression tests.

## Out Of Scope

- No `packages/clock` API changes.
- No provider algorithm changes.
- No refresh warning when automatic persistence succeeds.
- No server-side or account synchronization.

## Gate

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification should cover first-run defaults, adding an event, reloading and restoring the event and settings.

## Result

Completed on `codex/persist-events-settings`.

- Tel Aviv is the first-run location and the personal layer starts empty.
- Fixed day-time defaults all inherit the selected `sunrise-sunset` set.
- The configurable application snapshot is saved automatically and restored safely from localStorage.
- Version-1 JSON files remain import-compatible; new exports include layer visibility and clock appearance.
- The full CLI gate passed with `150` tests.
- Browser verification confirmed event, location and layer restoration after reload with no console errors or warnings.
