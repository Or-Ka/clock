# Roadmap

## שלב 1: Bootstrap

- תיעוד מקור אמת.
- Git repository.
- npm workspace.
- TypeScript strict.
- Test runner.
- Build בסיסי.

## שלב 2: SVG Spike

- Spike תחת `apps/demo/src/spikes/svg-clock/`.
- הוכחת responsive, interaction, keyboard focus, RTL ו-cleanup.
- תיעוד תוצאות.

סטטוס: הושלם.

## שלב 3: MVP Library

- חוזי core/time/events/rendering.
- resolver לאירועים מוחלטים.
- SVG renderer מוצרי.
- API `createAnalogClock`.

## Phase 3: Dual Ring Events

- שתי טבעות קבועות לכל 24 השעות.
- אירועים ידניים מיידיים מסוג זריחה, שקיעה ומותאם.
- API `events` ו-`setEvents()` ב-`LiveAnalogClock`.
- דמו Phase 3 נפרד עם טופס הוספה, מחיקה, timezone ורשימת אירועים.

## שלב 4: הרחבות

- anchors.
- derived events.
- ranges.
- providers לזריחה ושקיעה.
- React/Web Component wrappers.
