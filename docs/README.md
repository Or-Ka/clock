# Clock Project Documentation

מסמך זה הוא נקודת הכניסה המחייבת לכל סשן חדש בפרויקט `clock`.

## מטרת הפרויקט

בניית ספריית TypeScript פתוחה ומודולרית של שעון אנלוגי עם אירועים מבוססי זמן.

המוצר מיועד:

- להטמעה באתרים.
- לשימוש באפליקציות Web.
- לשימוש עתידי דרך React, Web Component או Vanilla JavaScript.
- להצגת אירועים על לוח השעון.
- להצגת אירועים מוחלטים, ובהמשך אירועי עוגן, אירועים נגזרים וטווחי זמן.
- לחיבור עתידי למקורות נתונים כמו זריחה ושקיעה.
- להפרדה מלאה בין לוגיקת זמן, אירועים, providers ו-renderer.

## מסמכי מקור אמת

כל קובצי ה-Markdown תחת `docs/` הם מקור האמת של הפרויקט:

- `README.md`
- `PRODUCT_SPEC.md`
- `ARCHITECTURE.md`
- `TIME_MODEL.md`
- `EVENT_MODEL.md`
- `RENDERING_STRATEGY.md`
- `EMBEDDING_API.md`
- `ROADMAP.md`
- `TASKS.md`
- `PROJECT_STATUS.md`
- `CURRENT_TASK.md`
- `SESSION_HANDOFF.md`
- `DECISIONS.md`
- `TEST_STRATEGY.md`
- `TEST_STATUS.md`
- `KNOWN_ISSUES.md`
- `CHANGELOG.md`
- `ACCESSIBILITY.md`
- `RISKS.md`
- `OPEN_QUESTIONS.md`

## סדר קריאה מחייב לכל סשן חדש

1. `docs/README.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/CURRENT_TASK.md`
4. `docs/SESSION_HANDOFF.md`
5. המשימה המתאימה ב-`docs/TASKS.md`
6. `docs/ARCHITECTURE.md`
7. החלטות רלוונטיות ב-`docs/DECISIONS.md`
8. מסמכי התחום הרלוונטיים
9. `git status`
10. השוואת הקוד לתיעוד

## פרוטוקול פתיחת סשן

1. לקרוא את המסמכים לפי סדר הקריאה המחייב.
2. להריץ `git status --short --branch`.
3. להציג את מבנה התיקייה הרלוונטי.
4. לבדוק שהמשימה הפעילה זהה ב-`TASKS.md`, `CURRENT_TASK.md` ו-`PROJECT_STATUS.md`.
5. לבדוק האם יש שינויים קיימים שלא נוצרו בסשן הנוכחי.
6. להמשיך רק מהמשימה הפעילה או מהמשימה הראשונה שאינה הושלמה.
7. לא להתחיל Spike או קוד מוצר לפני Gate התיעוד.

## פרוטוקול סיום סשן

1. לעדכן את `PROJECT_STATUS.md`.
2. לעדכן את `CURRENT_TASK.md`.
3. לעדכן את `SESSION_HANDOFF.md` עם מצב מדויק והמשך מומלץ.
4. לעדכן את `TASKS.md` עבור כל משימה שהתקדמה.
5. לעדכן `TEST_STATUS.md`, `KNOWN_ISSUES.md` ו-`CHANGELOG.md` לפי הצורך.
6. להריץ בדיקות ו-build כאשר קיימים scripts מתאימים.
7. להריץ `git status --short --branch`.
8. לבצע commit רק לאחר בדיקות ועדכון תיעוד, ורק אם זה מתאים למצב העבודה.

## Gate התיעוד

אין להתחיל את ה-SVG Spike לפני ש:

- כל מסמכי מקור האמת קיימים.
- אין מסמכים ריקים.
- המשימה הפעילה זהה ב-`TASKS.md`, `CURRENT_TASK.md` ו-`PROJECT_STATUS.md`.
- קיימים פרוטוקולי פתיחת וסיום סשן.
- מצב Git מתועד.
- מצב הבדיקות מתועד.
- סשן חדש יכול להבין את מצב הפרויקט ללא השיחה המקורית.

## Gate ה-SVG Spike

ה-Spike צריך להוכיח:

- SVG responsive בשלושה גדלים.
- מחוג שעות ודקות לפי זמן קבוע.
- marker אחד לפחות.
- hover.
- click.
- keyboard focus.
- focus ring גלוי.
- RTL תקין.
- resize תקין.
- cleanup של listeners ו-observers.
- הקוד נשאר רק תחת `apps/demo/src/spikes/svg-clock/`.

ה-Spike אינו API ציבורי ואינו מועבר אוטומטית ל-`packages/clock`.

## כללי Git

- אין push.
- אין merge.
- אין rebase.
- אין Pull Request.
- הודעות commit מפורטות בעברית.
- commit רק לאחר בדיקות ועדכון תיעוד.

## הפעלת דמו Phase 3

להפעלת דמו השעון החי עם שתי טבעות אירועים משורש הפרויקט:

```powershell
npm.cmd run dev
```

הפקודה מפעילה את `apps/demo/src/dual-ring-events` דרך Vite על `127.0.0.1`.

דמואים נוספים זמינים דרך scripts ייעודיים:

- `npm.cmd run dev:static-clock --workspace @clock/demo`
- `npm.cmd run dev:live-clock --workspace @clock/demo`
