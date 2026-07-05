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

During the Migration Phase, the application intentionally keeps the existing implementation shape:

```text
apps/web/
  index.html
  src/
    main.ts
    styles.css
    analog-event-clock.test.ts
    dev.gif
```

The next phase will split the application into `app`, `clock-shell`, `event-editor`, `settings`, `data`, `ui`, and `styles` modules. That refactor is explicitly out of scope for the migration.

## Decisions In Force

- The core library remains independent of the official web app.
- The app consumes the library through `@clock/clock`.
- The app is Hebrew-first and RTL.
- The current migration is behavior-preserving.
- Historical prototype screens must not be included in the official production build.
