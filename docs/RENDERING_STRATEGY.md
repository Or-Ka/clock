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

## Historical Screens

Earlier prototype screens and spike implementations are archived under `archive/legacy-app-screens` and are excluded from active builds.

## Migration Constraint

The current migration does not change renderer behavior.
