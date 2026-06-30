# Product Spec

## חזון

ספריית TypeScript פתוחה ומודולרית להצגת שעון אנלוגי עם שכבת אירועים מבוססת זמן.

## משתמשים מיועדים

- מפתחי אתרים שרוצים להטמיע שעון אינטראקטיבי.
- מפתחי Web Apps שצריכים להציג אירועים על חוגה.
- צרכני React, Web Component או Vanilla JavaScript בעתיד.

## MVP

ה-MVP יתמקד ב:

- שעון אנלוגי SVG.
- מחזור 12 השעות הנוכחי בלבד.
- אירועים מוחלטים ידניים בלבד.
- API ראשוני:

```ts
createAnalogClock({
  container,
  timeSource,
  timeZone,
  events,
  theme
});
```

## מחוץ ל-MVP

- אירועי `anchor`.
- אירועים נגזרים.
- טווחי זמן.
- providers חיצוניים כגון זריחה ושקיעה.
- React wrapper.
- Web Component.

