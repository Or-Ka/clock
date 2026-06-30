# Embedding API

## API MVP מתוכנן

```ts
createAnalogClock({
  container,
  timeSource,
  timeZone,
  events,
  theme
});
```

## שדות

- `container`: HTMLElement שאליו השעון ירונדר.
- `timeSource`: מקור זמן שמחזיר `Temporal.Instant`.
- `timeZone`: מזהה IANA time zone.
- `events`: מערך `EventDefinition`.
- `theme`: הגדרות עיצוב אופציונליות.

## כיוונים עתידיים

- React wrapper.
- Web Component.
- Vanilla JavaScript API יציב.
- providers חיצוניים לאירועים.

