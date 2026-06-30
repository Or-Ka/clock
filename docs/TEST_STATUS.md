# Test Status

עודכן: 2026-06-30

## מצב נוכחי

קיים test runner בסיסי: Vitest.

## ריצות אחרונות

```text
npm.cmd run docs:check
PASS: Documentation gate passed for 20 docs.

npm.cmd run typecheck
PASS: tsc -b tsconfig.json --pretty false

npm.cmd test
PASS: 1 test file, 1 test

npm.cmd run build
PASS: tsc -b tsconfig.json and Vite build for apps/demo SVG Spike
```

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

- עדיין אין בדיקות renderer מוצרי.
- עדיין אין בדיקות event resolver.
- עדיין אין בדיקות browser אוטומטיות ל-SVG Spike; בדיקת הדפדפן שבוצעה הייתה ידנית/כלית.
