# Event Model

## הפרדה מרכזית

יש הפרדה בין:

- `EventDefinition`: הקלט שהמשתמש או provider מגדירים.
- `ResolvedClockItem`: פריט פתור להצגה על החוגה.

ה-renderer מקבל רק אירועים פתורים.

## MVP

ה-MVP כולל רק אירועים מוחלטים ידניים:

```ts
type EventDefinition = {
  id: string;
  kind: "absolute";
  instant: Temporal.Instant;
  title: string;
};
```

## מתוכנן אך לא ממומש ב-MVP

- `anchor`: אירוע שמבוסס על עוגן כמו זריחה.
- `derived`: אירוע שנגזר מאירוע אחר או מעוגן.
- `range`: טווח זמן על החוגה.

## כלל תצוגה ב-MVP

אם אירוע אינו נמצא במחזור 12 השעות הנוכחי, הוא לא מוצג על החוגה.

