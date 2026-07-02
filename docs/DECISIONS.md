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
- Superseded: תצוגת MVP היא מחזור 12 השעות הנוכחי.
- Superseded: אירועים מחוץ לחצי היממה הנוכחי אינם מוצגים על החוגה ב-MVP.
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
- Phase 3 מציג תמיד את כל 24 השעות בשתי טבעות קבועות: טבעת חיצונית עבור 06:00 עד לפני 18:00, וטבעת פנימית עבור 18:00 עד לפני 06:00.
- אין להשתמש בשמות AM/PM לטבעות Phase 3, כי נקודת המעבר היא 06:00/18:00 ולא 12:00.
- אירועי Phase 3 משויכים לטבעת לפי הזמן המקומי שלהם בלבד; זריחה ושקיעה ידניות אינן מקובעות לטבעת מסוימת.
- renderer מקבל רק אירועים פתורים עם `ring`, `angle` ו-`status`; הוא אינו מחליט לאיזו טבעת אירוע שייך.
- Phase 3 תומך בשכבות תצוגה לאירועים. שכבה קובעת מקור/קבוצה (`day-times`, `personal`, `api`, `custom`) ויכולה להיות כבויה בלי לשנות את חישוב הטבעת של האירוע.
- API/provider אמיתי לזמני היום עדיין אינו ממומש. קיימת תשתית `EventLayerProvider` ו-`ApiEventLayerProvider`, אך endpoint, סכמה ונתוני מיקום הם תנאי המשך.

## החלטות Git

- אין push.
- אין merge.
- אין rebase.
- אין Pull Request.
- הודעות commit מפורטות בעברית.
- commit רק לאחר בדיקות ועדכון תיעוד.

## ADR: Phase 3 Dual Ring Events

סטטוס: מאושר.

החלטה: Phase 3 מחליף את תצוגת מחזור 12 השעות הנוכחי בתצוגה קבועה של כל 24 השעות. הטבעת החיצונית (`outer`) מייצגת את 06:00 עד לפני 18:00, והטבעת הפנימית (`inner`) מייצגת את 18:00 עד לפני 06:00.

מודל הזווית לשתי הטבעות זהה ומוזז כך שהמחזור מתחיל ב-06:00:

```ts
const minutesSinceMidnight = hour * 60 + minute;
const shiftedMinutes = (minutesSinceMidnight - 6 * 60 + 24 * 60) % (12 * 60);
const angle = (shiftedMinutes / (12 * 60)) * 360;
```

דוגמאות מחייבות:

- 06:00 ו-18:00 נמצאות ב-0 מעלות.
- 09:00 ו-21:00 נמצאות ב-90 מעלות.
- 12:00 ו-00:00 נמצאות ב-180 מעלות.
- 15:00 ו-03:00 נמצאות ב-270 מעלות.

השלכה:

- כל 24 השעות מוצגות בו-זמנית.
- אירועים מחוץ למחצית היום הנוכחית אינם מוסתרים.
- `setEvents()` יעדכן את שכבת האירועים בלי ליצור מחדש את רכיב ה-SVG כולו.

## ADR: Event Display Layers

סטטוס: מאושר ל-Phase 3 כהכנה להמשך.

החלטה: אירועים מוצגים דרך `EventLayerDefinition[]`. כל שכבה כוללת `id`, `title`, `kind`, מצב `enabled` ומערך אירועים. resolver השכבות פותר רק שכבות פעילות ומוסיף לכל אירוע פתור metadata של שכבה.

השלכה:

- הדמו יכול להדליק ולכבות “זמני היום” ו“אירועים אישיים” בלי למחוק אירועים.
- `setEvents()` נשאר API תאימות, אך ממופה פנימית לשכבת `personal`.
- אירועים עתידיים שמגיעים מ-API, מטווחים או משנים מסוימות צריכים להיכנס דרך שכבה ייעודית לפני שלב ה-rendering.
- renderer עדיין מקבל אירועים פתורים בלבד; הוא אינו קורא API ואינו מחליט אם שכבה פעילה.
