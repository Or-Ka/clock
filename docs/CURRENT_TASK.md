# Current Task

Updated: 2026-07-13

## Active Task

T077: Prepare Vercel Deployment

## Goal

Make the official `apps/web` application deployable from the repository root without manual build-path guesswork in Vercel.

## Scope

- Pin the supported Node.js major version used by the build.
- Add a repository-owned Vercel configuration.
- Install dependencies from `package-lock.json` with `npm ci`.
- Build both the reusable clock library and the official web application through the root build command.
- Publish only `apps/web/dist`.
- Support direct SPA navigation through an `index.html` fallback.
- Document the Vercel import settings and environment-variable requirements.

## Out Of Scope

- No product behavior, UX or CSS changes.
- No API proxy or serverless functions.
- No custom domain configuration.
- No Vercel account or project creation without the account owner's authorization.

## Gate

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

The generated `apps/web/dist/index.html` and referenced production assets must exist after the root build.

## Result

T077 implementation and verification are complete on `chore/vercel-deployment`. The repository is ready to be imported into Vercel from its root directory. Account linking, production deployment and custom-domain selection remain owner-controlled external actions.
