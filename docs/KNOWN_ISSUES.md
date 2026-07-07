# Known Issues

Updated: 2026-07-07

## Open

- `apps/web/src/app/create-clock-app.ts` is now a large temporary application boundary. T070 moved behavior out of `main.ts`, but settings, import/export, clock-shell interactions and rendering coordination still need extraction.
- `apps/web/src/styles.css` remains a single stylesheet. CSS splitting is deferred.
- The current app layout still exposes many management controls on the main page. UX redesign is deferred.
- The developer stamp still ships with the active app pending a separate production cleanup decision.

## Not Regressions

- Historical prototype screens are archived under `archive/legacy-app-screens` and are not part of the official app build.
- The previous display-mode localStorage key is intentionally retained in code as a legacy read path.
