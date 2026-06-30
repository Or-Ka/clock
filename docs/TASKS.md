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

## Phase 1: שעון SVG סטטי מוצרי

- `[x]` T026: להגדיר מודל זמן סטטי מינימלי עבור שעה ודקה.
- `[x]` T027: לממש פונקציות זווית טהורות עבור שעה ודקה.
- `[x]` T028: להוסיף בדיקות למיפוי זמן לזווית.
- `[x]` T029: להגדיר מבנה SVG מוצרי בסיסי.
- `[x]` T030: לממש סימוני שעות.
- `[x]` T031: לממש מחוג שעות.
- `[x]` T032: לממש מחוג דקות.
- `[x]` T033: לממש `setTime`.
- `[x]` T034: לממש resize responsive.
- `[x]` T035: לממש `destroy`.
- `[x]` T036: ליצור demo מוצרי נפרד מה-Spike.
- `[x]` T037: להוסיף בדיקות DOM או component.
- `[x]` T038: לעדכן את התיעוד עבור API ותוצאות Phase 1.
- `[x]` T039: לבצע Gate של Phase 1.

## Gate של Phase 1

Phase 1 ייחשב הושלם רק אם:

- השעון נמצא תחת `packages/clock`, ולא תחת תיקיית ה-Spike.
- ניתן להעביר שעה ודקה מפורשות.
- מחוג השעות כולל את השפעת הדקות.
- מחוגי השעות והדקות נכונים בזמני הבדיקה שהוגדרו.
- השעון responsive בשלושה גדלים לפחות.
- `setTime()` מעדכן את המחוגים ללא יצירת רכיב חדש.
- `destroy()` מנקה כל observer או listener.
- אין timer ואין שימוש בשעת המערכת.
- אין events, providers או scheduler.
- קיימות בדיקות אמיתיות מעבר לבדיקת העשן.
- `npm.cmd run docs:check` עובר.
- `npm.cmd run typecheck` עובר.
- `npm.cmd test` עובר.
- `npm.cmd run build` עובר.
- הדמו נבדק בדפדפן.
- התיעוד תואם למצב הקוד.
- working tree נקי לאחר commit.

## Phase 2: שעון חי ומקורות זמן

- `[x]` T040: לעדכן תיעוד פתיחה ותכנון משימות עבור Phase 2.
- `[x]` T041: לממש `TimeSource` עבור זמן מערכת, זמן קבוע וזמן מדומה.
- `[x]` T042: לממש `ClockScheduler` שמרענן מיד, מסתנכרן לגבול הדקה ומנקה timers.
- `[x]` T043: לממש projection טהור מ-`Temporal.Instant` ו-IANA timezone אל `StaticClockTime`.
- `[x]` T044: לממש `createLiveAnalogClock` מעל `createStaticAnalogClock` ללא שכפול SVG.
- `[x]` T045: להוסיף בדיקות יחידה ודום עבור מקורות זמן, scheduler, timezone ו-lifecycle.
- `[x]` T046: ליצור דמו שעון חי עם Start, Stop, Refresh, timezone ומצבי זמן.
- `[x]` T047: להוסיף scripts של `dev` בשורש ובדמו ולתעד הפעלה.
- `[x]` T048: להריץ בדיקות, typecheck, build ובדיקת דפדפן בגדלים הנדרשים.
- `[x]` T049: לעדכן תיעוד סיום Phase 2, Gate ותוצאות בדיקות.

## Gate של Phase 2

Phase 2 ייחשב הושלם רק אם:

- Phase 1 ממשיך לעבוד ללא breaking changes.
- השעון מציג זמן מערכת ומתעדכן.
- Fixed Time עובד.
- Simulated Time עובד, כולל pause/resume ושינוי מהירות.
- Start, Stop ו-Refresh עובדים.
- שינוי timezone עובד ומשתמש ב-IANA timezone, לא ב-offset קבוע.
- אין timer כפול.
- אין timer פעיל אחרי `destroy()`.
- אין יצירת SVG חדש בכל עדכון.
- `npm.cmd run dev` מפעיל את הדמו.
- הדמו עובד בגדלי חלון 1200, 760 ו-390.
- אין שגיאות או warnings בקונסול.
- `npm.cmd run docs:check` עובר.
- `npm.cmd run typecheck` עובר.
- `npm.cmd test` עובר.
- `npm.cmd run build` עובר.
- `npm.cmd run build --workspace @clock/clock` עובר.
- התיעוד מעודכן.
- working tree נקי לאחר commits.

סטטוס: הושלם בענף `feat/phase-2-live-clock`.
