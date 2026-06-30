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
