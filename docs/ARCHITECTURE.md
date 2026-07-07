# Architecture

## Workspace

```text
apps/
  web/
packages/
  clock/
archive/
  legacy-app-screens/
```

## Active Boundaries

- `packages/clock`: reusable framework-independent TypeScript library.
- `apps/web`: official Analog Event Clock Beta web application.
- `archive/legacy-app-screens`: historical prototype screens, outside active TypeScript and Vite build.

## Library Structure

`packages/clock/src`:

```text
core/
time/
events/
rendering/
themes/
```

Responsibilities:

- `core`: shared context and lifecycle contracts.
- `time`: time sources, schedulers, projection and clock time calculations.
- `events`: event definitions and resolution.
- `rendering`: SVG renderer and live/static clock controllers.
- `themes`: reusable clock colors/tokens.

## Application Structure

After the first T069 extraction passes, the application keeps `main.ts` as the state and orchestration owner while introducing narrow modules around stable boundaries:

```text
apps/web/
  index.html
  src/
    app/
      app-elements.ts
      lifecycle.ts
    data/
      hebcal-service.ts
      locations.ts
    event-editor/
      event-editor-controller.ts
      event-validation.ts
    ui/
      event-icons.ts
    main.ts
    styles.css
    analog-event-clock.test.ts
    dev.gif
```

The current refactor is intentionally shallow: modules receive explicit elements/callbacks, while state ownership remains in `main.ts`. The next architecture pass should continue with settings and clock-shell boundaries before introducing a deeper `createClockApp` entrypoint.

## Decisions In Force

- The core library remains independent of the official web app.
- The app consumes the library through `@clock/clock`.
- The app is Hebrew-first and RTL.
- The current refactor is behavior-preserving.
- Historical prototype screens must not be included in the official production build.
