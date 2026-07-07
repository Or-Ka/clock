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

After T070, the application has a small entrypoint and a temporary application boundary around the existing state and orchestration:

```text
apps/web/
  index.html
  src/
    app/
      app-elements.ts
      create-clock-app.ts
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

`main.ts` imports styles, creates `createClockApp({ document, window })`, starts it and disposes it during HMR. `create-clock-app.ts` owns the current app state, startup orchestration and runtime cleanup.

The current boundary is intentionally temporary and large: modules receive explicit elements/callbacks where already extracted, while the remaining state ownership stays inside the application boundary. The next architecture pass should continue with settings and clock-shell boundaries before introducing deeper state/domain APIs.

## Decisions In Force

- The core library remains independent of the official web app.
- The app consumes the library through `@clock/clock`.
- The app is Hebrew-first and RTL.
- The current refactor is behavior-preserving.
- Historical prototype screens must not be included in the official production build.
