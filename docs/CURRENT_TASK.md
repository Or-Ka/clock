# Current Task

Updated: 2026-08-11

## Active Task

T084: Public Release Readiness

## Goal

Prepare the public repository and deployed Beta for sharing in developer communities and for potential collaboration.

## Scope

- Eliminate known dependency advisories from the committed lockfile.
- Harden CI with least-privilege permissions, formatting and dependency-audit gates, pinned actions and CodeQL.
- Add Dependabot, repository security guidance and contribution templates.
- Add production HTTP security headers without breaking external day-time and Hebcal requests.
- Bound and validate imported JSON before applying application state.
- Document local persistence, third-party API requests and browser permissions.
- Add an explicit MIT license and collaboration-focused repository documentation.
- Reduce the production developer-stamp media payload while preserving its design.
- Normalize Git text handling and remove local-path references from public documentation.

## Out Of Scope

- No npm publication of `@clock/clock`.
- No change to the library public API or clock/event behavior.
- No redesign of the product UI.
- No change to JSON export schema version `1`.

## Gate

```powershell
npm.cmd audit --audit-level=high
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

The final gate also requires successful GitHub CI and CodeQL checks, protected `main`, enabled repository security
features, and browser verification of the deployed site with the expected security headers.
