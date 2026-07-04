# Clock Project Documentation

תיקיית `docs/` היא מקור האמת של פרויקט `clock`: ספריית TypeScript פתוחה ומודולרית להצגת שעון אנלוגי SVG עם שכבת אירועים מבוססי זמן.

המסמך הזה הוא אינדקס תיעוד. הוראות עבודה למודל ולסשנים נמצאות בנפרד ב-`AGENT_GUIDE.md`.

## מהות הפרויקט

`clock` מיועד להטמעה באתרים ובאפליקציות Web שרוצים להציג זמן ואירועים על גבי שעון אנלוגי אינטראקטיבי.

הכיוון המוצרי:

- שעון SVG סטטי וחי.
- API נקי לצריכה דרך Vanilla JavaScript ובהמשך React או Web Component.
- הצגת אירועים על לוח השעון.
- תמיכה באירועים מוחלטים ידניים, ובהמשך אירועי עוגן, אירועים נגזרים וטווחי זמן.
- חיבור עתידי למקורות נתונים כמו זריחה ושקיעה.
- הפרדה מלאה בין לוגיקת זמן, אירועים, providers ו-renderer.

## מסמכי תכנון ומוצר

- `PRODUCT_SPEC.md`: חזון, משתמשים מיועדים וגבולות MVP.
- `ARCHITECTURE.md`: מבנה workspace, מודולים וגבולות אחריות.
- `TIME_MODEL.md`: מקורות זמן, timezone וייצוגי זמן.
- `EVENT_MODEL.md`: מודל אירועים, פתרון אירועים ושיוך לטבעות.
- `RENDERING_STRATEGY.md`: אסטרטגיית ה-SVG וה-renderer.
- `EMBEDDING_API.md`: API להטמעה וצריכה חיצונית.
- `ACCESSIBILITY.md`: עקרונות נגישות.

## מסמכי ניהול פרויקט

- `PROJECT_STATUS.md`: תמונת מצב עדכנית.
- `CURRENT_TASK.md`: המשימה הפעילה.
- `TASKS.md`: רשימת משימות והחלטות מאושרות.
- `ROADMAP.md`: כיוון התפתחות.
- `DECISIONS.md`: החלטות מרכזיות.
- `CHANGELOG.md`: שינויים שבוצעו.
- `KNOWN_ISSUES.md`: בעיות ידועות.
- `RISKS.md`: סיכונים.
- `OPEN_QUESTIONS.md`: שאלות פתוחות.

## מסמכי בדיקות

- `TEST_STRATEGY.md`: אסטרטגיית בדיקות.
- `TEST_STATUS.md`: מצב בדיקות עדכני.

## מסמכי עבודה למודל

- `AGENT_GUIDE.md`: סדר קריאה, פרוטוקולי פתיחת וסיום סשן, Gates וכללי Git.
- `SESSION_HANDOFF.md`: מצב העברה לסשן הבא.

## הפעלת דמו Phase 3

להפעלת דמו השעון החי עם שתי טבעות אירועים משורש הפרויקט:

```powershell
npm.cmd run dev
```

הפקודה מפעילה את `apps/demo/src/dual-ring-events` דרך Vite על `127.0.0.1`.

דמואים נוספים זמינים דרך scripts ייעודיים:

- `npm.cmd run dev:static-clock --workspace @clock/demo`
- `npm.cmd run dev:live-clock --workspace @clock/demo`
- `npm.cmd run dev:svg-spike --workspace @clock/demo`
