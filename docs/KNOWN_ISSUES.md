# Known Issues

Updated: 2026-07-07

## Open

- `apps/web/src/app/create-clock-app.ts` is still a large temporary application boundary. T071 extracted the first settings listener boundary and T072 extracted live clock-shell wiring, but settings state/rendering side effects, import/export, tooltip/timer/context/floating clock state and provider coordination still need extraction.
- `apps/web/src/styles.css` remains a single stylesheet. CSS splitting is deferred.
- The current app layout still exposes many management controls on the main page. UX redesign is deferred.
- The developer stamp still ships with the active app pending a separate production cleanup decision.

## Not Regressions

- Historical prototype screens are archived under `archive/legacy-app-screens` and are not part of the official app build.
- The previous display-mode localStorage key is intentionally retained in code as a legacy read path.
