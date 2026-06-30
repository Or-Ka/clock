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
