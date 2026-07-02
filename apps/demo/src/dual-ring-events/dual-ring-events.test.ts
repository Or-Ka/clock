import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const demoDir = dirname(fileURLToPath(import.meta.url));

describe("Phase 3 demo Hebrew UI", () => {
  it("uses Hebrew document metadata and RTL layout", () => {
    const html = readDemoFile("index.html");

    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain("<h1>אירועים בשתי טבעות</h1>");
    expect(html).toContain("שלב 1 - שעון סטטי");
    expect(html).toContain("שלב 2 - שעון חי");
    expect(html).toContain("שלב 3 - אירועים בשתי טבעות");
  });

  it("translates central controls, layer toggles and validation messages to Hebrew", () => {
    const html = readDemoFile("index.html");
    const main = readDemoFile("main.ts");

    expect(html).toContain("אזור זמן");
    expect(html).toContain("שכבות תצוגה");
    expect(html).toContain('data-layer-toggle="day-times"');
    expect(html).toContain('data-layer-toggle="personal"');
    expect(html).toContain("זמני היום");
    expect(html).toContain("אירועים אישיים");
    expect(html).toContain("סוג אירוע");
    expect(html).toContain("אירוע מותאם");
    expect(html).toContain("הוספת אירוע");
    expect(html).toContain('<form id="event-form" class="event-form" novalidate>');
    expect(main).toContain("מחיקה");
    expect(main).toContain("השעה חייבת להיות מספר שלם בין 0 ל-23.");
    expect(main).toContain("הדקה חייבת להיות מספר שלם בין 0 ל-59.");
  });

  it("keeps the demo event model layer-based", () => {
    const main = readDemoFile("main.ts");

    expect(main).toContain("let eventLayers: EventLayerDefinition[]");
    expect(main).toContain("clock.setEventLayers(eventLayers)");
    expect(main).toContain("DAY_TIMES_LAYER_ID");
    expect(main).toContain("PERSONAL_LAYER_ID");
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
      "Sunrise",
      "Sunset",
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
