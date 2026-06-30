# Rendering Strategy

## renderer ראשי

ה-renderer הראשי יהיה SVG.

## עקרונות

- renderer אינו פותר אירועים בעצמו.
- renderer מקבל זמן, context, theme ו-`ResolvedClockItem[]`.
- renderer צריך לתמוך ב-responsive layout.
- renderer צריך לתמוך באינטראקציה ובנגישות.

## SVG Spike

לפני מימוש renderer מוצרי יבוצע Spike תחת:

```text
apps/demo/src/spikes/svg-clock/
```

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

## תוצאות Spike

סטטוס: הושלם ב-2026-06-30.

Phase 1 טרם אושר. תוצאות ה-Spike ממתינות לביקורת לפני העברה אפשרית לקוד מוצרי.

מיקום:

```text
apps/demo/src/spikes/svg-clock/
```

אימות שבוצע:

- שלושה SVGים נטענים בדף.
- viewBox קבוע `0 0 200 200`.
- מחוגים מציגים זמן קבוע 10:10.
- marker מוצג ומוגדר כ-`role="button"` עם `tabindex="0"`.
- click מעדכן status.
- Enter מפעיל marker בפוקוס.
- focus ring גלוי.
- `dir="rtl"` פעיל.
- responsive נבדק ב-1200px, 760px ו-390px.
- `ResizeObserver` ו-listeners מנוקים דרך `destroy()`.
