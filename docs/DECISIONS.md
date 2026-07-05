# Decisions

## ADR: Official Web Application Path

Status: accepted on 2026-07-05.

Decision: the official Beta web application lives under `apps/web`.

Rationale: `web` is product-oriented, short, and avoids continuing prototype-era naming.

## ADR: Web Package Name

Status: accepted on 2026-07-05.

Decision: the application package is `@clock/web`.

Rationale: the package is the official web consumer of `@clock/clock`.

## ADR: Initial Beta Version

Status: accepted on 2026-07-05.

Decision: the application version is `0.1.0-beta.1`.

Rationale: the web app is now an official Beta surface. The core library package remains unchanged because this migration does not alter library behavior.

## ADR: Migration Compatibility

Status: accepted on 2026-07-05.

Decision: the application keeps JSON export schema version `1` and reads the previous display-mode localStorage key.

Rationale: existing user data and exported files from the previous web surface must keep working.

## ADR: Historical Screens

Status: accepted on 2026-07-05.

Decision: historical prototype screens are preserved under `archive/legacy-app-screens` and excluded from active app builds.

Rationale: the code still has historical value, but it must not remain part of the official application source or production bundle.

## Existing Architectural Decisions Still In Force

- `packages/clock` remains framework-independent.
- SVG remains the primary renderer.
- The renderer receives resolved events; event resolution stays outside rendering.
- The app is Hebrew-first and RTL.
- The current migration is behavior-preserving and does not start the architecture refactor.
