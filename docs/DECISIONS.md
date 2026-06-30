# Decisions

## החלטות מאושרות

- workspace קטן, לא monorepo מרובה חבילות.
- package manager: npm.
- מבנה ראשוני: `apps/demo` ו-`packages/clock`.
- בתוך `packages/clock/src`: `core`, `time`, `events`, `rendering`, `themes`.
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
- תצוגת MVP היא מחזור 12 השעות הנוכחי.
- אירועים מחוץ לחצי היממה הנוכחי אינם מוצגים על החוגה ב-MVP.
- Phase 1 לא מתחיל לפני ביקורת ואישור מפורש לאחר SVG Spike.

## החלטות Git

- אין push.
- אין merge.
- אין rebase.
- אין Pull Request.
- הודעות commit מפורטות בעברית.
- commit רק לאחר בדיקות ועדכון תיעוד.
