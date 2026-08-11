# Decisions

## ADR: Public Repository Collaboration Baseline

Status: accepted on 2026-08-11.

Decision: the repository is published under the MIT license and uses least-privilege CI, pinned GitHub Actions,
CodeQL, Dependabot, private vulnerability reporting, protected `main`, documented privacy behavior and bounded JSON imports.

Rationale: the project is being shared with developer communities for collaboration. A public repository needs an
explicit reuse license, a predictable contribution path, automated security feedback and a deployment boundary that
does not rely only on application code being free of known XSS sinks.

Consequences: all pull requests must pass the release gate. The production CSP keeps same-origin scripts while
allowing requests only to the documented Sunrise-Sunset and Hebcal providers. npm publication remains independent
and is not authorized by this decision.

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

## ADR: Streamlined Display Controls

Status: accepted on 2026-08-11.

Decision: the settings UI keeps clock theme, dial style, inner-ring visibility, display mode, font scale and clock scale. It does not expose display templates, font-family selection or direct display-color inputs.

Rationale: the retained controls describe distinct user-visible behavior, while the removed controls made the panel unnecessarily dense. The annotated product screenshot is the acceptance reference.

Consequences: display modes, the clock context menu, floating-clock behavior, Document Picture-in-Picture and persisted compatibility remain active. No replacement color picker is introduced. The retained clock theme owns the application surface and foreground CSS tokens so its contrast cannot be overridden by legacy inline display colors.

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
