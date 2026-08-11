# Analog Event Clock

[![CI](https://github.com/Or-Ka/clock/actions/workflows/ci.yml/badge.svg)](https://github.com/Or-Ka/clock/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Or-Ka/clock/actions/workflows/codeql.yml/badge.svg)](https://github.com/Or-Ka/clock/actions/workflows/codeql.yml)

שעון אירועים אנלוגי, Hebrew-first ו־RTL, שמציג את כל 24 שעות היממה בשתי טבעות: יום ולילה. לצד השעה
הנוכחית הוא מציג זמני זריחה ושקיעה, שעות זמניות, אירועים אישיים, זמני שבת, טיימרים והתראות.

**[פתיחת הדמו החי](https://heb-clock.vercel.app)**

הפרויקט נמצא ב־Beta ומחפש שיתופי פעולה בתחומי נגישות, מודל זמן, UX, SVG וארכיטקטורת frontend.

## מה יש במאגר

- `packages/clock` — ספריית TypeScript עצמאית מ־framework עבור זמן, resolver ורינדור SVG.
- `apps/web` — אפליקציית Vite הרשמית שצורכת את הספרייה.
- `docs` — מפרט המוצר, ארכיטקטורה, החלטות, בדיקות ומצב העבודה.
- `archive/legacy-app-screens` — מסכי אב־טיפוס היסטוריים שאינם נכנסים ל־build.

זרימת הנתונים נשמרת בכיוון אחד:

```text
TimeSource → timezone projection → event resolver → resolved items → SVG renderer
```

## יכולות מרכזיות

- תצוגת 24 שעות בשתי טבעות קבועות.
- חישוב והצגת זריחה, שקיעה ושעות זמניות לפי ערים מוגדרות.
- אירועים קבועים, אישיים ונגזרים.
- זמני כניסת שבת ויציאתה לפי השקיעה המקומית.
- מצב שעון מלא, שעון בלבד ושעון צף, כולל Document Picture-in-Picture בדפדפנים תומכים.
- שמירה מקומית אוטומטית וייבוא/ייצוא JSON תואם schema version 1.
- ערכות שעון Dark, Light ו־Wood עם ממשק עברי ו־RTL.

## הרצה מקומית

נדרשים Node.js 24 ו־npm 11.

```powershell
npm.cmd ci
npm.cmd run dev
```

Vite מאזין מקומית על `127.0.0.1`.

## בדיקות

```powershell
npm.cmd audit --audit-level=high
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

אותם שערים נאכפים ב־CI. CodeQL ו־Dependabot משלימים את בדיקות שרשרת האספקה והקוד.

## פרטיות ואבטחה

- אין חשבונות משתמש, analytics או cookies של האפליקציה.
- ההגדרות והאירועים נשמרים ב־`localStorage` של הדפדפן בלבד.
- זמני היום נטענים מ־Sunrise-Sunset API ופרטי הלוח העברי מ־Hebcal.
- קובצי ייבוא מוגבלים בגודל ונבדקים לפני שינוי מצב האפליקציה.

הפירוט המלא נמצא ב־[docs/PRIVACY.md](docs/PRIVACY.md). חולשות יש לדווח באופן פרטי לפי
[SECURITY.md](SECURITY.md).

## תרומה ושיתוף פעולה

הצעות ממוקדות, דיווחי באגים ו־Pull Requests מתקבלים בברכה. לפני שינוי רחב, מומלץ לפתוח Issue ולתאם
את החוזה הרצוי. ראו [CONTRIBUTING.md](CONTRIBUTING.md) ואת [מסמכי הארכיטקטורה](docs/ARCHITECTURE.md).

## פריסה

האתר נפרס מ־root המאגר באמצעות `vercel.json`: התקנה עם `npm ci`, build של ה־workspace ופרסום
`apps/web/dist`. אין צורך במשתני סביבה.

## רישיון

הקוד מופץ תחת [MIT License](LICENSE).

---

English summary: an open-source, Hebrew-first analog event clock built with TypeScript, Temporal and SVG.
The live Beta is available at [heb-clock.vercel.app](https://heb-clock.vercel.app), and contributions are welcome.
