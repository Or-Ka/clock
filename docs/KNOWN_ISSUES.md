# Known Issues

עודכן: 2026-07-02

## בעיות ידועות פתוחות

אין בעיות ידועות פתוחות בסגירת T001-T025.

אין בעיות ידועות פתוחות בסגירת Phase 1.

אין בעיות ידועות פתוחות לאחר ביקורת Phase 1.

אין בעיות ידועות פתוחות לאחר מימוש Phase 2.

אין בעיות ידועות פתוחות לאחר מימוש Phase 3.

## מגבלות ועבודת המשך שאינן בעיות פתוחות

- אין עדיין browser tests אוטומטיים ל-SVG; בוצעה בדיקת דפדפן ידנית/כלית ל-Spike.
- יש לבדוק בהמשך bundle size ותאימות של `@js-temporal/polyfill`.
- Phase 3 אינו כולל provider אמיתי לזריחה/שקיעה, location, latitude/longitude, derived events, offsets, ranges, קשתות זמן, tooltips מורכבים, React adapter, Web Component, Desktop או EXE.

## נפתרו

- בתחילת הסשן לא היה Git repository; נפתר באמצעות `git init`.
