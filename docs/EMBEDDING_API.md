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

## Phase 2 API: Live Analog Clock

Phase 2 מוסיף API חי מינימלי:

```ts
interface TimeSource {
  now(): Temporal.Instant;
}

interface ClockScheduler {
  start(callback: () => void): void;
  stop(): void;
  destroy(): void;
}

interface LiveAnalogClockOptions {
  readonly container: HTMLElement;
  readonly timeSource: TimeSource;
  readonly timeZone: string;
  readonly scheduler?: ClockScheduler;
  readonly events?: InstantEventDefinition[];
  readonly eventLayers?: EventLayerDefinition[];
}

interface LiveAnalogClock {
  start(): void;
  stop(): void;
  refresh(): void;
  setTimeZone(timeZone: string): void;
  setEvents(events: InstantEventDefinition[]): void;
  setEventLayers(eventLayers: EventLayerDefinition[]): void;
  destroy(): void;
}

function createLiveAnalogClock(options: LiveAnalogClockOptions): LiveAnalogClock;
```

מימושים ציבוריים נוספים:

- `SystemTimeSource`
- `FixedTimeSource`
- `SimulatedTimeSource`
- `MinuteBoundaryClockScheduler`
- `projectInstantToStaticClockTime`

יצירת `LiveAnalogClock` מרנדרת מצב ראשוני, אך אינה מתחילה timer אוטומטי. יש לקרוא ל-`start()` במפורש. `refresh()` עובד גם כשהשעון עצור. `setTimeZone()` לאחר `destroy()` זורק שגיאה. `destroy()` בטוח לקריאה חוזרת ומנקה את ה-scheduler ואת השעון הסטטי.

## Phase 3 API: Dual Ring Events

Phase 3 מוסיף אירועים ידניים מיידיים:

```ts
type ClockRing = "outer" | "inner";
type InstantEventKind = "sunrise" | "sunset" | "custom";
type InstantEventStatus = "past" | "next" | "future";

interface InstantEventDefinition {
  readonly id: string;
  readonly type: "instant";
  readonly kind?: InstantEventKind;
  readonly title: string;
  readonly hour: number;
  readonly minute: number;
  readonly description?: string;
}

interface ResolvedInstantEvent {
  readonly id: string;
  readonly type: "instant";
  readonly kind: InstantEventKind;
  readonly title: string;
  readonly hour: number;
  readonly minute: number;
  readonly ring: ClockRing;
  readonly angle: number;
  readonly status: InstantEventStatus;
  readonly description?: string;
}
```

פונקציות עזר ציבוריות:

- `ringForTime(hour, minute)`
- `dualRingAngle(hour, minute)`
- `resolveInstantEvents(events, currentTime)`

`setEvents()` בודק קלט, דוחה IDs כפולים, אינו משנה את מערך הקלט, מחשב `ring` ו-`angle`, ומעדכן את שכבת האירועים בלי ליצור SVG חדש.

`eventLayers` ו-`setEventLayers()` הם API מתקדם יותר מעל `events`. הם מאפשרים להפריד אירועי זמני היום, אירועים אישיים, אירועי API וסוגים עתידיים לשכבות שאפשר להדליק ולכבות. `setEvents()` נשאר נתיב תאימות וממפה את הקלט לשכבת `personal` ברירת מחדל.

תשתית provider ראשונה:

```ts
interface EventProviderRequest {
  readonly date: string;
  readonly timeZone: string;
  readonly signal?: AbortSignal;
}

interface EventLayerProvider {
  loadLayer(request: EventProviderRequest): Promise<EventLayerDefinition>;
}
```

`ApiEventLayerProvider` מחזיר `EventLayerDefinition` מסוג `api` לפי `date` ו-`timeZone`. אין עדיין provider אמיתי לזמני זריחה/שקיעה או endpoint פרויקטלי; זה חסום עד להגדרת API, סכמה ונתוני מיקום.
