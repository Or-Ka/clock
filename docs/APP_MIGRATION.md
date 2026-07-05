# App Migration

עודכן: 2026-07-05

## Purpose

Promote the existing web product to the official Analog Event Clock Beta application without rewriting behavior or changing the core library.

## Old Structure

```text
apps/demo/
  src/
    dual-ring-events/
    live-clock/
    product-static-clock/
    spikes/
```

## New Structure

```text
apps/web/
  index.html
  src/
    main.ts
    styles.css
    analog-event-clock.test.ts
    dev.gif

archive/
  legacy-app-screens/
```

## Renamed

- `apps/demo` -> `apps/web`
- `@clock/demo` -> `@clock/web`
- Active app entry: `src/dual-ring-events/index.html` -> `apps/web/index.html`
- Active app script: `src/dual-ring-events/main.ts` -> `apps/web/src/main.ts`
- Active app styles: `src/dual-ring-events/styles.css` -> `apps/web/src/styles.css`
- Active app test: `dual-ring-events.test.ts` -> `analog-event-clock.test.ts`

## Product Identity

- English: `Analog Event Clock`
- Hebrew: `שעון אירועים אנלוגי`
- Package: `@clock/web`
- Version: `0.1.0-beta.1`

The version belongs to the web application only. `@clock/clock` remains unchanged in this migration.

## Backward Compatibility

- JSON exports from the previous web surface continue to import because the export schema remains `version: 1`.
- New exports use the filename prefix `analog-event-clock`.
- The previous display-mode localStorage key `dual-ring-events-display-mode` is read once and copied to the new key `analog-event-clock-display-mode`.
- New writes use only the new localStorage key.

## Archived

Historical screens moved out of active app source:

- `archive/legacy-app-screens/live-clock`
- `archive/legacy-app-screens/product-static-clock`
- `archive/legacy-app-screens/spikes`
- `archive/legacy-app-screens/demo-context.ts`

These files are not imported by active code, are ignored by ESLint, and are outside the app TypeScript `include`.

## Updated Scripts

- Root `dev` now runs `@clock/web`.
- Root `build` now builds `@clock/web`.
- `@clock/web` build now builds the official app entrypoint only.

## Remaining Limitations

- `apps/web/src/main.ts` is still a large controller and has not been refactored.
- CSS is still a single active stylesheet.
- UX is still the pre-migration layout.
- The developer stamp remains in the active app pending a separate production cleanup decision.

## Next Phase

Frontend Architecture Refactor in a separate branch.
