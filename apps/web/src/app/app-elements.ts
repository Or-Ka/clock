type AlertFormElements = {
  readonly enabled: HTMLInputElement;
  readonly sound: HTMLInputElement;
  readonly desktop: HTMLInputElement;
  readonly direction: HTMLSelectElement;
  readonly offset: HTMLInputElement;
  readonly unit: HTMLSelectElement;
};

export type AppElements = {
  readonly mount: HTMLElement;
  readonly status: HTMLElement;
  readonly clockPanel: HTMLElement;
  readonly timezoneSelect: HTMLSelectElement;
  readonly locationSelect: HTMLSelectElement;
  readonly dayTimesStatus: HTMLElement;
  readonly eventFormToggles: readonly HTMLButtonElement[];
  readonly addEventForms: readonly HTMLFormElement[];
  readonly eventForm: HTMLFormElement;
  readonly kindSelect: HTMLSelectElement;
  readonly titleInput: HTMLInputElement;
  readonly hourInput: HTMLInputElement;
  readonly minuteInput: HTMLInputElement;
  readonly eventAlertControls: AlertFormElements;
  readonly derivedForm: HTMLFormElement;
  readonly derivedTitleInput: HTMLInputElement;
  readonly derivedBaseSelect: HTMLSelectElement;
  readonly derivedDirectionSelect: HTMLSelectElement;
  readonly derivedOffsetInput: HTMLInputElement;
  readonly derivedOffsetUnitSelect: HTMLSelectElement;
  readonly derivedEventAlertControls: AlertFormElements;
  readonly derivedError: HTMLElement;
  readonly fixedDayTimeStatus: HTMLElement;
  readonly zmanitSetSelect: HTMLSelectElement;
  readonly zmanitSetStatus: HTMLElement;
  readonly zmanitSetForm: HTMLFormElement;
  readonly zmanitSetEditorSelect: HTMLSelectElement;
  readonly zmanitSetTitleInput: HTMLInputElement;
  readonly zmanitStartBaseSelect: HTMLSelectElement;
  readonly zmanitStartDirectionSelect: HTMLSelectElement;
  readonly zmanitStartOffsetInput: HTMLInputElement;
  readonly zmanitStartUnitSelect: HTMLSelectElement;
  readonly zmanitEndBaseSelect: HTMLSelectElement;
  readonly zmanitEndDirectionSelect: HTMLSelectElement;
  readonly zmanitEndOffsetInput: HTMLInputElement;
  readonly zmanitEndUnitSelect: HTMLSelectElement;
  readonly zmanitSetNewButton: HTMLButtonElement;
  readonly zmanitSetRemoveButton: HTMLButtonElement;
  readonly zmanitSetEditorStatus: HTMLElement;
  readonly eventList: HTMLTableSectionElement;
  readonly eventError: HTMLElement;
  readonly alertsEnabledInput: HTMLInputElement;
  readonly exportAppStateButton: HTMLButtonElement;
  readonly importAppStateButton: HTMLButtonElement;
  readonly importAppStateFileInput: HTMLInputElement;
  readonly importExportStatus: HTMLElement;
  readonly layerToggles: readonly HTMLInputElement[];
  readonly zmanitLayerToggle: HTMLInputElement;
  readonly managementTabs: readonly HTMLButtonElement[];
  readonly locationManagementPanel: HTMLElement;
  readonly eventsManagementPanel: HTMLElement;
  readonly displayPreferencesToggle: HTMLButtonElement;
  readonly displayPreferencesPanel: HTMLElement;
  readonly clockThemeSelect: HTMLSelectElement;
  readonly clockDialStyleSelect: HTMLSelectElement;
  readonly clockInnerRingInput: HTMLInputElement;
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

export function bindAppElements(root: ParentNode): AppElements {
  getRequiredElement<HTMLElement>(root, ".event-panel");

  return {
    mount: getRequiredElement<HTMLElement>(root, "#phase3-clock"),
    status: getRequiredElement<HTMLElement>(root, "#clock-status"),
    clockPanel: getRequiredElement<HTMLElement>(root, ".clock-panel"),
    timezoneSelect: getRequiredElement<HTMLSelectElement>(root, "#timezone"),
    locationSelect: getRequiredElement<HTMLSelectElement>(root, "#location"),
    dayTimesStatus: getRequiredElement<HTMLElement>(root, "#day-times-status"),
    eventFormToggles: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-event-form-toggle]")),
    addEventForms: Array.from(root.querySelectorAll<HTMLFormElement>("[data-add-event-form]")),
    eventForm: getRequiredElement<HTMLFormElement>(root, "#event-form"),
    kindSelect: getRequiredElement<HTMLSelectElement>(root, "#event-kind"),
    titleInput: getRequiredElement<HTMLInputElement>(root, "#event-title"),
    hourInput: getRequiredElement<HTMLInputElement>(root, "#event-hour"),
    minuteInput: getRequiredElement<HTMLInputElement>(root, "#event-minute"),
    eventAlertControls: {
      enabled: getRequiredElement<HTMLInputElement>(root, "#event-alert-enabled"),
      sound: getRequiredElement<HTMLInputElement>(root, "#event-alert-sound"),
      desktop: getRequiredElement<HTMLInputElement>(root, "#event-alert-desktop"),
      direction: getRequiredElement<HTMLSelectElement>(root, "#event-alert-direction"),
      offset: getRequiredElement<HTMLInputElement>(root, "#event-alert-offset"),
      unit: getRequiredElement<HTMLSelectElement>(root, "#event-alert-offset-unit")
    },
    derivedForm: getRequiredElement<HTMLFormElement>(root, "#derived-event-form"),
    derivedTitleInput: getRequiredElement<HTMLInputElement>(root, "#derived-event-title"),
    derivedBaseSelect: getRequiredElement<HTMLSelectElement>(root, "#derived-event-base"),
    derivedDirectionSelect: getRequiredElement<HTMLSelectElement>(root, "#derived-event-direction"),
    derivedOffsetInput: getRequiredElement<HTMLInputElement>(root, "#derived-event-offset"),
    derivedOffsetUnitSelect: getRequiredElement<HTMLSelectElement>(root, "#derived-event-offset-unit"),
    derivedEventAlertControls: {
      enabled: getRequiredElement<HTMLInputElement>(root, "#derived-event-alert-enabled"),
      sound: getRequiredElement<HTMLInputElement>(root, "#derived-event-alert-sound"),
      desktop: getRequiredElement<HTMLInputElement>(root, "#derived-event-alert-desktop"),
      direction: getRequiredElement<HTMLSelectElement>(root, "#derived-event-alert-direction"),
      offset: getRequiredElement<HTMLInputElement>(root, "#derived-event-alert-offset"),
      unit: getRequiredElement<HTMLSelectElement>(root, "#derived-event-alert-offset-unit")
    },
    derivedError: getRequiredElement<HTMLElement>(root, "#derived-event-error"),
    fixedDayTimeStatus: getRequiredElement<HTMLElement>(root, "#fixed-day-time-status"),
    zmanitSetSelect: getRequiredElement<HTMLSelectElement>(root, "#zmanit-set"),
    zmanitSetStatus: getRequiredElement<HTMLElement>(root, "#zmanit-set-status"),
    zmanitSetForm: getRequiredElement<HTMLFormElement>(root, "#zmanit-set-form"),
    zmanitSetEditorSelect: getRequiredElement<HTMLSelectElement>(root, "#zmanit-set-editor"),
    zmanitSetTitleInput: getRequiredElement<HTMLInputElement>(root, "#zmanit-set-title-input"),
    zmanitStartBaseSelect: getRequiredElement<HTMLSelectElement>(root, "#zmanit-start-base"),
    zmanitStartDirectionSelect: getRequiredElement<HTMLSelectElement>(root, "#zmanit-start-direction"),
    zmanitStartOffsetInput: getRequiredElement<HTMLInputElement>(root, "#zmanit-start-offset"),
    zmanitStartUnitSelect: getRequiredElement<HTMLSelectElement>(root, "#zmanit-start-unit"),
    zmanitEndBaseSelect: getRequiredElement<HTMLSelectElement>(root, "#zmanit-end-base"),
    zmanitEndDirectionSelect: getRequiredElement<HTMLSelectElement>(root, "#zmanit-end-direction"),
    zmanitEndOffsetInput: getRequiredElement<HTMLInputElement>(root, "#zmanit-end-offset"),
    zmanitEndUnitSelect: getRequiredElement<HTMLSelectElement>(root, "#zmanit-end-unit"),
    zmanitSetNewButton: getRequiredElement<HTMLButtonElement>(root, "#zmanit-set-new"),
    zmanitSetRemoveButton: getRequiredElement<HTMLButtonElement>(root, "#zmanit-set-delete"),
    zmanitSetEditorStatus: getRequiredElement<HTMLElement>(root, "#zmanit-set-editor-status"),
    eventList: getRequiredElement<HTMLTableSectionElement>(root, "#event-list"),
    eventError: getRequiredElement<HTMLElement>(root, "#event-error"),
    alertsEnabledInput: getRequiredElement<HTMLInputElement>(root, "#alerts-enabled"),
    exportAppStateButton: getRequiredElement<HTMLButtonElement>(root, "#export-app-state"),
    importAppStateButton: getRequiredElement<HTMLButtonElement>(root, "#import-app-state"),
    importAppStateFileInput: getRequiredElement<HTMLInputElement>(root, "#import-app-state-file"),
    importExportStatus: getRequiredElement<HTMLElement>(root, "#import-export-status"),
    layerToggles: Array.from(root.querySelectorAll<HTMLInputElement>("[data-layer-toggle]")),
    zmanitLayerToggle: getRequiredElement<HTMLInputElement>(root, "[data-zmanit-layer-toggle]"),
    managementTabs: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-management-tab]")),
    locationManagementPanel: getRequiredElement<HTMLElement>(root, "#location-management-panel"),
    eventsManagementPanel: getRequiredElement<HTMLElement>(root, "#events-management-panel"),
    displayPreferencesToggle: getRequiredElement<HTMLButtonElement>(root, "#display-preferences-toggle"),
    displayPreferencesPanel: getRequiredElement<HTMLElement>(root, "#display-preferences-panel"),
    clockThemeSelect: getRequiredElement<HTMLSelectElement>(root, "#clock-theme"),
    clockDialStyleSelect: getRequiredElement<HTMLSelectElement>(root, "#clock-dial-style"),
    clockInnerRingInput: getRequiredElement<HTMLInputElement>(root, "#clock-inner-ring"),
    displayTemplateSelect: getRequiredElement<HTMLSelectElement>(root, "#display-template"),
    displayModeSelect: getRequiredElement<HTMLSelectElement>(root, "#display-mode"),
    displayFontFamilySelect: getRequiredElement<HTMLSelectElement>(root, "#display-font-family"),
    displayFontScaleInput: getRequiredElement<HTMLInputElement>(root, "#display-font-scale"),
    displayClockScaleInput: getRequiredElement<HTMLInputElement>(root, "#display-clock-scale"),
    displayBackgroundColorInput: getRequiredElement<HTMLInputElement>(root, "#display-background-color"),
    displayPanelColorInput: getRequiredElement<HTMLInputElement>(root, "#display-panel-color"),
    displayTextColorInput: getRequiredElement<HTMLInputElement>(root, "#display-text-color"),
    displayAccentColorInput: getRequiredElement<HTMLInputElement>(root, "#display-accent-color"),
    displayClockFaceColorInput: getRequiredElement<HTMLInputElement>(root, "#display-clock-face-color")
  };
}

function getRequiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`חסר רכיב אפליקציה נדרש: ${selector}`);
  }

  return element;
}
