# Changelog

## 2026-07-02

- החל Phase 3 בענף `feat/phase-3-dual-ring-events`.
- סומנה כהוחלפה החלטת ה-MVP הישנה שהציגה רק את מחזור 12 השעות הנוכחי.
- נוסף ADR לתצוגת 24 שעות בשתי טבעות: `outer` עבור 06:00-17:59 ו-`inner` עבור 18:00-05:59.
- נוספו `ClockRing`, `ringForTime()`, `dualRingAngle()` ו-`resolveInstantEvents()`.
- נוסף מודל `InstantEventDefinition` ו-`ResolvedInstantEvent` לאירועים ידניים מסוג `sunrise`, `sunset` ו-`custom`.
- הורחב ה-SVG renderer להצגת שתי טבעות, 24 תוויות שעה וסמני אירועים.
- הורחב `LiveAnalogClock` עם `events` ו-`setEvents()`.
- נוסף דמו Phase 3 תחת `apps/demo/src/dual-ring-events/` עם הוספה, מחיקה, timezone ורשימת אירועים.
- `npm.cmd run dev` מפעיל כעת את דמו Phase 3.
- נוספו בדיקות Phase 3 והורץ Gate מלא.
- בוצע סבב תיקוני תצוגה ממוקד לדמו Phase 3: מספרי השעון המרכזי סודרו בכיוון אנלוגי רגיל, נוספו 60 שנתות חיצוניות, נוספו סימוני מעבר יום/לילה, והממשק תורגם לעברית.

## 2026-06-30

- נשמר מקור אמת ראשוני תחת `docs/`.
- אותחל Git repository.
- נבחר npm כ-package manager.
- נוצר workspace עם `apps/demo` ו-`packages/clock`.
- הוגדר TypeScript strict.
- הוגדר Vitest עם בדיקת עשן.
- הוגדר build בסיסי עם `tsc -b`.
- נוספה תלות `@js-temporal/polyfill` עבור טיפוסי Temporal.
- מומש SVG Spike תחת `apps/demo/src/spikes/svg-clock/`.
- נבדקו responsive, click, keyboard focus, focus ring, RTL ו-build של ה-Spike.
- החל Phase 1 בענף `feat/phase-1-static-clock`.
- נוסף API `createStaticAnalogClock` לשעון SVG סטטי מוצרי.
- נוספו פונקציות זווית טהורות ובדיקות עבור מיפוי זמן לזווית.
- נוסף demo מוצרי נפרד מה-Spike תחת `apps/demo/src/product-static-clock/`.
- בוצעה ביקורת Phase 1: API הזוויות נשאר פנימי, lifecycle חוזק, ונוספו בדיקות לקלט מיוחד ולמקרי cleanup.
- החל Phase 2 בענף `feat/phase-2-live-clock`.
- נוספו `SystemTimeSource`, `FixedTimeSource` ו-`SimulatedTimeSource`.
- נוסף `MinuteBoundaryClockScheduler` שמרענן מיד ומסתנכרן לגבול הדקה.
- נוספה projection טהורה מ-`Temporal.Instant` ו-IANA timezone אל `StaticClockTime`.
- נוסף API `createLiveAnalogClock` מעל `createStaticAnalogClock`.
- נוסף דמו שעון חי תחת `apps/demo/src/live-clock/` עם Start, Stop, Refresh, timezone, System, Fixed ו-Simulated.
- נוסף script `dev` בשורש וב-`@clock/demo`.
