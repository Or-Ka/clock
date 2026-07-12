import type { AppElements } from "../app/app-elements.js";

export type SettingsElements = {
  readonly timezoneSelect: HTMLSelectElement;
  readonly locationSelect: HTMLSelectElement;
  readonly displayPreferencesToggle: HTMLButtonElement;
  readonly displayPreferencesPanel: HTMLElement;
  readonly displayTemplateSelect: HTMLSelectElement;
  readonly displayModeSelect: HTMLSelectElement;
  readonly displayFontFamilySelect: HTMLSelectElement;
  readonly displayFontScaleInput: HTMLInputElement;
  readonly displayClockScaleInput: HTMLInputElement;
  readonly displayBackgroundColorInput: HTMLInputElement;
  readonly displayPanelColorInput: HTMLInputElement;
  readonly displayTextColorInput: HTMLInputElement;
  readonly displayAccentColorInput: HTMLInputElement;
  readonly displayClockFaceColorInput: HTMLInputElement;
};

export function selectSettingsElements(elements: AppElements): SettingsElements {
  return {
    timezoneSelect: elements.timezoneSelect,
    locationSelect: elements.locationSelect,
    displayPreferencesToggle: elements.displayPreferencesToggle,
    displayPreferencesPanel: elements.displayPreferencesPanel,
    displayTemplateSelect: elements.displayTemplateSelect,
    displayModeSelect: elements.displayModeSelect,
    displayFontFamilySelect: elements.displayFontFamilySelect,
    displayFontScaleInput: elements.displayFontScaleInput,
    displayClockScaleInput: elements.displayClockScaleInput,
    displayBackgroundColorInput: elements.displayBackgroundColorInput,
    displayPanelColorInput: elements.displayPanelColorInput,
    displayTextColorInput: elements.displayTextColorInput,
    displayAccentColorInput: elements.displayAccentColorInput,
    displayClockFaceColorInput: elements.displayClockFaceColorInput
  };
}
