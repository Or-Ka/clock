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
- Phase 1 משתמש ב-`StaticClockTime` עם `hour` בטווח `0..23` ו-`minute` בטווח `0..59`.
- קלט זמן סטטי לא תקין זורק `RangeError`; אין normalization אוטומטי ב-Phase 1.
- Phase 1 אינו מוסיף TimeSource, scheduler, timers, events, providers, React adapter או Web Component.
- פונקציות חישוב זווית (`hourAngle`, `minuteAngle`, `clockHandAngles`) נשארות API פנימי ואינן מיוצאות לצרכנים חיצוניים ב-Phase 1.
- Phase 1 מאפשר מופע פעיל אחד בלבד לכל container; יצירת מופע נוסף לפני `destroy()` זורקת שגיאה.
- Phase 2 מוסיף שעון חי מעל `createStaticAnalogClock` הקיים ואינו משכפל את renderer ה-SVG.
- Phase 2 מפריד בין `TimeSource`, `ClockScheduler` ו-projection לפי timezone.
- `MinuteBoundaryClockScheduler` הוא scheduler ברירת המחדל של השעון החי והוא מסתנכרן לגבול הדקה הבאה.
- Phase 2 אינו מוסיף אירועים, markers, ranges, anchors, derived events, providers, זריחה/שקיעה, location, API חיצוני, React adapter, Web Component, מחוג שניות, Desktop או EXE.

## החלטות Git

- אין push.
- אין merge.
- אין rebase.
- אין Pull Request.
- הודעות commit מפורטות בעברית.
- commit רק לאחר בדיקות ועדכון תיעוד.
