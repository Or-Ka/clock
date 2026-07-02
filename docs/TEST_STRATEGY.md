# Test Strategy

## מטרות

- לוודא שהליבה נשארת עצמאית מ-frameworks.
- לבדוק חישובי זמן ואירועים באופן דטרמיניסטי.
- לבדוק renderer דרך בדיקות אינטראקציה ו-DOM כאשר יתווסף.

## כלים

- TypeScript strict עבור בדיקות טיפוסים.
- Vitest עבור unit tests ובדיקות עשן.
- בדיקות ידניות או browser automation עבור SVG Spike כאשר יתווסף UI.

## שלבי בדיקה

- `npm.cmd run docs:check`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd run build --workspace @clock/clock`

## MVP

בדיקות MVP יתמקדו ב:

- `ClockContext`.
- `TimeSource`.
- resolver לאירועים מוחלטים.
- סינון אירועים למחזור 12 השעות הנוכחי.
- renderer שמקבל רק פריטים פתורים.

## Phase 2

בדיקות Phase 2 מתמקדות ב:

- מקורות זמן דטרמיניסטיים עם clocks מוזרקים.
- scheduler עם timers מוזרקים.
- timezone projection תקין ולא תקין.
- lifecycle של live clock, כולל `start`, `stop`, `refresh`, `setTimeZone` ו-`destroy`.
- שמירה על SVG יחיד ללא יצירה מחדש בכל tick.
