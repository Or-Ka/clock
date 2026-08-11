# תרומה לפרויקט

תודה על הרצון לשתף פעולה. הפרויקט מחפש תרומות ממוקדות בתחומי נגישות, מודל זמן, UX בעברית,
רינדור SVG, בדיקות וארכיטקטורת frontend.

## לפני שמתחילים

1. פתחו Issue קצר המתאר את הבעיה או ההצעה, במיוחד אם השינוי משפיע על API או ארכיטקטורה.
2. קראו את `README.md`, את `docs/ARCHITECTURE.md` ואת המסמך הרלוונטי תחת `docs/`.
3. שמרו על כיוון התלויות: זמן → projection → resolver → renderer. ה־renderer אינו מחשב אירועים או טבעות.

## סביבת פיתוח

נדרשים Node.js 24 ו־npm 11.

```powershell
npm.cmd ci
npm.cmd run dev
```

לפני Pull Request יש להריץ:

```powershell
npm.cmd audit --audit-level=high
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Pull Request

- שמרו על שינוי קטן וממוקד.
- הוסיפו בדיקות להתנהגות חדשה או לתיקון באג.
- עדכנו את מסמכי המקור תחת `docs/` כאשר החוזה או מצב הפרויקט משתנים.
- אל תשנו fixtures או תחלישו בדיקות כדי להתאים למימוש.
- ציינו במפורש בדיקות שלא ניתן היה להריץ.

דיווחי אבטחה יש לשלוח לפי `SECURITY.md`, ולא כ־Issue ציבורי.
