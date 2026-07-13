# Documentation

עודכן: 2026-07-05

## Source Of Truth

The project includes:

- `packages/clock`: reusable embeddable analog clock library.
- `apps/web`: official Analog Event Clock Beta web application.

The web application is the primary product consumer of the library. Historical prototype screens are stored outside active app source under `archive/legacy-app-screens`.

## Main Documents

- [Product Spec](PRODUCT_SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Embedding API](EMBEDDING_API.md)
- [Event Model](EVENT_MODEL.md)
- [Rendering Strategy](RENDERING_STRATEGY.md)
- [Accessibility](ACCESSIBILITY.md)
- [Migration](APP_MIGRATION.md)
- [Project Status](PROJECT_STATUS.md)
- [Current Task](CURRENT_TASK.md)
- [Session Handoff](SESSION_HANDOFF.md)
- [Decisions](DECISIONS.md)
- [Changelog](CHANGELOG.md)

## Running The Official App

```powershell
npm.cmd run dev
```

This starts `@clock/web` from `apps/web` through Vite on `127.0.0.1`.

## Deploying The Official App

The repository root contains `vercel.json`. Import the repository into Vercel without selecting `apps/web` as a separate Root Directory. The committed configuration runs the root workspace build and publishes `apps/web/dist`.

No environment variables are currently required for deployment.

## Gates

```powershell
npm.cmd run docs:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```
