# Rendering Strategy

## Primary Renderer

The primary renderer is SVG.

## Principles

- Rendering receives resolved time and event data.
- Rendering does not fetch providers or own application state.
- SVG output must remain responsive.
- Interactive marker accessibility will be improved in a later library phase.

## Current Product Use

The official web application under `apps/web` uses the live analog clock and event-ring renderer from `packages/clock`.

Resolved events with status `past` use marker-level reduced opacity so the complete SVG marker, including application-supplied symbols, recedes together. The official web app adds reduced saturation and mirrors the same hierarchy in its event list; `next` and `future` events remain at full emphasis.

## Historical Screens

Earlier prototype screens and spike implementations are archived under `archive/legacy-app-screens` and are excluded from active builds.

## Migration Constraint

The current migration does not change renderer behavior.
