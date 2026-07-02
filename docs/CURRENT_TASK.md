# Current Task

עודכן: 2026-07-02

## משימה פעילה

T067: סבב המשך נקודתי ל-Phase 3: שכבות תצוגה לאירועים ותצוגת תאריך במרכז השעון.

## למה זו המשימה הפעילה

Phase 3 הושלם בענף `feat/phase-3-dual-ring-events`. סבב תיקוני התצוגה הממוקד לדמו Phase 3 הושלם גם הוא ומוכן לביקורת. הסבב הנוכחי מוסיף תשתית שכבות תצוגה (`day-times`, `personal`, ובהמשך `api`) ותצוגת תאריך עברי/לועזי במרכז השעון.

`main` המקומי עדיין אינו כולל את commits של Phase 2, ולכן Phase 3 נפתח מענף `feat/phase-2-live-clock` כדי לא לאבד את בסיס השעון החי וללא merge ל-`main`.

```text
fatal: not a git repository (or any of the parent directories): .git
```

לאחר מכן בוצע `git init`, ו-`git status --short --branch` החזיר:

```text
## No commits yet on master
?? docs/
```

הקבצים הקיימים שנבדקו לפני תחילת Phase 1 הם טיפוסים וממשקים בלבד:

- `packages/clock/src/core/clock-context.ts`: ממשק `ClockContext` בלבד.
- `packages/clock/src/events/event-model.ts`: טיפוסי אירועים ופריטים פתורים בלבד; אין resolver או renderer.
- `packages/clock/src/time/time-source.ts`: ממשק `TimeSource` בלבד.

## פעולות המשך מוצעות

1. לבצע ביקורת ל-Phase 3 כולל סבב תיקוני התצוגה.
2. להחליט האם למזג את הענף ל-`main`.
3. לא להתחיל Phase 4 לפני אישור מפורש.

## כלל חשוב

ב-Phase 3 אין להוסיף API אמיתי של זריחה/שקיעה, location, latitude/longitude, derived events, offsets, ranges, קשתות זמן, tooltips מורכבים, React adapter, Web Component, Desktop או EXE. קיימת כעת תשתית provider כללית שמחזירה שכבת אירועים לפי תאריך ואזור זמן, אך חיבור API אמיתי חסום עד שיוגדרו endpoint, סכמה ונתוני מיקום.
