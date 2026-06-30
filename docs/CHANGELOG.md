# Changelog

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
