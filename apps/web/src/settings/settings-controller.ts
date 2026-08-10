import type { SettingsElements } from "./settings-elements.js";

export type SettingsDisplayMode = "fullMode" | "clockOnly" | "floatingClock";

export type SettingsDisplayPreferences = {
  readonly displayMode: SettingsDisplayMode;
  readonly fontScale: number;
  readonly clockScale: number;
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
  readonly getDisplayPreferences: () => TDisplayPreferences;
  readonly setDisplayPreferences: (next: TDisplayPreferences) => void;
  readonly isDisplayMode: (value: string) => value is SettingsDisplayMode;
  readonly persistDisplayMode: (displayMode: SettingsDisplayMode) => void;
  readonly onLocationChange: (locationId: string) => void;
  readonly applyDisplayPreferences: () => void;
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
    deps.elements.displayModeSelect.value = preferences.displayMode;
    deps.elements.displayFontScaleInput.value = String(preferences.fontScale);
    deps.elements.displayClockScaleInput.value = String(preferences.clockScale);
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

  function handleDisplayModeChange(): void {
    if (!deps.isDisplayMode(deps.elements.displayModeSelect.value)) {
      return;
    }

    setDisplayMode(deps.elements.displayModeSelect.value);
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
      addEventListener(deps.elements.displayModeSelect, "change", handleDisplayModeChange);
      addEventListener(deps.elements.displayFontScaleInput, "input", handleDisplayFontScaleInput);
      addEventListener(deps.elements.displayClockScaleInput, "input", handleDisplayClockScaleInput);
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
