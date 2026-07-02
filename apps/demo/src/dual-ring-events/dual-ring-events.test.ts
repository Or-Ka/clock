import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const demoDir = dirname(fileURLToPath(import.meta.url));

describe("Phase 3 demo Hebrew UI", () => {
  it("uses Hebrew document metadata, RTL layout and a clean clock-first shell", () => {
    const html = readDemoFile("index.html");

    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain("<title>שעון יומי</title>");
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
    const html = readDemoFile("index.html");
    const main = readDemoFile("main.ts");

    expect(html).toContain('<select id="location">');
    expect(html).toContain("ירושלים");
    expect(html).toContain("תל אביב");
    expect(html).toContain("אזור זמן של המיקום");
    expect(html).toContain('id="day-times-status"');
    expect(html).toContain("שעות זמניות");
    expect(html).toContain("data-zmanit-layer-toggle");
    expect(html).toContain('id="derived-event-form"');
    expect(html).toContain('id="fixed-day-time-list"');
    expect(html).toContain('id="fixed-day-time-status"');
    expect(html).toContain("אירועים מיוחדים");
    expect(html).toContain("שעות זמניות</option>");
    expect(html).toContain("API זריחה ושקיעה");
    expect(main).toContain("SunriseSunsetEventLayerProvider");
    expect(main).toContain("refreshDayTimesLayer");
    expect(main).toContain("currentDateKey");
    expect(main).toContain("createZmanitTicks");
    expect(main).toContain("DEFAULT_FIXED_DAY_TIME_EVENTS");
    expect(main).toContain("addFixedDayTimeEventsToLayer");
    expect(main).toContain("resolveDerivedEvents");
    expect(main).toContain("derivedOffsetSeconds");
  });

  it("keeps the demo event model layer-based while sourcing day-times from the API", () => {
    const main = readDemoFile("main.ts");

    expect(main).toContain("let eventLayers: EventLayerDefinition[]");
    expect(main).toContain("clock.setEventLayers(eventLayers)");
    expect(main).toContain("DAY_TIMES_LAYER_ID");
    expect(main).toContain("PERSONAL_LAYER_ID");
    expect(main).toContain("emptyDayTimesLayer()");
    expect(main).toContain("layer.id === DAY_TIMES_LAYER_ID");
  });

  it("defines configurable fixed day-time events from sunrise and sunset anchors", () => {
    const main = readDemoFile("main.ts");

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
    expect(main).toContain('id: `fixed-${definition.id}`');
    expect(main).toContain('existingLayer.id === DAY_TIMES_LAYER_ID');
  });

  it("does not leave the previous visible English demo labels in place", () => {
    const visibleTextSources = `${readDemoFile("index.html")}\n${readDemoFile("main.ts")}`;

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

function readDemoFile(name: string): string {
  return readFileSync(join(demoDir, name), "utf8");
}
