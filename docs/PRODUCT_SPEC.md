# Product Spec

## Vision

Analog Event Clock is a Hebrew-first Beta web application for viewing a live analog clock with day/night event rings, zmanim-related events, personal events, alerts, countdowns, and display customization.

The application consumes the reusable `packages/clock` library. The library remains embeddable and framework-independent.

## Audiences

- End users who want a clock-first Hebrew/RTL interface with event timing.
- Developers who want to embed the underlying clock library.
- Future product maintainers working on the official Beta application.

## Current Beta Scope

- Official web application under `apps/web`.
- Reusable library under `packages/clock`.
- Hebrew and RTL UI.
- Live analog clock with two event rings.
- Location presets and timezone display.
- Sunrise/sunset-based day-time events through existing providers.
- Personal and derived events.
- Display preferences.
- Import/export of application state.
- Compatibility with state exported by the previous web surface.

## Out Of Scope For Current Migration

- No architecture refactor of `main.ts`.
- No UX redesign.
- No public library behavior change.
- No React adapter, Web Component, desktop wrapper, or native app.

## Product Identity

- English name: `Analog Event Clock`.
- Hebrew name: `שעון אירועים אנלוגי`.
- App package: `@clock/web`.
- Initial Beta version: `0.1.0-beta.1`.
