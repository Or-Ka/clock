# Clock

ספריית TypeScript מודולרית להצגת שעון אנלוגי SVG עם שכבת אירועים מבוססי זמן.

הפרויקט נועד לספק בסיס נקי להטמעת שעון אינטראקטיבי באתרים ובאפליקציות Web: תחילה כשעון סטטי וחי, ובהמשך כשכבת תצוגה עשירה לאירועים, מקורות זמן, providers, עטיפות React ו-Web Component.

## מה יש בפרויקט

- ספריית ליבה תחת `packages/clock`.
- דמו Vite תחת `apps/demo`.
- שעון SVG סטטי עם API מוצרי.
- שעון חי שמבוסס על `TimeSource`, scheduler ו-timezone.
- תצוגת Phase 3 עם שתי טבעות אירועים: יום ולילה.
- מודל אירועים ידני עבור `sunrise`, `sunset` ו-`custom`.
- הפרדה בין חישובי זמן, פתרון אירועים, renderer ודמו.

## מבנה

```text
apps/
  demo/
packages/
  clock/
docs/
```

`packages/clock/src` מחולק לפי תחומי אחריות:

```text
core/
time/
events/
rendering/
themes/
```

## הפעלה מקומית

התקנת תלויות:

```powershell
npm.cmd install
```

הרצת דמו Phase 3:

```powershell
npm.cmd run dev
```

דמואים נוספים:

```powershell
npm.cmd run dev:static-clock --workspace @clock/demo
npm.cmd run dev:live-clock --workspace @clock/demo
npm.cmd run dev:svg-spike --workspace @clock/demo
```

## בדיקות ובנייה

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run docs:check
```

## תיעוד

נקודת הכניסה לתיעוד נמצאת ב-[docs/README.md](docs/README.md). המסמכים המרכזיים:

- [Product Spec](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Embedding API](docs/EMBEDDING_API.md)
- [Event Model](docs/EVENT_MODEL.md)
- [Project Status](docs/PROJECT_STATUS.md)

הוראות עבודה למודל ולסשנים נשמרות בנפרד ב-[docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md), כדי שה-README יתאר את המוצר עצמו.
