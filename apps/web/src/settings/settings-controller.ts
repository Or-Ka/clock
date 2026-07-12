import type { SettingsElements } from "./settings-elements.js";

export type SettingsDisplayMode = "fullMode" | "clockOnly" | "floatingClock";
export type SettingsDisplayTemplateId = string;
export type SettingsDisplayFontFamily = string;

export type SettingsDisplayPreferences = {
  readonly templateId: SettingsDisplayTemplateId;
  readonly displayMode: SettingsDisplayMode;
  readonly fontFamily: SettingsDisplayFontFamily;
  readonly fontScale: number;
  readonly clockScale: number;
  readonly backgroundColor: string;
  readonly panelColor: string;
  readonly textColor: string;
  readonly mutedColor: string;
  readonly accentColor: string;
  readonly clockFaceColor: string;
  readonly clockStrokeColor: string;
  readonly clockHandColor: string;
  readonly eventStyles: unknown;
};

export type SettingsController = {
  readonly start: () => void;
  readonly destroy: () => void;
  readonly syncDisplayPreferenceControls: () => void;
  readonly setDisplayPreferencesOpen: (isOpen: boolean) => void;
  readonly setDisplayMode: (displayMode: SettingsDisplayMode) => void;
};

export type SettingsControllerDeps<TDisplayPreferences extends SettingsDisplayPreferences> = {
  readonly elements: SettingsElements;
  readonly displayTemplates: Record<string, TDisplayPreferences>;
  readonly getDisplayPreferences: () => TDisplayPreferences;
  readonly setDisplayPreferences: (next: TDisplayPreferences) => void;
  readonly cloneDisplayPreferences: (preferences: TDisplayPreferences) => TDisplayPreferences;
  readonly isDisplayTemplateId: (value: string) => boolean;
  readonly isDisplayMode: (value: string) => value is SettingsDisplayMode;
  readonly isDisplayFontFamily: (value: string) => boolean;
  readonly persistDisplayMode: (displayMode: SettingsDisplayMode) => void;
  readonly onLocationChange: (locationId: string) => void;
  readonly applyDisplayPreferences: () => void;
  readonly syncEventList: () => void;
  readonly syncClockEventVisuals: () => void;
  readonly syncFloatingClockMode: () => void;
  readonly closeClockContextMenu: () => void;
  readonly closeEventVisualEditor: () => void;
  readonly closeTimerActionMenu: () => void;
};

export function createSettingsController<TDisplayPreferences extends SettingsDisplayPreferences>(
  deps: SettingsControllerDeps<TDisplayPreferences>
): SettingsController {
  const cleanups: Array<() => void> = [];
  let started = false;

  function addEventListener<TEvent extends Event>(
    target: EventTarget,
    type: string,
    listener: (event: TEvent) => void
  ): void {
    const eventListener = listener as EventListener;
    target.addEventListener(type, eventListener);
    cleanups.push(() => target.removeEventListener(type, eventListener));
  }

  function displayPreferences(): TDisplayPreferences {
    return deps.getDisplayPreferences();
  }

  function setDisplayPreferences(next: TDisplayPreferences): void {
    deps.setDisplayPreferences(next);
  }

  function syncDisplayPreferenceControls(): void {
    const preferences = displayPreferences();
    deps.elements.displayTemplateSelect.value = preferences.templateId;
    deps.elements.displayModeSelect.value = preferences.displayMode;
    deps.elements.displayFontFamilySelect.value = preferences.fontFamily;
    deps.elements.displayFontScaleInput.value = String(preferences.fontScale);
    deps.elements.displayClockScaleInput.value = String(preferences.clockScale);
    deps.elements.displayBackgroundColorInput.value = preferences.backgroundColor;
    deps.elements.displayPanelColorInput.value = preferences.panelColor;
    deps.elements.displayTextColorInput.value = preferences.textColor;
    deps.elements.displayAccentColorInput.value = preferences.accentColor;
    deps.elements.displayClockFaceColorInput.value = preferences.clockFaceColor;
  }

  function setDisplayPreferencesOpen(isOpen: boolean): void {
    deps.elements.displayPreferencesPanel.hidden = !isOpen;
    deps.elements.displayPreferencesToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function setDisplayMode(displayMode: SettingsDisplayMode): void {
    setDisplayPreferences({ ...displayPreferences(), displayMode });
    deps.persistDisplayMode(displayMode);
    syncDisplayPreferenceControls();
    deps.applyDisplayPreferences();
    deps.syncFloatingClockMode();
    deps.closeClockContextMenu();
    if (displayMode === "clockOnly" || displayMode === "floatingClock") {
      setDisplayPreferencesOpen(false);
      deps.closeEventVisualEditor();
      deps.closeTimerActionMenu();
    }
  }

  function handleDisplayTemplateChange(): void {
    const templateId = deps.elements.displayTemplateSelect.value;
    if (!deps.isDisplayTemplateId(templateId)) {
      return;
    }

    const currentMode = displayPreferences().displayMode;
    const template = deps.displayTemplates[templateId];
    if (template === undefined) {
      return;
    }

    setDisplayPreferences({
      ...deps.cloneDisplayPreferences(template),
      displayMode: currentMode
    });
    syncDisplayPreferenceControls();
    deps.applyDisplayPreferences();
    deps.syncEventList();
    deps.syncClockEventVisuals();
  }

  function handleDisplayModeChange(): void {
    if (!deps.isDisplayMode(deps.elements.displayModeSelect.value)) {
      return;
    }

    setDisplayMode(deps.elements.displayModeSelect.value);
  }

  function handleDisplayFontFamilyChange(): void {
    if (!deps.isDisplayFontFamily(deps.elements.displayFontFamilySelect.value)) {
      return;
    }

    setDisplayPreferences({
      ...displayPreferences(),
      fontFamily: deps.elements.displayFontFamilySelect.value
    });
    deps.applyDisplayPreferences();
  }

  function handleDisplayFontScaleInput(): void {
    setDisplayPreferences({
      ...displayPreferences(),
      fontScale: Number(deps.elements.displayFontScaleInput.value)
    });
    deps.applyDisplayPreferences();
  }

  function handleDisplayClockScaleInput(): void {
    setDisplayPreferences({
      ...displayPreferences(),
      clockScale: Number(deps.elements.displayClockScaleInput.value)
    });
    deps.applyDisplayPreferences();
  }

  function handleDisplayColorInput(): void {
    setDisplayPreferences({
      ...displayPreferences(),
      backgroundColor: deps.elements.displayBackgroundColorInput.value,
      panelColor: deps.elements.displayPanelColorInput.value,
      textColor: deps.elements.displayTextColorInput.value,
      accentColor: deps.elements.displayAccentColorInput.value,
      clockFaceColor: deps.elements.displayClockFaceColorInput.value
    });
    deps.applyDisplayPreferences();
    deps.syncClockEventVisuals();
  }

  return {
    start() {
      if (started) {
        return;
      }

      started = true;
      addEventListener(deps.elements.locationSelect, "change", () => {
        deps.onLocationChange(deps.elements.locationSelect.value);
      });
      addEventListener(deps.elements.displayPreferencesToggle, "click", () => {
        setDisplayPreferencesOpen(deps.elements.displayPreferencesPanel.hidden);
      });
      addEventListener(deps.elements.displayTemplateSelect, "change", handleDisplayTemplateChange);
      addEventListener(deps.elements.displayModeSelect, "change", handleDisplayModeChange);
      addEventListener(deps.elements.displayFontFamilySelect, "change", handleDisplayFontFamilyChange);
      addEventListener(deps.elements.displayFontScaleInput, "input", handleDisplayFontScaleInput);
      addEventListener(deps.elements.displayClockScaleInput, "input", handleDisplayClockScaleInput);

      for (const input of [
        deps.elements.displayBackgroundColorInput,
        deps.elements.displayPanelColorInput,
        deps.elements.displayTextColorInput,
        deps.elements.displayAccentColorInput,
        deps.elements.displayClockFaceColorInput
      ]) {
        addEventListener(input, "input", handleDisplayColorInput);
      }
    },

    destroy() {
      if (!started) {
        return;
      }

      started = false;
      for (const cleanup of cleanups.splice(0).reverse()) {
        cleanup();
      }
    },

    syncDisplayPreferenceControls,
    setDisplayPreferencesOpen,
    setDisplayMode
  };
}
