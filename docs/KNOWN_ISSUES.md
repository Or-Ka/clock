# Known Issues

עודכן: 2026-06-30

## בעיות ידועות פתוחות

אין בעיות ידועות פתוחות בסגירת T001-T025.

אין בעיות ידועות פתוחות בסגירת Phase 1.

אין בעיות ידועות פתוחות לאחר ביקורת Phase 1.

## מגבלות ועבודת המשך שאינן בעיות פתוחות

- אין עדיין resolver אירועים מוצרי; זה מחוץ להיקף Phase 1.
- אין עדיין browser tests אוטומטיים ל-SVG; בוצעה בדיקת דפדפן ידנית/כלית ל-Spike.
- יש לבדוק בהמשך bundle size ותאימות של `@js-temporal/polyfill`.
- Phase 1 אינו כולל themes מלאים, events, providers, scheduler או adapters.

## נפתרו

- בתחילת הסשן לא היה Git repository; נפתר באמצעות `git init`.
