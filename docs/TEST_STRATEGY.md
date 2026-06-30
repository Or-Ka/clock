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

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run docs:check`

## MVP

בדיקות MVP יתמקדו ב:

- `ClockContext`.
- `TimeSource`.
- resolver לאירועים מוחלטים.
- סינון אירועים למחזור 12 השעות הנוכחי.
- renderer שמקבל רק פריטים פתורים.

