# Tasks

עודכן: 2026-07-05

## משימה פעילה

T068: Promote the web surface to the official Analog Event Clock Beta application.

## T068 Checklist

- `[x]` Confirm `main` is clean and up to date with `origin/main`.
- `[x]` Run pre-migration baseline checks.
- `[x]` Create branch `refactor/promote-demo-to-beta-app`.
- `[x]` Move tracked app files from `apps/demo` to `apps/web` using Git rename operations.
- `[x]` Confirm rename detection with `git diff --cached --summary`.
- `[x]` Rename package to `@clock/web`.
- `[x]` Promote the active app entrypoint to `apps/web/index.html`.
- `[x]` Move historical prototype screens outside active `src`.
- `[x]` Add backward compatibility for the legacy display-mode localStorage key.
- `[x]` Keep exported JSON schema compatible with previous version `1`.
- `[x]` Update active product documentation.
- `[x]` Add `docs/APP_MIGRATION.md`.
- `[ ]` Run final checks and browser verification.
- `[ ]` Create logical commits.

## Next Task

T069: Frontend Architecture Refactor for the official Beta application.

T069 must be done in a separate branch and must not be mixed into T068.
