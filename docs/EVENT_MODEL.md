# Event Model

## הפרדה מרכזית

יש הפרדה בין:

- `EventDefinition`: הקלט שהמשתמש או provider מגדירים.
- `ResolvedClockItem`: פריט פתור להצגה על החוגה.

ה-renderer מקבל רק אירועים פתורים.

## MVP המקורי

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

Superseded: אם אירוע אינו נמצא במחזור 12 השעות הנוכחי, הוא לא מוצג על החוגה.

## Phase 3: אירועים ידניים מיידיים

Phase 3 מממש רק אירועים ידניים בזמן מקומי:

```ts
interface InstantEventDefinition {
  id: string;
  type: "instant";
  kind?: "sunrise" | "sunset" | "custom";
  title: string;
  hour: number;
  minute: number;
  description?: string;
}
```

המודל הפתור:

```ts
interface ResolvedInstantEvent {
  id: string;
  type: "instant";
  kind: "sunrise" | "sunset" | "custom";
  title: string;
  hour: number;
  minute: number;
  ring: "outer" | "inner";
  angle: number;
  status: "past" | "next" | "future";
  description?: string;
}
```

כללים:

- 06:00 עד לפני 18:00 משויך ל-`outer`.
- 18:00 עד לפני 06:00 משויך ל-`inner`.
- זווית האירוע מחושבת לפי מחזור 12 שעות שמתחיל ב-06:00.
- אירועי `sunrise` ו-`sunset` משויכים לטבעת לפי הזמן שלהם בלבד.
- `next` מחושב מכל אירועי היום שנותרו אחרי הזמן המקומי הנוכחי. אם אין אירוע מאוחר יותר היום, אין מעבר אוטומטי לאירוע של מחר ב-Phase 3.
- `past`, `next` ו-`future` מחושבים מחדש בעת refresh או שינוי timezone.
- IDs כפולים, שעה לא תקינה או דקה לא תקינה נדחים.
- resolver אינו משנה את מערך הקלט.
