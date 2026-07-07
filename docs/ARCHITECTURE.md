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

After T072, the application has a small entrypoint, a temporary application boundary around the existing state and orchestration, and shallow UI controller boundaries:

```text
apps/web/
  index.html
  src/
    app/
      app-elements.ts
      create-clock-app.ts
      lifecycle.ts
    settings/
      settings-controller.ts
      settings-elements.ts
    clock-shell/
      clock-shell-controller.ts
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

The settings controller owns settings listeners and cleanup while receiving explicit callbacks into the application boundary. The clock-shell controller owns live clock creation, marker visual sync, clock mount listener cleanup, the clock mutation observer and the visual timer while receiving explicit callbacks into app-owned state. The current boundary is intentionally temporary and large: modules receive explicit elements/callbacks where already extracted, while the remaining state ownership stays inside the application boundary. The next architecture pass should avoid deeper provider/import-export extraction until state/domain ownership is clearer.

## Decisions In Force

- The core library remains independent of the official web app.
- The app consumes the library through `@clock/clock`.
- The app is Hebrew-first and RTL.
- The current refactor is behavior-preserving.
- Historical prototype screens must not be included in the official production build.
