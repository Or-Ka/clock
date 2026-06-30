# Time Model

## עקרונות

- זמן מוחלט מיוצג באמצעות `Temporal.Instant`.
- `timeZone` ו-`locale` אינם חלק מ-`TimeSource`; הם שייכים ל-`ClockContext`.
- `ClockScheduler` יהיה רכיב נפרד שאחראי לתזמון tick/update.
- Temporal עם polyfill הוא הכיוון המועדף, בכפוף לבדיקת bundle size ותאימות.

## מחזור MVP

תצוגת MVP היא מחזור 12 השעות הנוכחי:

- `00:00` עד לפני `12:00`.
- `12:00` עד לפני חצות.

אירועים מחוץ לחצי היממה הנוכחי אינם מוצגים על החוגה ב-MVP.

## שאלות עתידיות

- איך מייצגים מעבר שעון קיץ באזורי זמן שונים.
- האם renderer צריך לקבל זמנים מקומיים מחושבים מראש או רק זוויות.
- איך לחשב anchors כמו זריחה ושקיעה בלי להכניס provider לליבה.

## Phase 1: זמן סטטי

Phase 1 מוסיף מודל זמן סטטי שאינו קורא את שעת המערכת:

```ts
interface StaticClockTime {
  readonly hour: number;
  readonly minute: number;
}
```

הקלט התקין הוא:

- `hour`: מספר שלם בין `0` ל-`23`.
- `minute`: מספר שלם בין `0` ל-`59`.

קלט לא תקין זורק `RangeError`. אין normalization אוטומטי ב-Phase 1, כדי שבאגים בקלט יתגלו מוקדם.

נוסחאות:

```text
minuteAngle = minute × 6
hourAngle = (hour % 12) × 30 + minute × 0.5
```
