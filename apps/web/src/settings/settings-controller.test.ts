// @ts-expect-error jsdom is already a dev dependency, but the project does not ship @types/jsdom.
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";

import {
  createSettingsController,
  type SettingsDisplayMode,
  type SettingsDisplayPreferences
} from "./settings-controller.js";
import type { SettingsElements } from "./settings-elements.js";

const initialPreferences: SettingsDisplayPreferences = {
  displayMode: "fullMode",
  fontScale: 100,
  clockScale: 100
};

describe("createSettingsController", () => {
  it("opens and closes the display preferences panel", () => {
    const harness = createHarness();
    harness.controller.start();

    harness.elements.displayPreferencesToggle.dispatchEvent(new harness.window.Event("click"));
    expect(harness.elements.displayPreferencesPanel.hidden).toBe(false);
    expect(harness.elements.displayPreferencesToggle.getAttribute("aria-expanded")).toBe("true");

    harness.controller.setDisplayPreferencesOpen(false);
    expect(harness.elements.displayPreferencesPanel.hidden).toBe(true);
    expect(harness.elements.displayPreferencesToggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("changes display modes and closes transient UI for compact modes", () => {
    const harness = createHarness();
    harness.controller.start();

    harness.controller.setDisplayPreferencesOpen(true);
    harness.elements.displayModeSelect.value = "clockOnly";
    harness.elements.displayModeSelect.dispatchEvent(new harness.window.Event("change"));

    expect(harness.preferences.displayMode).toBe("clockOnly");
    expect(harness.elements.displayPreferencesPanel.hidden).toBe(true);
    expect(harness.persistDisplayMode).toHaveBeenLastCalledWith("clockOnly");
    expect(harness.closeEventVisualEditor).toHaveBeenCalledTimes(1);
    expect(harness.closeTimerActionMenu).toHaveBeenCalledTimes(1);

    harness.elements.displayModeSelect.value = "floatingClock";
    harness.elements.displayModeSelect.dispatchEvent(new harness.window.Event("change"));
    expect(harness.preferences.displayMode).toBe("floatingClock");

    harness.controller.setDisplayPreferencesOpen(true);
    harness.elements.displayModeSelect.value = "fullMode";
    harness.elements.displayModeSelect.dispatchEvent(new harness.window.Event("change"));
    expect(harness.preferences.displayMode).toBe("fullMode");
    expect(harness.elements.displayPreferencesPanel.hidden).toBe(false);
  });

  it("applies location and size changes through callbacks", () => {
    const harness = createHarness();
    harness.controller.start();

    harness.elements.locationSelect.value = "tel-aviv";
    harness.elements.locationSelect.dispatchEvent(new harness.window.Event("change"));
    expect(harness.onLocationChange).toHaveBeenCalledWith("tel-aviv");
    expect(harness.elements.timezoneSelect.value).toBe("Asia/Jerusalem");

    harness.elements.displayFontScaleInput.value = "120";
    harness.elements.displayFontScaleInput.dispatchEvent(new harness.window.Event("input"));
    harness.elements.displayClockScaleInput.value = "115";
    harness.elements.displayClockScaleInput.dispatchEvent(new harness.window.Event("input"));

    expect(harness.preferences.fontScale).toBe(120);
    expect(harness.preferences.clockScale).toBe(115);
    expect(harness.applyDisplayPreferences).toHaveBeenCalledTimes(2);
  });

  it("cleans up listeners and guards repeated start calls", () => {
    const harness = createHarness();

    harness.controller.start();
    harness.controller.start();
    harness.elements.displayFontScaleInput.value = "111";
    harness.elements.displayFontScaleInput.dispatchEvent(new harness.window.Event("input"));
    expect(harness.applyDisplayPreferences).toHaveBeenCalledTimes(1);

    harness.controller.destroy();
    harness.elements.displayFontScaleInput.value = "112";
    harness.elements.displayFontScaleInput.dispatchEvent(new harness.window.Event("input"));
    expect(harness.applyDisplayPreferences).toHaveBeenCalledTimes(1);

    harness.controller.start();
    harness.elements.displayFontScaleInput.value = "113";
    harness.elements.displayFontScaleInput.dispatchEvent(new harness.window.Event("input"));
    expect(harness.applyDisplayPreferences).toHaveBeenCalledTimes(2);
  });
});

function createHarness(): {
  readonly window: Window & typeof globalThis;
  readonly elements: SettingsElements;
  preferences: SettingsDisplayPreferences;
  readonly controller: ReturnType<typeof createSettingsController<SettingsDisplayPreferences>>;
  readonly applyDisplayPreferences: ReturnType<typeof vi.fn>;
  readonly persistDisplayMode: ReturnType<typeof vi.fn>;
  readonly closeEventVisualEditor: ReturnType<typeof vi.fn>;
  readonly closeTimerActionMenu: ReturnType<typeof vi.fn>;
  readonly onLocationChange: ReturnType<typeof vi.fn>;
} {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const document = dom.window.document;
  let preferences: SettingsDisplayPreferences = { ...initialPreferences };
  const elements = createElements(document);
  const applyDisplayPreferences = vi.fn();
  const persistDisplayMode = vi.fn();
  const closeEventVisualEditor = vi.fn();
  const closeTimerActionMenu = vi.fn();
  const onLocationChange = vi.fn((locationId: string) => {
    elements.timezoneSelect.value = locationId === "tel-aviv" ? "Asia/Jerusalem" : "UTC";
  });

  const harness = {
    window: dom.window as unknown as Window & typeof globalThis,
    elements,
    get preferences() {
      return preferences;
    },
    set preferences(next: SettingsDisplayPreferences) {
      preferences = next;
    },
    applyDisplayPreferences,
    persistDisplayMode,
    closeEventVisualEditor,
    closeTimerActionMenu,
    onLocationChange,
    controller: createSettingsController<SettingsDisplayPreferences>({
      elements,
      getDisplayPreferences: () => preferences,
      setDisplayPreferences(next) {
        preferences = next;
      },
      isDisplayMode(value): value is SettingsDisplayMode {
        return value === "fullMode" || value === "clockOnly" || value === "floatingClock";
      },
      persistDisplayMode,
      onLocationChange,
      applyDisplayPreferences,
      syncFloatingClockMode: vi.fn(),
      closeClockContextMenu: vi.fn(),
      closeEventVisualEditor,
      closeTimerActionMenu
    })
  };

  harness.controller.syncDisplayPreferenceControls();
  return harness;
}

function createElements(document: Document): SettingsElements {
  return {
    timezoneSelect: appendSelect(document, ["UTC", "Asia/Jerusalem"]),
    locationSelect: appendSelect(document, ["jerusalem", "tel-aviv"]),
    displayPreferencesToggle: appendButton(document),
    displayPreferencesPanel: appendPanel(document),
    displayModeSelect: appendSelect(document, ["fullMode", "clockOnly", "floatingClock"]),
    displayFontScaleInput: appendInput(document, "100"),
    displayClockScaleInput: appendInput(document, "100")
  };
}

function appendSelect(document: Document, values: readonly string[]): HTMLSelectElement {
  const select = document.createElement("select");
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
  document.body.append(select);
  return select;
}

function appendButton(document: Document): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  document.body.append(button);
  return button;
}

function appendPanel(document: Document): HTMLElement {
  const panel = document.createElement("section");
  panel.hidden = true;
  document.body.append(panel);
  return panel;
}

function appendInput(document: Document, value: string): HTMLInputElement {
  const input = document.createElement("input");
  input.value = value;
  document.body.append(input);
  return input;
}
