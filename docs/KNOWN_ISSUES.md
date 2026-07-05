# Known Issues

עודכן: 2026-07-05

## Open

- `apps/web/src/main.ts` remains a large controller. This is intentionally deferred to the Frontend Architecture Refactor.
- `apps/web/src/styles.css` remains a single stylesheet. CSS splitting is deferred.
- The current app layout still exposes many management controls on the main page. UX redesign is deferred.
- The developer stamp still ships with the active app pending a separate production cleanup decision.

## Not Regressions

- Historical prototype screens are archived under `archive/legacy-app-screens` and are not part of the official app build.
- The previous display-mode localStorage key is intentionally retained in code as a legacy read path.
