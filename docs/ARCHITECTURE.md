# Architecture

## מבנה Workspace

הפרויקט הוא workspace קטן, לא monorepo מרובה חבילות:

```text
apps/
  demo/
packages/
  clock/
```

## מבנה הספרייה

בתוך `packages/clock/src`:

```text
core/
time/
events/
rendering/
themes/
```

## גבולות אחריות

- `core`: טיפוסי הקשר, lifecycle ותיאום בין מודולים.
- `time`: מקורות זמן, scheduler וחישובי זמן.
- `events`: הגדרת אירועים ופתרון אירועים לפריטים להצגה.
- `rendering`: חוזי renderer ומימוש SVG עתידי.
- `themes`: tokens ואפשרויות עיצוב.

## החלטות מבניות

- הליבה אינה תלויה ב-React.
- renderer מקבל רק `ResolvedClockItem`.
- `TimeSource` מחזיר `Temporal.Instant`.
- `ClockScheduler` נפרד מ-`TimeSource`.
- `ClockContext` מחזיק `timeZone` ו-`locale`.

## Spike לפני מוצר

לפני מימוש קוד מוצר יבוצע SVG Spike תחת `apps/demo/src/spikes/svg-clock/`. ה-Spike אינו API ציבורי ואינו מועבר אוטומטית ל-`packages/clock`.

