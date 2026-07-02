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
- `time`: מקורות זמן, scheduler, projection לפי timezone וחישובי זמן.
- `events`: הגדרת אירועים ופתרון אירועים לפריטים להצגה.
- `rendering`: חוזי renderer ומימוש SVG עתידי.
- `themes`: tokens ואפשרויות עיצוב.

## החלטות מבניות

- הליבה אינה תלויה ב-React.
- renderer מקבל רק `ResolvedClockItem`.
- `TimeSource` מחזיר `Temporal.Instant`.
- `ClockScheduler` נפרד מ-`TimeSource`.
- `ClockContext` מחזיק `timeZone` ו-`locale`.

## Phase 2: שעון חי

Phase 2 מוסיף שכבה חיה מעל השעון הסטטי בלי לשכפל את ציור ה-SVG:

- `TimeSource` מחזיר `Temporal.Instant` בלבד.
- `SystemTimeSource`, `FixedTimeSource` ו-`SimulatedTimeSource` נמצאים תחת `time`.
- `ClockScheduler` אחראי רק לתזמון רענון.
- `MinuteBoundaryClockScheduler` מרענן מיד בעת `start()` ומסתנכרן לגבול הדקה הבאה.
- `projectInstantToStaticClockTime` ממירה `Temporal.Instant` ו-IANA timezone אל `StaticClockTime`.
- `createLiveAnalogClock` משתמש ב-`createStaticAnalogClock` ומעדכן את אותו SVG קיים.

## Phase 3: שתי טבעות אירועים

Phase 3 מוסיף שכבת אירועים ידנית מעל השעון החי:

- השעון נשאר שעון אנלוגי רגיל עם מחוג שעות ומחוג דקות במרכז.
- סביב המחוגים מוצגות שתי טבעות קבועות של אירועים ושעות.
- הטבעת החיצונית (`outer`) מייצגת את 06:00 עד לפני 18:00.
- הטבעת הפנימית (`inner`) מייצגת את 18:00 עד לפני 06:00.
- כל 24 השעות מוצגות תמיד, ללא הסתרת אירועים מחוץ למחצית היום הנוכחית.
- `events` מכיל אירועים ידניים בזמן מקומי בלבד מסוג `sunrise`, `sunset` או `custom`.
- resolver תחת `events` מחשב `ring`, `angle` ו-`status` לפני שה-renderer מקבל את האירועים.
- renderer אינו משייך אירועים לטבעת בעצמו.
- `LiveAnalogClock` מוסיף `setEvents()` ומחשב מחדש אירועים בעת refresh, שינוי timezone או שינוי רשימת אירועים.

## Spike לפני מוצר

לפני מימוש קוד מוצר יבוצע SVG Spike תחת `apps/demo/src/spikes/svg-clock/`. ה-Spike אינו API ציבורי ואינו מועבר אוטומטית ל-`packages/clock`.
