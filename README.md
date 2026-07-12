# Clock

TypeScript workspace for an embeddable analog event clock library and the official Analog Event Clock web application.

## What Is Included

- `packages/clock`: reusable core library for time projection, event resolution, and SVG analog clock rendering.
- `apps/web`: official Beta web application, package `@clock/web`, version `0.1.0-beta.1`.
- `archive/legacy-app-screens`: historical prototype screens kept outside the active app build.
- `docs`: product, architecture, testing, migration, and session handoff documentation.

## Local Development

Install dependencies:

```powershell
npm.cmd install
```

Run the official web application:

```powershell
npm.cmd run dev
```

The app is served by Vite on `127.0.0.1`.

## Checks

```powershell
npm.cmd run docs:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

## Documentation

Start with [docs/README.md](docs/README.md). The app migration is documented in [docs/APP_MIGRATION.md](docs/APP_MIGRATION.md).
