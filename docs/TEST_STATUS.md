# Test Status

עודכן: 2026-07-02

## מצב נוכחי

קיים test runner בסיסי: Vitest. Phase 3 מוסיף בדיקות דטרמיניסטיות לטבעות, זוויות dual-ring, resolver אירועים, renderer ו-live clock עם `setEvents()`.

## ריצות אחרונות

```text
npm.cmd run docs:check
PASS: Documentation gate passed for 20 docs.

npm.cmd run typecheck
PASS: tsc -b tsconfig.json --pretty false

npm.cmd test
PASS: 8 test files, 78 tests

npm.cmd run build
PASS: tsc -b tsconfig.json, Vite build for SVG Spike, product static clock demo, live clock demo, and dual ring events demo

npm.cmd run build --workspace @clock/clock
PASS: tsc -p tsconfig.build.json
```

## בדיקות Phase 3

נוספו בדיקות:

- `packages/clock/src/events/event-model.test.ts`: בחירת טבעת, נוסחת זווית, שיוך זריחה/שקיעה לפי זמן בפועל, חישוב `past`/`next`/`future`, דחיית IDs כפולים וקלט זמן לא תקין.
- `packages/clock/src/rendering/static-analog-clock.test.ts`: שתי טבעות, 24 תוויות שעה, סמני אירועים, `setEvents()` ללא החלפת SVG ו-`setEvents()` לאחר destroy.
- `packages/clock/src/rendering/live-analog-clock.test.ts`: אירועים התחלתיים, `setEvents()`, דחיית קלט לא תקין בלי לשנות את התצוגה, חישוב סטטוסים מחדש בשינוי timezone ו-`setEvents()` לאחר destroy.

## בדיקת דפדפן ל-Phase 3

בוצעה מול `http://127.0.0.1:5173/`.

תוצאות:

- `npm.cmd run dev` הפעיל את דמו Phase 3.
- ב-1200px: SVG יחיד, גודל שעון 620px, 12 תוויות בטבעת החיצונית, 12 תוויות בטבעת הפנימית, 5 אירועים, ללא overflow.
- ב-760px: SVG יחיד, גודל שעון 620px, 12 תוויות בכל טבעת, 5 אירועים, ללא overflow.
- ב-390px: SVG יחיד, גודל שעון 310px, 12 תוויות בכל טבעת, 5 אירועים, ללא overflow.
- אירועים הופיעו בשתי הטבעות: 2 אירועים ב-`outer` ו-3 אירועים ב-`inner`.
- סומן אירוע `next` אחד.
- הוספת אירוע `00:15` שייכה אותו ל-`inner`.
- הוספה ומחיקה שמרו על SVG יחיד.
- console errors/warnings מהאפליקציה: אין.

## בדיקות Phase 2

נוספו בדיקות:

- `packages/clock/src/time/time-source.test.ts`: `SystemTimeSource`, `FixedTimeSource`, `SimulatedTimeSource`, pause/resume ושינוי מהירות.
- `packages/clock/src/time/clock-scheduler.test.ts`: start מיידי, חישוב גבול דקה, start כפול, stop כפול, start לאחר stop, destroy כפול וניקוי timers.
- `packages/clock/src/time/timezone-projection.test.ts`: timezone תקין ולא תקין, כולל מעבר לחצות וליום אחר.
- `packages/clock/src/rendering/live-analog-clock.test.ts`: יצירה ללא start אוטומטי, start/stop/refresh, שינוי timezone, setTimeZone אחרי destroy, destroy כפול, ושמירה על SVG יחיד.

## בדיקת דפדפן ל-Phase 2

בוצעה מול `http://127.0.0.1:5174/`.

תוצאות:

- `npm.cmd run dev` הפעיל את דמו השעון החי. פורט 5173 היה תפוס ולכן Vite עבר ל-5174.
- ב-1200px: SVG יחיד, גודל שעון 520px, ללא overflow.
- ב-760px: SVG יחיד, גודל שעון 520px, ללא overflow.
- ב-390px: SVG יחיד, גודל שעון 300px, ללא overflow.
- Stop ולאחר מכן Refresh עבדו כשהשעון עצור.
- Fixed Time הציג `12:30` ב-`Asia/Jerusalem` עבור fixed UTC של `09:30`.
- שינוי timezone ל-`UTC` עדכן את השעון ל-`09:30`.
- Simulated Time עם מהירות `120x` התקדם אוטומטית מ-`18:39` ל-`18:43` בתוך 1.6 שניות ונשאר עם SVG יחיד.
- console errors/warnings מהאפליקציה: אין.

## בדיקות Phase 1

נוספו בדיקות:

- `packages/clock/src/time/clock-angles.test.ts`: מיפוי זמנים לזוויות עבור `00:00`, `03:00`, `06:30`, `11:59`, `12:00`, `15:45` וקלט לא תקין.
- `packages/clock/src/time/clock-angles.test.ts`: כולל שעה שלילית, שעה מעל 23, דקה שלילית, דקה מעל 59, ערכים עשרוניים, `NaN`, `Infinity` ו-`-Infinity`.
- `packages/clock/src/rendering/static-analog-clock.test.ts`: יצירת SVG, 12 סימוני שעות, `setTime`, קלט לא תקין, `ResizeObserver`, `destroy`, `destroy` כפול, SVG שנותק, יותר ממופע אחד באותו document, דחיית מופע שני באותו container ושחזור תוכן container כאשר יצירה נכשלת.

## בדיקת דפדפן ל-Phase 1

בוצעה מול `http://127.0.0.1:5174/`.

תוצאות:

- שלושה SVGים נטענו.
- לכל SVG קיימים 12 סימוני שעות.
- `15:45`: `hourAngle=112.5`, `minuteAngle=270`.
- `00:00`: `hourAngle=0`, `minuteAngle=0`.
- `06:30`: `hourAngle=195`, `minuteAngle=180`.
- `setTime` דרך כפתורי הדמו עדכן את כל השעונים וספירת ה-SVGים נשארה 3.
- responsive נבדק ב-1200px, 760px ו-390px.
- console errors/warnings מהאפליקציה: אין.

## בדיקת דפדפן ל-SVG Spike

בוצעה מול `http://127.0.0.1:5173/`.

תוצאות:

- שלושה SVGים נטענו.
- שלושה markers נמצאו.
- click על marker עדכן status ל-`פגישה: 11:20`.
- Enter על marker בפוקוס הפעיל את marker.
- focus ring גלוי נמדד בצבע `rgb(123, 44, 191)`.
- RTL פעיל דרך `document.documentElement.dir === "rtl"`.
- responsive נבדק ב-1200px, 760px ו-390px.
- console errors/warnings מהאפליקציה: אין.

## מגבלות

- עדיין אין browser tests אוטומטיים כחלק מ-CI; בדיקות הדפדפן בוצעו דרך כלי הדפדפן בסשן.
