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

## Phase 1 API: Static Analog Clock

Phase 1 מוסיף API מצומצם לשעון סטטי:

```ts
interface StaticClockTime {
  readonly hour: number;
  readonly minute: number;
}

interface StaticAnalogClockOptions {
  readonly container: HTMLElement;
  readonly time: StaticClockTime;
}

interface StaticAnalogClock {
  setTime(time: StaticClockTime): void;
  destroy(): void;
}

function createStaticAnalogClock(options: StaticAnalogClockOptions): StaticAnalogClock;
```

השעון אינו קורא את שעת המערכת ואינו מתקדם בעצמו. `setTime()` מעדכן את המחוגים של אותו SVG קיים. `destroy()` מנתק observer ומסיר את ה-SVG של המופע.

חוזה lifecycle:

- יצירת שעון מחליפה את תוכן ה-container ב-SVG של השעון.
- מותר מופע פעיל אחד בלבד לכל container; ניסיון ליצור מופע נוסף לפני `destroy()` זורק שגיאה.
- `destroy()` בטוח לקריאה חוזרת.
- `setTime()` לאחר `destroy()` זורק שגיאה.
- `setTime()` לאחר שה-SVG נותק חיצונית מה-container זורק שגיאה.

פונקציות חישוב הזווית של Phase 1 הן API פנימי של החבילה ואינן מיוצאות דרך `packages/clock/src/index.ts`.
