import type { AppElements } from "../app/app-elements.js";

export type SettingsElements = {
  readonly timezoneSelect: HTMLSelectElement;
  readonly locationSelect: HTMLSelectElement;
  readonly displayPreferencesToggle: HTMLButtonElement;
  readonly displayPreferencesPanel: HTMLElement;
  readonly displayModeSelect: HTMLSelectElement;
  readonly displayFontScaleInput: HTMLInputElement;
  readonly displayClockScaleInput: HTMLInputElement;
};

export function selectSettingsElements(elements: AppElements): SettingsElements {
  return {
    timezoneSelect: elements.timezoneSelect,
    locationSelect: elements.locationSelect,
    displayPreferencesToggle: elements.displayPreferencesToggle,
    displayPreferencesPanel: elements.displayPreferencesPanel,
    displayModeSelect: elements.displayModeSelect,
    displayFontScaleInput: elements.displayFontScaleInput,
    displayClockScaleInput: elements.displayClockScaleInput
  };
}
