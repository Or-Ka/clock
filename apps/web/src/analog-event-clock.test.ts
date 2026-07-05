import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appSrcDir = dirname(fileURLToPath(import.meta.url));
const appRootDir = join(appSrcDir, "..");

describe("Analog Event Clock Hebrew UI", () => {
  it("uses Hebrew document metadata, RTL layout and a clean clock-first shell", () => {
    const html = readAppFile("index.html");

    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain("<title>שעון אירועים אנלוגי Beta</title>");
    expect(html).not.toContain("<h1>");
    expect(html).not.toContain("<nav");
    expect(html).not.toContain("שלב 1");
    expect(html).not.toContain("שלב 2");
    expect(html).not.toContain("שלב 3");
    expect(html).not.toContain("אירועים בשתי טבעות");
    expect(html).toContain("הגדרות מיקום");
    expect(html).toContain("הגדרות אירוע");
    expect(html).toContain("הגדרות אירוע מיוחד");
    expect(html).toContain("אירועים קבועים");
    expect(html).toContain("רשימת אירועים");
  });

  it("includes a location selector and day-times API status text", () => {
    const html = readAppFile("index.html");
    const main = readAppFile("main.ts");

    expect(html).toContain('<select id="location">');
    expect(html).toContain("ירושלים");
    expect(html).toContain("תל אביב");
    expect(html).toContain("אזור זמן של המיקום");
    expect(html).toContain('id="day-times-status"');
    expect(html).toContain('id="zmanit-set"');
    expect(html).toContain('id="zmanit-set-status"');
    expect(html).toContain('id="zmanit-set-form"');
    expect(html).toContain('id="zmanit-set-editor"');
    expect(html).toContain('id="zmanit-set-new"');
    expect(html).toContain('id="zmanit-set-delete"');
    expect(html).toContain("שעות זמניות");
    expect(html).toContain("data-zmanit-layer-toggle");
    expect(html).toContain('id="derived-event-form"');
    expect(html).toContain('data-event-form-toggle="regular"');
    expect(html).toContain('data-event-form-toggle="special"');
    expect(html).toContain('data-add-event-form="regular"');
    expect(html).toContain('data-add-event-form="special"');
    expect(html).toContain('id="fixed-day-time-list"');
    expect(html).toContain('id="fixed-day-time-status"');
    expect(html).toContain("אירועים מיוחדים");
    expect(html).toContain("שעות זמניות</option>");
    expect(html).toContain("API זריחה ושקיעה");
    expect(main).toContain("SunriseSunsetEventLayerProvider");
    expect(main).toContain("refreshDayTimesLayer");
    expect(main).toContain("refreshHebcalDetails");
    expect(main).toContain("currentParshaRangeStartDateKey");
    expect(main).toContain("addDaysToDateKey(civilDate, -1)");
    expect(main).toContain("currentDateKey");
    expect(main).toContain("createZmanitTicks");
    expect(main).toContain("DEFAULT_ZMANIT_TIME_SETS");
    expect(main).toContain("let zmanitTimeSets");
    expect(main).toContain("saveEditedZmanitSet");
    expect(main).toContain("deleteEditedZmanitSet");
    expect(main).toContain("selectedDefaultZmanitSetId");
    expect(main).toContain("resolveZmanitSetRange");
    expect(main).toContain("DEFAULT_FIXED_DAY_TIME_EVENTS");
    expect(main).toContain("AUTOMATIC_SHABBAT_EVENTS");
    expect(main).toContain("addFixedDayTimeEventsToLayer");
    expect(main).toContain("resolveDerivedEvents");
    expect(main).toContain("derivedOffsetSeconds");
  });

  it("keeps the application event model layer-based while sourcing day-times from the API", () => {
    const main = readAppFile("main.ts");

    expect(main).toContain("let eventLayers: EventLayerDefinition[]");
    expect(main).toContain("clock.setEventLayers(eventLayers)");
    expect(main).toContain("DAY_TIMES_LAYER_ID");
    expect(main).toContain("PERSONAL_LAYER_ID");
    expect(main).toContain("emptyDayTimesLayer()");
    expect(main).toContain("layer.id === DAY_TIMES_LAYER_ID");
  });

  it("adds collapsible display preferences and in-list event visual editing", () => {
    const html = readAppFile("index.html");
    const main = readAppFile("main.ts");
    const css = readAppFile("styles.css");

    expect(html).toContain("העדפות תצוגה");
    expect(html).toContain('id="display-preferences-toggle"');
    expect(html).toContain('id="display-preferences-panel"');
    expect(html).toContain("hidden");
    expect(html).toContain('id="display-template"');
    expect(html).toContain('id="display-mode"');
    expect(html).toContain('value="fullMode"');
    expect(html).toContain('value="clockOnly"');
    expect(html).toContain('value="floatingClock"');
    expect(html).toContain('id="display-font-family"');
    expect(html).toContain('id="display-font-scale"');
    expect(html).toContain('id="display-clock-scale"');
    expect(html).toContain('id="display-background-color"');
    expect(html).not.toContain('data-event-symbol-control');
    expect(html).not.toContain('data-event-color-control');

    for (const templateId of ["classic", "night", "paper", "focus", "festival"]) {
      expect(main).toContain(`${templateId}: {`);
      expect(html).toContain(`value="${templateId}"`);
    }

    expect(main).toContain("DISPLAY_TEMPLATES");
    expect(main).toContain("DisplayMode");
    expect(main).toContain("DISPLAY_MODE_STORAGE_KEY");
    expect(main).toContain("loadDisplayPreferences");
    expect(main).toContain("persistDisplayMode");
    expect(main).toContain("setDisplayMode");
    expect(main).toContain("createClockContextMenu");
    expect(main).toContain("displayModeLabel");
    expect(main).toContain("floatingClock");
    expect(main).toContain("documentPictureInPicture");
    expect(main).toContain("floatingClockPixelSize");
    expect(main).toContain("openFloatingClockWindow");
    expect(main).toContain("restoreFloatingClockToMainDocument");
    expect(main).toContain("syncFloatingClockWindowStyles");
    expect(main).toContain("data-floating-clock-window");
    expect(main).toContain('mount.addEventListener("contextmenu"');
    expect(main).toContain("root.dataset.displayMode");
    expect(main).toContain("applyDisplayPreferences");
    expect(main).toContain("syncDisplayPreferenceControls");
    expect(main).toContain("createEventVisualEditor");
    expect(main).toContain("EVENT_ICON_OPTIONS");
    expect(main).toContain("data-event-visual-id");
    expect(main).toContain("syncClockEventVisuals");
    expect(main).toContain("syncCountdownLayer");
    expect(main).toContain("timer-action-menu");
    expect(main).toContain("timer-action-menu-color");
    expect(main).toContain("clock-event-tooltip");
    expect(main).toContain("countdownColor");
    expect(main).toContain("data-countdown-gradient");
    expect(main).toContain("countdownGradientId");
    expect(main).toContain('stroke-linecap", "butt"');
    expect(main).not.toContain("שעות,");
    expect(main).not.toContain("דקות,");
    expect(main).not.toContain("🐓");
    expect(main).not.toContain("📖");
    expect(css).toContain("--display-font-family");
    expect(css).toContain("--display-clock-size");
    expect(css).toContain("--clock-font-boost");
    expect(css).toContain("--event-sunrise-color");
    expect(css).toContain(':root[data-display-mode="clockOnly"] .event-panel');
    expect(css).toContain(':root[data-display-mode="clockOnly"] .clock-toolbar');
    expect(css).toContain(':root[data-display-mode="floatingClock"] .clock-mount');
    expect(css).toContain("width: var(--floating-clock-size)");
    expect(css).toContain("z-index: 2147483000");
    expect(css).toContain('data-clock-ring="outer"');
    expect(css).toContain("calc(8.7px * var(--clock-font-boost))");
    expect(css).toContain("text-rendering: geometricPrecision");
    expect(css).toContain(".clock-context-menu");
    expect(css).toContain('[data-event-kind="sunrise"] line');
    expect(css).toContain(".event-symbol");
    expect(css).toContain(".timer-action-menu");
  });

  it("adds a no-print developer stamp with a hover gif tooltip", () => {
    const html = readAppFile("index.html");
    const css = readAppFile("styles.css");

    expect(html).toContain("dev-stamp no-print");
    expect(html).toContain("dev by Orka");
    expect(html).toContain("https://github.com/Or-Ka");
    expect(html).toContain('src="./src/dev.gif"');
    expect(css).toContain(".dev-stamp");
    expect(css).toContain("position: fixed");
    expect(css).toContain("z-index: 1300");
    expect(css).toContain(".dev-stamp-tooltip");
    expect(css).toContain("opacity 180ms ease");
    expect(css).toContain("@media print");
    expect(css).toContain(".no-print");
  });

  it("adds per-event alerts with global disable and import export controls", () => {
    const html = readAppFile("index.html");
    const main = readAppFile("main.ts");
    const css = readAppFile("styles.css");

    expect(html).toContain('id="alerts-enabled"');
    expect(html).toContain('id="export-app-state"');
    expect(html).toContain('id="import-app-state"');
    expect(html).toContain('id="import-app-state-file"');
    expect(html).toContain('id="event-alert-enabled"');
    expect(html).toContain('id="derived-event-alert-enabled"');
    expect(html).toContain('data-alert-form-settings="regular"');
    expect(html).toContain('data-alert-form-settings="special"');

    expect(main).toContain("EventAlertSettings");
    expect(main).toContain("alertSettings: EventAlertGlobalSettings");
    expect(main).toContain("eventAlertOverrides");
    expect(main).toContain("checkDueAlerts");
    expect(main).toContain("playAlertSound");
    expect(main).toContain("showDesktopAlert");
    expect(main).toContain("Notification.requestPermission");
    expect(main).toContain("exportAppState");
    expect(main).toContain("importAppState");
    expect(main).toContain("AppExportState");
    expect(main).toContain("dataset.eventAlertId");

    expect(css).toContain(".event-alert-controls");
    expect(css).toContain(".event-alert-form");
    expect(css).toContain(".import-export-actions");
  });

  it("defines configurable fixed day-time events from sunrise and sunset anchors", () => {
    const main = readAppFile("main.ts");

    for (const label of [
      "עלות השחר",
      "טלית ותפילין",
      "סוף זמן קריאת שמע",
      "סוף זמן תפילה",
      "חצות",
      "פלג המנחה",
      "צאת הכוכבים"
    ]) {
      expect(main).toContain(label);
    }

    expect(main).toContain('base: "sunrise"');
    expect(main).toContain('base: "sunset"');
    expect(main).toContain('base: "set-start"');
    expect(main).toContain('base: "set-end"');
    expect(main).toContain('zmanitSetId: "alot-tzeit"');
    expect(main).not.toContain('zmanitSetId: "tefillin-tefila"');
    expect(main).not.toContain('id: "tefillin-tefila"');
    expect(main).toContain('id: "sunrise-sunset"');
    expect(main).toContain('fixedEvents: DEFAULT_FIXED_DAY_TIME_EVENTS');
    expect(main).toContain('setSelect.dataset.fixedField = "zmanitSetId"');
    expect(main).toContain('offsetUnit: "zmanit-hours"');
    expect(main).toContain('id: `${idPrefix}-${definition.id}`');
    expect(main).toContain('existingLayer.id === DAY_TIMES_LAYER_ID');
  });

  it("keeps add-event forms collapsed behind explicit event-type choices", () => {
    const html = readAppFile("index.html");

    expect(html).toContain("הוספת אירוע");
    expect(html).toContain("אירוע רגיל");
    expect(html).toContain("אירוע מיוחד");
    expect(html).toContain('id="event-form"');
    expect(html).toContain('id="derived-event-form"');
    expect(html).toContain("שמירה");
    expect(html).not.toContain("<button type=\"submit\">הוספת אירוע</button>");
    expect(html).not.toContain("<button type=\"submit\">הוספת אירוע מיוחד</button>");
  });

  it("adds automatic Shabbat times only for Friday and Saturday", () => {
    const main = readAppFile("main.ts");

    expect(main).toContain("הדלקת נרות");
    expect(main).toContain('id: "candle-lighting"');
    expect(main).not.toContain('id: "shabbat-entry"');
    expect(main).toContain("יציאת שבת");
    expect(main).toContain("weekdays: [5]");
    expect(main).toContain("weekdays: [6]");
    expect(main).toContain("resolveAutomaticShabbatEvents");
  });

  it("keeps legacy export and storage compatibility while writing new product names", () => {
    const main = readAppFile("main.ts");
    const legacyDemoExport = {
      version: 1,
      exportedAt: "2026-07-05T00:00:00.000Z",
      selectedLocationId: "jerusalem",
      selectedDefaultZmanitSetId: "sunrise-sunset",
      zmanitTimeSets: [],
      personalEvents: [
        {
          id: "legacy-demo-event",
          type: "instant",
          kind: "custom",
          title: "Legacy",
          hour: 10,
          minute: 15
        }
      ],
      derivedEvents: [],
      fixedDayTimeEvents: [],
      displayPreferences: {
        templateId: "classic",
        displayMode: "clockOnly",
        fontFamily: "system",
        fontScale: 100,
        clockScale: 100,
        colors: {}
      },
      eventVisualOverrides: {},
      alertSettings: {
        enabled: true,
        sound: true,
        desktop: false
      },
      eventAlertOverrides: {}
    };

    expect(main).toContain('const DISPLAY_MODE_STORAGE_KEY = "analog-event-clock-display-mode"');
    expect(main).toContain('const LEGACY_DISPLAY_MODE_STORAGE_KEY = "dual-ring-events-display-mode"');
    expect(main).toContain("localStorage.getItem(LEGACY_DISPLAY_MODE_STORAGE_KEY)");
    expect(main).toContain("localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, legacySavedMode)");
    expect(main).toContain("version: 1");
    expect(legacyDemoExport.version).toBe(1);
    expect(legacyDemoExport.personalEvents[0]).toMatchObject({
      id: "legacy-demo-event",
      type: "instant",
      kind: "custom",
      title: "Legacy",
      hour: 10,
      minute: 15
    });
    expect(main).toContain("state.personalEvents");
    expect(main).toContain("state.displayPreferences");
    expect(main).toContain("state.alertSettings");
    expect(main).toContain("analog-event-clock-${currentDateKey()}.json");
    expect(main).not.toContain("dual-ring-events-${currentDateKey()}.json");
  });

  it("does not leave previous visible English legacy labels in place", () => {
    const visibleTextSources = `${readAppFile("index.html")}\n${readAppFile("main.ts")}`;

    for (const englishText of [
      "Dual Ring Events",
      "Static Clock",
      "Live Clock",
      "Timezone",
      "Add event",
      "Delete",
      "Past",
      "Future"
    ]) {
      expect(visibleTextSources).not.toContain(englishText);
    }
  });
});

function readAppFile(name: string): string {
  return readFileSync(name === "index.html" ? join(appRootDir, name) : join(appSrcDir, name), "utf8");
}
