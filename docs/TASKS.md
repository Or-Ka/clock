# Tasks

עודכן: 2026-06-30

## סטטוסים

- `[ ]` לא התחיל
- `[~]` בתהליך
- `[x]` הושלם
- `[!]` חסום

## משימה פעילה

אין משימה פעילה.

## משימות מאושרות עד SVG Spike

- `[x]` T001: לאתחל Git repository ולתעד מצב Git.
- `[x]` T002: לבחור package manager ולהגדיר workspace.
- `[x]` T003: ליצור שלד תיקיות.
- `[x]` T004: להגדיר TypeScript strict.
- `[x]` T005: להגדיר test runner ובדיקת עשן.
- `[x]` T006: להגדיר build בסיסי.
- `[x]` T007: ליצור `docs/README.md`.
- `[x]` T008: ליצור `PROJECT_STATUS.md`.
- `[x]` T009: ליצור `CURRENT_TASK.md`.
- `[x]` T010: ליצור `SESSION_HANDOFF.md`.
- `[x]` T011: ליצור `TEST_STATUS.md`.
- `[x]` T012: ליצור `KNOWN_ISSUES.md`.
- `[x]` T013: ליצור `CHANGELOG.md`.
- `[x]` T014: ליצור את שאר מסמכי התכנון עם תוכן ראשוני ממשי.
- `[x]` T015: לכתוב פרוטוקול פתיחת סשן.
- `[x]` T016: לכתוב פרוטוקול סיום סשן.
- `[x]` T017: למלא `DECISIONS.md`.
- `[x]` T018: למלא `ARCHITECTURE.md`, `TIME_MODEL.md`, `EVENT_MODEL.md`.
- `[x]` T019: למלא `ROADMAP.md`, `TASKS.md`, `TEST_STRATEGY.md`, `EMBEDDING_API.md`.
- `[x]` T020: לעדכן את כל מסמכי המצב למצב אמת.
- `[x]` T021: לבצע Gate תיעוד.
- `[x]` T022: ליצור `apps/demo/src/spikes/svg-clock/`.
- `[x]` T023: לממש SVG Spike בלבד.
- `[x]` T024: להריץ בדיקות ו-build.
- `[x]` T025: לתעד את תוצאות ה-Spike.

## החלטות ארכיטקטוניות מאושרות

- workspace קטן, לא monorepo מרובה חבילות.
- מבנה ראשוני:
  - `apps/demo`
  - `packages/clock`
- בתוך `packages/clock/src`:
  - `core`
  - `time`
  - `events`
  - `rendering`
  - `themes`
- renderer ראשי: SVG.
- SVG Spike יתבצע לפני מימוש קוד מוצר.
- הליבה אינה תלויה ב-React.
- `TimeSource` מחזיר `Temporal.Instant`.
- `ClockScheduler` נפרד מ-`TimeSource`.
- `timeZone` ו-`locale` שייכים ל-`ClockContext`.
- Temporal עם polyfill הוא הכיוון המועדף, בכפוף לבדיקת bundle size ותאימות.
- יש הפרדה בין `EventDefinition` לבין `ResolvedClockItem`.
- ה-renderer מקבל רק אירועים פתורים.
- MVP כולל רק אירועים מוחלטים ידניים.
- `anchor`, `derived` ו-`range` מתוכננים אך לא ממומשים ב-MVP.
- תצוגת MVP היא מחזור 12 השעות הנוכחי:
  - `00:00` עד לפני `12:00`
  - `12:00` עד לפני חצות
- אירועים מחוץ לחצי היממה הנוכחי אינם מוצגים על החוגה ב-MVP.
- API ה-MVP המתוכנן:

```ts
createAnalogClock({
  container,
  timeSource,
  timeZone,
  events,
  theme
});
```

## Gate התיעוד

אין להתחיל את ה-SVG Spike לפני ש:

- כל מסמכי מקור האמת קיימים.
- אין מסמכים ריקים.
- המשימה הפעילה זהה ב-`TASKS.md`, `CURRENT_TASK.md` ו-`PROJECT_STATUS.md`.
- קיימים פרוטוקולי פתיחת וסיום סשן.
- מצב Git מתועד.
- מצב הבדיקות מתועד.
- סשן חדש יכול להבין את מצב הפרויקט ללא השיחה הזו.

## Gate ה-SVG Spike

ה-Spike צריך להוכיח:

- SVG responsive בשלושה גדלים.
- מחוג שעות ודקות לפי זמן קבוע.
- marker אחד לפחות.
- hover.
- click.
- keyboard focus.
- focus ring גלוי.
- RTL תקין.
- resize תקין.
- cleanup של listeners ו-observers.
- הקוד נשאר רק תחת `apps/demo/src/spikes/svg-clock/`.

ה-Spike אינו API ציבורי ואינו מועבר אוטומטית ל-`packages/clock`.
