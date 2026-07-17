# Current Task

Updated: 2026-07-17

## Active Task

T081: Restore Weekend Shabbat Times

## Goal

Restore automatic Shabbat entry and exit times as default special events derived from the selected location's sunset.

## Scope

- Show `כניסת שבת` only on Friday at sunset minus 20 minutes.
- Show `יציאת שבת` only on Saturday at sunset plus 35 minutes.
- Resolve the events into the enabled-by-default special-events layer.
- Keep Sunday through Thursday free of automatic Shabbat events.
- Add focused regression coverage.

## Out Of Scope

- No `packages/clock` API changes.
- No storage or import/export schema changes.
- No layout or styling redesign.
- No automatic Shabbat events outside Friday and Saturday.

## Gate

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification must confirm the Friday event against loaded sunset data; Saturday remains covered by the explicit weekday/offset regression assertions.

## Result

Completed on `codex/restore-shabbat-times` and opened as pull request #28. Merge remains pending explicit user approval.

- Removed the disabled feature flag that prevented automatic Shabbat events from resolving.
- Renamed the Friday event to `כניסת שבת` and set it to 20 minutes before sunset.
- Set `יציאת שבת` to 35 minutes after Saturday sunset.
- Routed both automatic events through the special-events layer.
- Updated focused regression assertions.
- Passed documentation, lint, typecheck, all `150` tests, the production build and the core-library build.
- Browser verified Friday 2026-07-17: sunset loaded at 19:48:57 and `כניסת שבת` rendered at 19:28:57, with no console errors or warnings.
