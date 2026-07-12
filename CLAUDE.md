# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **הוראות עבודה מהירות (למודל):** ענה תמיד בעברית. פעל כמו Software Architect — מותר להציע שינויי ארכיטקטורה עמוקים, לא להיצמד למימוש הקיים, ולהסביר כל החלטה משמעותית (חלופות שנשקלו ולמה נדחו). מדיניות Git מפורטת בסוף הקובץ. פירוט מלא של ההוראות בסעיף [הוראות עבודה למודל](#הוראות-עבודה-למודל).

## Commands

This is a Windows/PowerShell project — the docs invoke npm as `npm.cmd`.

- Install: `npm.cmd install`
- Run tests (all): `npm.cmd test` (vitest, single run)
- Run a single test file: `npx vitest run packages/clock/src/time/time-source.test.ts`
- Run tests matching a name: `npx vitest run -t "part of test name"`
- Typecheck: `npm.cmd run typecheck` (`tsc -b` across project references)
- Build: `npm.cmd run build` (builds the library then the official web application)
- Docs gate: `npm.cmd run docs:check` — **run this before considering doc-touching work done** (see below)

Application (Vite, served on `127.0.0.1`):
- `npm.cmd run dev` — Analog Event Clock Beta application

## Architecture

npm workspace (not a multi-package monorepo). Two workspaces:
- `packages/clock` (`@clock/clock`) — the framework-agnostic core library. **No React/DOM-framework dependency.**
- `apps/web` (`@clock/web`) — official Analog Event Clock Beta web application.

The library core (`packages/clock/src`) is split by responsibility, and the layering matters:
- `time/` — time sources and scheduling. `TimeSource.now()` returns a `Temporal.Instant` (via `@js-temporal/polyfill`) and nothing else. `ClockScheduler` (e.g. `MinuteBoundaryClockScheduler`) is **separate** from `TimeSource` and only decides *when* to refresh. `timezone-projection.ts` converts an `Instant` + IANA timezone into a `StaticClockTime`.
- `events/` — event definitions and the **resolver**. Events are manual local-time instants of kind `sunrise` / `sunset` / `custom`, grouped into `EventLayerDefinition` layers. The resolver computes each event's `ring`, `angle`, and `status` producing `ResolvedClockItem`s. The renderer never assigns rings itself. `event-provider.ts` defines an async `EventLayerProvider` contract (e.g. `ApiEventLayerProvider`, `SunriseSunsetEventLayerProvider`) — the wiring to a real API is intentionally not connected yet.
- `rendering/` — SVG renderers. `createStaticAnalogClock` draws the SVG and accepts only resolved items. `createLiveAnalogClock` reuses the static clock and updates the *same* SVG on refresh/timezone/event changes rather than redrawing.
- `core/` — `ClockContext` (holds `timeZone` + `locale`) and cross-module lifecycle types.
- `themes/` — design tokens.

Data flow: `TimeSource` → `timezone-projection` → `StaticClockTime` → `events` resolver → `ResolvedClockItem[]` → `rendering`. Keep this direction; the renderer is a pure consumer of resolved items.

The dual-ring model (Phase 3): the outer ring is 06:00–18:00, the inner ring is 18:00–06:00; all 24 hours are always shown.

`packages/clock/src/index.ts` is the single public entry point — anything consumers should use is re-exported there.

### TypeScript conventions

- Strict config in `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`, NodeNext resolution.
- Because of NodeNext + `verbatimModuleSyntax`, **relative imports must use explicit `.js` extensions** (e.g. `from "./static-analog-clock.js"`) even though the source is `.ts`, and type-only imports must use `import type`.
- Tests are colocated as `*.test.ts` next to source; vitest runs in the `node` environment.

## Documentation is the source of truth

`docs/` is the authoritative spec and is written in **Hebrew**. `scripts/check-docs.mjs` (run via `npm.cmd run docs:check`) enforces a gate: all required docs must exist and be non-empty, and the "active task" (`T\d{3}`) must match across `PROJECT_STATUS.md`, `CURRENT_TASK.md`, and `TASKS.md`. Keep these in sync when changing project state.

Mandatory reading order for a new session (`docs/AGENT_GUIDE.md`): `README.md` → `PROJECT_STATUS.md` → `CURRENT_TASK.md` → `SESSION_HANDOFF.md` → the active task in `TASKS.md` → `ARCHITECTURE.md` → relevant `DECISIONS.md`.

**Session end**: update `PROJECT_STATUS.md`, `CURRENT_TASK.md`, `SESSION_HANDOFF.md`, `TASKS.md`, and (as needed) `TEST_STATUS.md` / `KNOWN_ISSUES.md` / `CHANGELOG.md`; run tests and build; only then commit.

---

## הוראות עבודה למודל

- **שפה:** ענה תמיד בעברית — כל ההסברים, הסיכומים, תוכניות העבודה והדוחות. שמות קבצים, מחלקות ופונקציות נשארים באנגלית כפי שהם בקוד.
- **גישה ארכיטקטונית:** אל תניח שהארכיטקטורה הנוכחית נכונה. מותר (ואף רצוי) להציע שינויים עמוקים אם הם מפשטים את המערכת, משפרים תחזוקה, מפחיתים מורכבות או משפרים את חוויית המשתמש. חשוב כמו Software Architect שמקבל מערכת קיימת ומחליט מה לשמר, מה לשכתב ומה לבנות מחדש.
- **שקיפות:** בכל החלטה ארכיטקטונית משמעותית הסבר למה בחרת בה, אילו חלופות שקלת ולמה דחית אותן. המטרה היא הבנה לעומק, לא "קופסה שחורה".

---

## מדיניות Git

המטרה: לנהל את העבודה השוטפת ב־Git בעצמאות מרבית, תוך שמירה על בטיחות המאגר ומניעת פעולות הרסניות. Claude מקבל אוטונומיה מלאה בתוך Branch ייעודי למשימה.

**מותר:** בדיקת status / diff / log / branches; יצירת Branch חדש למשימה; ביצוע Commit אחד או יותר; הרצת build / lint / tests; עדכון תיעוד; הכנת Pull Request ותיאורו; הצעת Merge בסיום משימה.

**אסור ללא אישור מפורש:** Commit / Push / Merge ישירות ל־`main`; Force Push; `git reset --hard`; `git rebase` על ענפים משותפים; מחיקת Branch; שינוי היסטוריה; שחזור Commit ישן; כל פעולה שעלולה לגרום לאובדן עבודה.

**לפני כל משימה:** בדוק status, את הענף הנוכחי ושינויים שלא נשמרו, וּודא שהמאגר תקין. אם אתה על `main` — צור Branch חדש בפורמט `feature/` · `fix/` · `refactor/` · `chore/` · `docs/` ואחריו שם המשימה (למשל `feature/document-upload`).

**Commit:** הודעות בעברית בפורמט `<סוג>: <תיאור קצר>` (`feat` / `fix` / `refactor` / `docs` / `test`). לפני Commit הצג כותרת, סיכום השינוי, רשימת קבצים ששונו והסבר קצר על המטרה.

**Pull Request:** כותרת ותיאור בעברית. מבנה: *מטרת השינוי* · *מה בוצע* · *בדיקות שבוצעו* · *השפעות אפשריות*.

**סיום משימה:** הצג סיכום עבודה — הענף, ה־Commits, הקבצים העיקריים ששונו, הבדיקות שהורצו (Build / Lint / Tests) והמצב (מוכן ל־PR / מוכן למיזוג).

**שפת העבודה:** Commit messages, כותרת ותיאור PR, סיכומי עבודה והסברים למשתמש — הכול בעברית.

> **הערת עקביות:** `docs/AGENT_GUIDE.md` קובע כלל ישן ומחמיר יותר ("אין push, אין merge, אין rebase, אין PR"). מדיניות ה-Git שכאן גוברת עליו לצורך העבודה. כדאי ליישר את `AGENT_GUIDE.md` בהמשך כדי למנוע בלבול.
