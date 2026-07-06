import {
  createLiveAnalogClock,
  projectInstantToStaticClockTime,
  resolveEventLayers,
  ringForTime,
  SunriseSunsetEventLayerProvider,
  SystemTimeSource,
  type ClockDateDisplayDetails,
  type EventLayerDefinition,
  type EventLayerKind,
  type InstantEventDefinition,
  type InstantEventKind,
  type ZmanitTick
} from "@clock/clock";

import { bindAppElements } from "./app/app-elements.js";
import { addDaysToDateKey, hebcalUrlForDate, parseHebcalDetails } from "./data/hebcal-service.js";
import { LOCATION_OPTIONS, getLocationById } from "./data/locations.js";
import { validateEventTime, validateNonNegativeOffset } from "./event-editor/event-validation.js";
import { EVENT_ICON_OPTIONS, createClockIcon, createHtmlIcon, type EventIconId } from "./ui/event-icons.js";

type DerivedBase = "sunrise" | "sunset" | `zmanit-${number}`;
type DerivedDirection = "before" | "after";
type EventOffsetUnit = "minutes" | "hours" | "zmanit-hours";
type DerivedOffsetUnit = EventOffsetUnit;
type EventAlertOffsetUnit = "minutes" | "hours";
type EventAlertDirection = "before" | "after";
type FixedDayTimeAnchorBase = "sunrise" | "sunset";
type FixedDayTimeBase = FixedDayTimeAnchorBase | "set-start" | "set-end";
type ZmanitTimeSetId = string;
type DisplayMode = "fullMode" | "clockOnly" | "floatingClock";
type DisplayTemplateId = "classic" | "night" | "paper" | "focus" | "festival";
type DisplayFontFamily = "system" | "serif" | "mono" | "rounded";
type EventVisualTone = "sunrise" | "sunset" | "custom";
type DerivedEventDefinition = {
  readonly id: string;
  readonly title: string;
  readonly base: DerivedBase;
  readonly direction: DerivedDirection;
  readonly offsetValue: number;
  readonly offsetUnit: DerivedOffsetUnit;
};

type FixedDayTimeDefinition = {
  readonly id: string;
  readonly title: string;
  readonly base: FixedDayTimeBase;
  readonly direction: DerivedDirection;
  readonly offsetValue: number;
  readonly offsetUnit: EventOffsetUnit;
  readonly zmanitSetId?: ZmanitTimeSetId;
};

type ZmanitSetBoundary = {
  readonly base: FixedDayTimeAnchorBase;
  readonly direction: DerivedDirection;
  readonly offsetValue: number;
  readonly offsetUnit: EventOffsetUnit;
};

type ZmanitTimeSetDefinition = {
  readonly id: ZmanitTimeSetId;
  readonly title: string;
  readonly startTime: ZmanitSetBoundary;
  readonly endTime: ZmanitSetBoundary;
  readonly fixedEvents: readonly FixedDayTimeDefinition[];
};

type ZmanitSetRange = {
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly zmanitHourSeconds: number;
};

type EventVisualStyle = {
  readonly icon: EventIconId;
  readonly color: string;
};

type FixedEventVisualPreset = {
  readonly icon: EventIconId;
  readonly tone: EventVisualTone;
};

type VisualEvent = {
  readonly id: string;
  readonly kind: InstantEventKind;
  readonly title: string;
  readonly hour: number;
  readonly minute: number;
  readonly second?: number;
  readonly ring: "outer" | "inner";
  readonly status: "past" | "next" | "future";
  readonly layerTitle?: string;
  readonly layerKind?: EventLayerKind;
  readonly description?: string;
};

type CountdownTarget = VisualEvent & {
  readonly targetType: "event" | "zmanit";
};

type ActiveCountdown = CountdownTarget & {
  readonly countdownColor?: string;
};

type EventAlertSettings = {
  readonly enabled: boolean;
  readonly sound: boolean;
  readonly desktop: boolean;
  readonly direction: EventAlertDirection;
  readonly offsetValue: number;
  readonly offsetUnit: EventAlertOffsetUnit;
};

type EventAlertGlobalSettings = {
  readonly enabled: boolean;
};

type AlertFormControls = {
  readonly enabled: HTMLInputElement;
  readonly sound: HTMLInputElement;
  readonly desktop: HTMLInputElement;
  readonly direction: HTMLSelectElement;
  readonly offset: HTMLInputElement;
  readonly unit: HTMLSelectElement;
};

type DocumentPictureInPictureApi = EventTarget & {
  readonly window?: Window;
  requestWindow(options: { readonly width: number; readonly height: number }): Promise<Window>;
};

type DisplayPreferences = {
  readonly templateId: DisplayTemplateId;
  readonly displayMode: DisplayMode;
  readonly fontFamily: DisplayFontFamily;
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
  readonly eventStyles: Record<InstantEventKind, EventVisualStyle>;
};

type AppExportState = {
  readonly version: 1;
  readonly exportedAt: string;
  readonly selectedLocationId: string;
  readonly selectedDefaultZmanitSetId: ZmanitTimeSetId;
  readonly zmanitTimeSets: readonly ZmanitTimeSetDefinition[];
  readonly personalEvents: readonly InstantEventDefinition[];
  readonly derivedEvents: readonly DerivedEventDefinition[];
  readonly fixedDayTimeEvents: readonly FixedDayTimeDefinition[];
  readonly displayPreferences: DisplayPreferences;
  readonly eventVisualOverrides: Record<string, EventVisualStyle>;
  readonly alertSettings: EventAlertGlobalSettings;
  readonly eventAlertOverrides: Record<string, EventAlertSettings>;
};

const DAY_TIMES_LAYER_ID = "day-times";
const PERSONAL_LAYER_ID = "personal";
const SPECIAL_LAYER_ID = "special";
const DEFAULT_FIXED_DAY_TIME_EVENTS: readonly FixedDayTimeDefinition[] = [
  { id: "alot-hashachar", title: "עלות השחר", base: "sunrise", direction: "before", offsetValue: 72, offsetUnit: "minutes" },
  { id: "talit-tefillin", title: "טלית ותפילין", base: "sunrise", direction: "before", offsetValue: 50, offsetUnit: "minutes" },
  { id: "sof-shema", title: "סוף זמן קריאת שמע", base: "set-start", direction: "after", offsetValue: 3, offsetUnit: "zmanit-hours", zmanitSetId: "alot-tzeit" },
  { id: "sof-tefila", title: "סוף זמן תפילה", base: "set-start", direction: "after", offsetValue: 4, offsetUnit: "zmanit-hours" },
  { id: "chatzot", title: "חצות", base: "set-start", direction: "after", offsetValue: 6, offsetUnit: "zmanit-hours" },
  { id: "plag-hamincha", title: "פלג המנחה", base: "set-end", direction: "before", offsetValue: 1.25, offsetUnit: "zmanit-hours" },
  { id: "tzeit-hakochavim", title: "צאת הכוכבים", base: "sunset", direction: "after", offsetValue: 18, offsetUnit: "minutes", zmanitSetId: "alot-tzeit" }
];
const DEFAULT_ZMANIT_SET_ID: ZmanitTimeSetId = "sunrise-sunset";
const DEFAULT_ZMANIT_TIME_SETS: readonly ZmanitTimeSetDefinition[] = [
  {
    id: "alot-tzeit",
    title: "עלות השחר עד צאת הכוכבים",
    startTime: { base: "sunrise", direction: "before", offsetValue: 72, offsetUnit: "minutes" },
    endTime: { base: "sunset", direction: "after", offsetValue: 18, offsetUnit: "minutes" },
    fixedEvents: DEFAULT_FIXED_DAY_TIME_EVENTS.filter((event) =>
      ["alot-hashachar", "sof-shema", "chatzot", "plag-hamincha", "tzeit-hakochavim"].includes(event.id)
    )
  },
  {
    id: "sunrise-sunset",
    title: "זריחה עד שקיעה",
    startTime: { base: "sunrise", direction: "after", offsetValue: 0, offsetUnit: "minutes" },
    endTime: { base: "sunset", direction: "after", offsetValue: 0, offsetUnit: "minutes" },
    fixedEvents: DEFAULT_FIXED_DAY_TIME_EVENTS
  }
];
const AUTOMATIC_SHABBAT_EVENTS: readonly (FixedDayTimeDefinition & { readonly weekdays: readonly number[] })[] = [
  { id: "candle-lighting", title: "הדלקת נרות", base: "sunset", direction: "before", offsetValue: 18, offsetUnit: "minutes", weekdays: [5] },
  { id: "shabbat-exit", title: "יציאת שבת", base: "sunset", direction: "after", offsetValue: 42, offsetUnit: "minutes", weekdays: [6] }
];
const FIXED_EVENT_VISUALS: Readonly<Record<string, FixedEventVisualPreset>> = {
  "api-sunrise": { icon: "sunrise", tone: "sunrise" },
  "api-sunset": { icon: "moon", tone: "sunset" },
  "fixed-alot-hashachar": { icon: "dawn", tone: "sunrise" },
  "fixed-talit-tefillin": { icon: "tefillin", tone: "sunrise" },
  "fixed-sof-shema": { icon: "open-book", tone: "sunrise" },
  "fixed-sof-tefila": { icon: "open-book", tone: "sunrise" },
  "fixed-chatzot": { icon: "half-disc", tone: "sunrise" },
  "fixed-plag-hamincha": { icon: "half-disc", tone: "sunset" },
  "fixed-tzeit-hakochavim": { icon: "stars", tone: "sunset" },
  "fixed-shabbat-candle-lighting": { icon: "candles", tone: "sunset" },
  "fixed-shabbat-shabbat-exit": { icon: "stars", tone: "sunset" }
};
const DISPLAY_FONT_STACKS: Record<DisplayFontFamily, string> = {
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif: "'Suez One', 'Frank Ruhl Libre', Georgia, 'Times New Roman', serif",
  mono: "'Cascadia Mono', 'SFMono-Regular', Consolas, monospace",
  rounded: "'Segoe UI Rounded', 'Arial Rounded MT Bold', system-ui, sans-serif"
};
const DISPLAY_MODE_STORAGE_KEY = "analog-event-clock-display-mode";
const LEGACY_DISPLAY_MODE_STORAGE_KEY = "dual-ring-events-display-mode";
const DEFAULT_EVENT_ALERT_SETTINGS: EventAlertSettings = {
  enabled: false,
  sound: true,
  desktop: false,
  direction: "before",
  offsetValue: 5,
  offsetUnit: "minutes"
};
const DISPLAY_TEMPLATES: Record<DisplayTemplateId, DisplayPreferences> = {
  classic: {
    templateId: "classic",
    displayMode: "fullMode",
    fontFamily: "system",
    fontScale: 100,
    clockScale: 100,
    backgroundColor: "#eef3f5",
    panelColor: "#ffffff",
    textColor: "#12202a",
    mutedColor: "#5d6f7d",
    accentColor: "#007c89",
    clockFaceColor: "#f8fbfc",
    clockStrokeColor: "#6a8793",
    clockHandColor: "#172a35",
    eventStyles: {
      sunrise: { icon: "sunrise", color: "#d88a00" },
      sunset: { icon: "moon", color: "#b4519f" },
      custom: { icon: "diamond", color: "#0088a3" }
    }
  },
  night: {
    templateId: "night",
    displayMode: "fullMode",
    fontFamily: "system",
    fontScale: 100,
    clockScale: 100,
    backgroundColor: "#0b1117",
    panelColor: "#101b26",
    textColor: "#e8eef5",
    mutedColor: "#a9b8c8",
    accentColor: "#8edbd0",
    clockFaceColor: "#101b26",
    clockStrokeColor: "#6f879b",
    clockHandColor: "#eef5fb",
    eventStyles: {
      sunrise: { icon: "sunrise", color: "#ffd400" },
      sunset: { icon: "moon", color: "#ff4fd8" },
      custom: { icon: "diamond", color: "#00e5ff" }
    }
  },
  paper: {
    templateId: "paper",
    displayMode: "fullMode",
    fontFamily: "serif",
    fontScale: 104,
    clockScale: 100,
    backgroundColor: "#f4f0e6",
    panelColor: "#fffaf0",
    textColor: "#2f2a20",
    mutedColor: "#746a5a",
    accentColor: "#8c5f2a",
    clockFaceColor: "#fff8e8",
    clockStrokeColor: "#9c7a4c",
    clockHandColor: "#3a2f21",
    eventStyles: {
      sunrise: { icon: "dawn", color: "#b56d12" },
      sunset: { icon: "moon", color: "#87517b" },
      custom: { icon: "spark", color: "#47727a" }
    }
  },
  focus: {
    templateId: "focus",
    displayMode: "fullMode",
    fontFamily: "mono",
    fontScale: 96,
    clockScale: 100,
    backgroundColor: "#f6f8fb",
    panelColor: "#ffffff",
    textColor: "#101418",
    mutedColor: "#52616f",
    accentColor: "#2251d1",
    clockFaceColor: "#ffffff",
    clockStrokeColor: "#1f2937",
    clockHandColor: "#111827",
    eventStyles: {
      sunrise: { icon: "sunrise", color: "#e07b00" },
      sunset: { icon: "moon", color: "#9b3bb3" },
      custom: { icon: "target", color: "#1769e0" }
    }
  },
  festival: {
    templateId: "festival",
    displayMode: "fullMode",
    fontFamily: "rounded",
    fontScale: 106,
    clockScale: 100,
    backgroundColor: "#15131b",
    panelColor: "#211b2a",
    textColor: "#fff6ea",
    mutedColor: "#d3c2d9",
    accentColor: "#f5bd4f",
    clockFaceColor: "#261d31",
    clockStrokeColor: "#f5bd4f",
    clockHandColor: "#fff6ea",
    eventStyles: {
      sunrise: { icon: "sunrise", color: "#ffc857" },
      sunset: { icon: "stars", color: "#f66fb5" },
      custom: { icon: "spark", color: "#62e6d7" }
    }
  }
};

const {
  mount,
  status,
  clockPanel,
  timezoneSelect,
  locationSelect,
  dayTimesStatus,
  eventFormToggles,
  addEventForms,
  eventForm,
  kindSelect,
  titleInput,
  hourInput,
  minuteInput,
  eventAlertControls,
  derivedForm,
  derivedTitleInput,
  derivedBaseSelect,
  derivedDirectionSelect,
  derivedOffsetInput,
  derivedOffsetUnitSelect,
  derivedEventAlertControls,
  derivedError,
  fixedDayTimeList,
  fixedDayTimeStatus,
  zmanitSetSelect,
  zmanitSetStatus,
  zmanitSetForm,
  zmanitSetEditorSelect,
  zmanitSetTitleInput,
  zmanitStartBaseSelect,
  zmanitStartDirectionSelect,
  zmanitStartOffsetInput,
  zmanitStartUnitSelect,
  zmanitEndBaseSelect,
  zmanitEndDirectionSelect,
  zmanitEndOffsetInput,
  zmanitEndUnitSelect,
  zmanitSetNewButton,
  zmanitSetRemoveButton,
  zmanitSetEditorStatus,
  eventList,
  eventError,
  alertsEnabledInput,
  exportAppStateButton,
  importAppStateButton,
  importAppStateFileInput,
  importExportStatus,
  layerToggles,
  zmanitLayerToggle,
  displayPreferencesToggle,
  displayPreferencesPanel,
  displayTemplateSelect,
  displayModeSelect,
  displayFontFamilySelect,
  displayFontScaleInput,
  displayClockScaleInput,
  displayBackgroundColorInput,
  displayPanelColorInput,
  displayTextColorInput,
  displayAccentColorInput,
  displayClockFaceColorInput
} = bindAppElements(document);
const eventVisualEditor = createEventVisualEditor();
const clockTooltip = createClockTooltip();
const timerActionMenu = createTimerActionMenu();
const clockContextMenu = createClockContextMenu();

const timeSource = new SystemTimeSource();
let selectedLocation = getLocationById(locationSelect.value);
let dayTimesAbortController: AbortController | undefined;
let dayTimesCacheKey = "";
let hebcalAbortController: AbortController | undefined;
let hebcalCacheKey = "";
let jewishDateDetails: ClockDateDisplayDetails = { observances: [] };
let zmanitTicks: ZmanitTick[] = [];
let zmanitTimeSets: ZmanitTimeSetDefinition[] = DEFAULT_ZMANIT_TIME_SETS.map(cloneZmanitTimeSet);
let selectedDefaultZmanitSetId: ZmanitTimeSetId = DEFAULT_ZMANIT_SET_ID;
let selectedEditorZmanitSetId: ZmanitTimeSetId = DEFAULT_ZMANIT_SET_ID;
let derivedEvents: DerivedEventDefinition[] = [];
let fixedDayTimeEvents: FixedDayTimeDefinition[] = [...DEFAULT_FIXED_DAY_TIME_EVENTS];
let displayPreferences = loadDisplayPreferences();
let eventVisualOverrides: Record<string, EventVisualStyle> = {};
let alertSettings: EventAlertGlobalSettings = { enabled: true };
let eventAlertOverrides: Record<string, EventAlertSettings> = {};
let firedAlertKeys = new Set<string>();
let floatingClockWindow: Window | undefined;
let activeVisualEventId: string | undefined;
let renderedEventsById = new Map<string, VisualEvent>();
let activeTooltipTarget: CountdownTarget | undefined;
let activeCountdowns: Record<string, ActiveCountdown> = {};
let clockVisualSyncFrame: number | undefined;
let eventLayers: EventLayerDefinition[] = [
  emptyDayTimesLayer(),
  {
    id: PERSONAL_LAYER_ID,
    title: "אירועים אישיים",
    kind: "personal",
    enabled: true,
    events: [
      { id: "standup-app", type: "instant", kind: "custom", title: "עמידה", hour: 9, minute: 15 },
      { id: "review-app", type: "instant", kind: "custom", title: "סקירה", hour: 15, minute: 0 },
      { id: "handoff-app", type: "instant", kind: "custom", title: "העברה", hour: 21, minute: 0 }
    ]
  },
  emptySpecialLayer()
];

syncTimeZoneToLocation();
renderZmanitSetControls();
syncDisplayPreferenceControls();
syncAlertGlobalControls();
applyDisplayPreferences();
renderFixedDayTimeControls();

const clock = createLiveAnalogClock({
  container: mount,
  timeSource,
  timeZone: timezoneSelect.value,
  eventLayers,
  dateDisplayDetails: () => jewishDateDetails
});
const clockEventObserver = new MutationObserver(scheduleClockEventVisualSync);
clockEventObserver.observe(mount, { childList: true, subtree: true });

clock.start();
syncEventList();
syncClockEventVisuals();
void refreshDayTimesLayer(true);
void refreshHebcalDetails(true);

locationSelect.addEventListener("change", () => {
  selectedLocation = getLocationById(locationSelect.value);
  syncTimeZoneToLocation();
  clock.setTimeZone(timezoneSelect.value);
  dayTimesCacheKey = "";
  hebcalCacheKey = "";
  void refreshDayTimesLayer(true);
  void refreshHebcalDetails(true);
});

for (const toggle of layerToggles) {
  toggle.addEventListener("change", () => {
    const layerId = toggle.dataset.layerToggle;
    if (layerId === undefined) {
      return;
    }

    eventLayers = eventLayers.map((layer) =>
      layer.id === layerId ? { ...layer, enabled: toggle.checked } : layer
    );
    applyEventLayers();
  });
}

zmanitLayerToggle.addEventListener("change", () => {
  clock.setZmanitTicks(zmanitLayerToggle.checked ? zmanitTicks : []);
});

zmanitSetSelect.addEventListener("change", () => {
  if (!isZmanitTimeSetId(zmanitSetSelect.value)) {
    return;
  }

  selectedDefaultZmanitSetId = zmanitSetSelect.value;
  syncZmanitSetStatus();
  renderFixedDayTimeControls();
  refreshDayTimeDerivedState();
});

zmanitSetEditorSelect.addEventListener("change", () => {
  if (!isZmanitTimeSetId(zmanitSetEditorSelect.value)) {
    return;
  }

  selectedEditorZmanitSetId = zmanitSetEditorSelect.value;
  syncZmanitSetEditorControls();
});

zmanitSetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveEditedZmanitSet();
});

zmanitSetNewButton.addEventListener("click", addZmanitSet);
zmanitSetRemoveButton.addEventListener("click", deleteEditedZmanitSet);

displayPreferencesToggle.addEventListener("click", () => {
  setDisplayPreferencesOpen(displayPreferencesPanel.hidden);
});

displayTemplateSelect.addEventListener("change", () => {
  if (!isDisplayTemplateId(displayTemplateSelect.value)) {
    return;
  }

  const currentMode = displayPreferences.displayMode;
  displayPreferences = { ...cloneDisplayPreferences(DISPLAY_TEMPLATES[displayTemplateSelect.value]), displayMode: currentMode };
  syncDisplayPreferenceControls();
  applyDisplayPreferences();
  syncEventList();
  syncClockEventVisuals();
});

displayModeSelect.addEventListener("change", () => {
  if (!isDisplayMode(displayModeSelect.value)) {
    return;
  }

  setDisplayMode(displayModeSelect.value);
});

alertsEnabledInput.addEventListener("change", () => {
  alertSettings = { enabled: alertsEnabledInput.checked };
  syncAlertGlobalControls();
  syncEventList();
});

exportAppStateButton.addEventListener("click", exportAppState);

importAppStateButton.addEventListener("click", () => {
  importAppStateFileInput.click();
});

importAppStateFileInput.addEventListener("change", (event) => {
  void importAppStateFromInput(event);
});

displayFontFamilySelect.addEventListener("change", () => {
  if (!isDisplayFontFamily(displayFontFamilySelect.value)) {
    return;
  }

  displayPreferences = { ...displayPreferences, fontFamily: displayFontFamilySelect.value };
  applyDisplayPreferences();
});

displayFontScaleInput.addEventListener("input", () => {
  displayPreferences = { ...displayPreferences, fontScale: Number(displayFontScaleInput.value) };
  applyDisplayPreferences();
});

displayClockScaleInput.addEventListener("input", () => {
  displayPreferences = { ...displayPreferences, clockScale: Number(displayClockScaleInput.value) };
  applyDisplayPreferences();
});

for (const input of [
  displayBackgroundColorInput,
  displayPanelColorInput,
  displayTextColorInput,
  displayAccentColorInput,
  displayClockFaceColorInput
]) {
  input.addEventListener("input", handleDisplayColorInput);
}

for (const toggle of eventFormToggles) {
  toggle.addEventListener("click", () => {
    const formName = toggle.dataset.eventFormToggle;
    if (formName === undefined) {
      return;
    }

    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    syncAddEventFormVisibility(isExpanded ? undefined : formName);
  });
}

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const validationError = validateEventForm();
  if (validationError) {
    eventError.textContent = validationError;
    return;
  }

  eventError.textContent = "";
  const title = titleInput.value.trim() || "אירוע";
  const eventId = createEventId();
  const nextEvent: InstantEventDefinition = {
    id: eventId,
    type: "instant",
    kind: kindSelect.value as InstantEventKind,
    title,
    hour: Number(hourInput.value),
    minute: Number(minuteInput.value)
  };
  const nextAlertSettings = readAlertFormSettings(eventAlertControls);
  eventAlertOverrides = { ...eventAlertOverrides, [eventId]: nextAlertSettings };
  requestDesktopPermissionIfNeeded(nextAlertSettings);

  eventLayers = eventLayers.map((layer) =>
    layer.id === PERSONAL_LAYER_ID ? { ...layer, events: [...layer.events, nextEvent] } : layer
  );
  syncAddEventFormVisibility(undefined);
  applyEventLayers();
});

derivedForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const validationError = validateDerivedEventForm();
  if (validationError) {
    derivedError.textContent = validationError;
    return;
  }

  derivedError.textContent = "";
  const eventId = `derived-${Date.now()}`;
  derivedEvents = [
    ...derivedEvents,
    {
      id: eventId,
      title: derivedTitleInput.value.trim() || "אירוע מיוחד",
      base: derivedBaseSelect.value as DerivedBase,
      direction: derivedDirectionSelect.value as DerivedDirection,
      offsetValue: Number(derivedOffsetInput.value),
      offsetUnit: derivedOffsetUnitSelect.value as DerivedOffsetUnit
    }
  ];
  const nextAlertSettings = readAlertFormSettings(derivedEventAlertControls);
  eventAlertOverrides = { ...eventAlertOverrides, [eventId]: nextAlertSettings };
  requestDesktopPermissionIfNeeded(nextAlertSettings);
  refreshSpecialLayer();
  syncAddEventFormVisibility(undefined);
  applyEventLayers();
});

fixedDayTimeList.addEventListener("input", handleFixedDayTimeControlEvent);
fixedDayTimeList.addEventListener("change", handleFixedDayTimeControlEvent);

eventList.addEventListener("click", (event) => {
  const visualButton = (event.target as Element).closest<HTMLButtonElement>("button[data-event-visual-id]");
  if (visualButton) {
    openEventVisualEditor(visualButton);
    return;
  }

  const button = (event.target as Element).closest<HTMLButtonElement>("button[data-event-id]");
  if (!button) {
    return;
  }

  derivedEvents = derivedEvents.filter((item) => item.id !== button.dataset.eventId);
  if (button.dataset.eventId !== undefined) {
    delete eventVisualOverrides[button.dataset.eventId];
    delete eventAlertOverrides[button.dataset.eventId];
  }
  eventLayers = eventLayers.map((layer) => ({
    ...layer,
    events: layer.events.filter((item) => item.id !== button.dataset.eventId)
  }));
  refreshSpecialLayer();
  applyEventLayers();
});
eventList.addEventListener("input", handleEventAlertControlEvent);
eventList.addEventListener("change", handleEventAlertControlEvent);

mount.addEventListener("pointerover", handleClockTooltipPointerOver);
mount.addEventListener("pointermove", handleClockTooltipPointerMove);
mount.addEventListener("pointerout", handleClockTooltipPointerOut);
mount.addEventListener("mouseover", handleClockTooltipPointerOver);
mount.addEventListener("mousemove", handleClockTooltipPointerMove);
mount.addEventListener("mouseout", handleClockTooltipPointerOut);
mount.addEventListener("click", handleClockTargetClick);
mount.addEventListener("contextmenu", handleClockContextMenu);
document.addEventListener("mousemove", handleDocumentClockMouseMove);

document.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (!eventVisualEditor.hidden && !eventVisualEditor.contains(target) && !eventList.contains(target)) {
    closeEventVisualEditor();
  }

  if (!timerActionMenu.hidden && !timerActionMenu.contains(target) && !mount.contains(target)) {
    closeTimerActionMenu();
  }

  if (!clockContextMenu.hidden && !clockContextMenu.contains(target) && !mount.contains(target)) {
    closeClockContextMenu();
  }

  if (
    !displayPreferencesPanel.hidden &&
    !displayPreferencesPanel.contains(target) &&
    !displayPreferencesToggle.contains(target)
  ) {
    setDisplayPreferencesOpen(false);
  }
});

const statusTimer = window.setInterval(() => {
  syncEventList();
  void refreshDayTimesLayer();
  void refreshHebcalDetails();
}, 30_000);
const visualTimer = window.setInterval(() => {
  syncCountdownLayer();
  refreshActiveTooltip();
  checkDueAlerts();
}, 1000);

window.addEventListener("beforeunload", destroyClock);

function renderZmanitSetControls(): void {
  zmanitSetSelect.replaceChildren(
    ...zmanitTimeSets.map((set) => createOption(set.id, set.title))
  );
  zmanitSetEditorSelect.replaceChildren(
    ...zmanitTimeSets.map((set) => createOption(set.id, set.title))
  );
  ensureSelectedZmanitSetIds();
  zmanitSetSelect.value = selectedDefaultZmanitSetId;
  zmanitSetEditorSelect.value = selectedEditorZmanitSetId;
  syncZmanitSetStatus();
  syncZmanitSetEditorControls();
}

function ensureSelectedZmanitSetIds(): void {
  if (zmanitTimeSets.length === 0) {
    zmanitTimeSets = DEFAULT_ZMANIT_TIME_SETS.map(cloneZmanitTimeSet);
  }

  if (!isZmanitTimeSetId(selectedDefaultZmanitSetId)) {
    selectedDefaultZmanitSetId = zmanitTimeSets[0]?.id ?? DEFAULT_ZMANIT_SET_ID;
  }

  if (!isZmanitTimeSetId(selectedEditorZmanitSetId)) {
    selectedEditorZmanitSetId = selectedDefaultZmanitSetId;
  }
}

function syncZmanitSetStatus(): void {
  const set = getZmanitTimeSetById(selectedDefaultZmanitSetId);
  zmanitSetStatus.textContent = `סט פעיל: ${set.title}. תחילה: ${displayZmanitBoundary(set.startTime)}, סוף: ${displayZmanitBoundary(set.endTime)}.`;
}

function syncZmanitSetEditorControls(): void {
  const set = getZmanitTimeSetById(selectedEditorZmanitSetId);
  zmanitSetTitleInput.value = set.title;
  syncZmanitBoundaryControls("start", set.startTime);
  syncZmanitBoundaryControls("end", set.endTime);
  zmanitSetRemoveButton.disabled = zmanitTimeSets.length <= 1;
  zmanitSetEditorStatus.textContent = `עורך: ${set.title}`;
}

function syncZmanitBoundaryControls(kind: "start" | "end", boundary: ZmanitSetBoundary): void {
  const controls = zmanitBoundaryControls(kind);
  controls.base.value = boundary.base;
  controls.direction.value = boundary.direction;
  controls.offset.value = String(boundary.offsetValue);
  controls.unit.value = boundary.offsetUnit;
}

function saveEditedZmanitSet(): void {
  const title = zmanitSetTitleInput.value.trim();
  if (title === "") {
    zmanitSetEditorStatus.textContent = "צריך שם לסט.";
    return;
  }

  const startTime = readZmanitBoundaryControls("start");
  const endTime = readZmanitBoundaryControls("end");
  if (startTime === undefined || endTime === undefined) {
    zmanitSetEditorStatus.textContent = "אחד מערכי תחילת או סוף הסט לא תקין.";
    return;
  }

  zmanitTimeSets = zmanitTimeSets.map((set) =>
    set.id === selectedEditorZmanitSetId ? { ...set, title, startTime, endTime } : set
  );
  renderZmanitSetControls();
  refreshDayTimeDerivedState();
  zmanitSetEditorStatus.textContent = `הסט ${title} נשמר.`;
}

function addZmanitSet(): void {
  const title = "סט שעות זמניות חדש";
  const nextSet: ZmanitTimeSetDefinition = {
    id: createZmanitSetId(),
    title,
    startTime: { base: "sunrise", direction: "after", offsetValue: 0, offsetUnit: "minutes" },
    endTime: { base: "sunset", direction: "after", offsetValue: 0, offsetUnit: "minutes" },
    fixedEvents: []
  };
  zmanitTimeSets = [...zmanitTimeSets, nextSet];
  selectedEditorZmanitSetId = nextSet.id;
  selectedDefaultZmanitSetId = nextSet.id;
  renderZmanitSetControls();
  refreshDayTimeDerivedState();
  zmanitSetTitleInput.focus();
  zmanitSetTitleInput.select();
}

function deleteEditedZmanitSet(): void {
  if (zmanitTimeSets.length <= 1) {
    zmanitSetEditorStatus.textContent = "אי אפשר למחוק את הסט האחרון.";
    return;
  }

  const deletedSet = getZmanitTimeSetById(selectedEditorZmanitSetId);
  zmanitTimeSets = zmanitTimeSets.filter((set) => set.id !== selectedEditorZmanitSetId);
  ensureSelectedZmanitSetIds();
  fixedDayTimeEvents = fixedDayTimeEvents.map(removeMissingZmanitSetReference);
  renderZmanitSetControls();
  renderFixedDayTimeControls();
  refreshDayTimeDerivedState();
  zmanitSetEditorStatus.textContent = `הסט ${deletedSet.title} נמחק.`;
}

function readZmanitBoundaryControls(kind: "start" | "end"): ZmanitSetBoundary | undefined {
  const controls = zmanitBoundaryControls(kind);
  if (
    !isFixedDayTimeAnchorBase(controls.base.value) ||
    !isDerivedDirection(controls.direction.value) ||
    !isEventOffsetUnit(controls.unit.value)
  ) {
    return undefined;
  }

  const offsetValue = Number(controls.offset.value);
  if (!Number.isFinite(offsetValue) || offsetValue < 0) {
    return undefined;
  }

  return {
    base: controls.base.value,
    direction: controls.direction.value,
    offsetValue,
    offsetUnit: controls.unit.value
  };
}

function zmanitBoundaryControls(kind: "start" | "end"): {
  readonly base: HTMLSelectElement;
  readonly direction: HTMLSelectElement;
  readonly offset: HTMLInputElement;
  readonly unit: HTMLSelectElement;
} {
  return kind === "start"
    ? {
        base: zmanitStartBaseSelect,
        direction: zmanitStartDirectionSelect,
        offset: zmanitStartOffsetInput,
        unit: zmanitStartUnitSelect
      }
    : {
        base: zmanitEndBaseSelect,
        direction: zmanitEndDirectionSelect,
        offset: zmanitEndOffsetInput,
        unit: zmanitEndUnitSelect
      };
}

function refreshDayTimeDerivedState(): void {
  refreshFixedDayTimeEvents();
  const dayTimesLayer = eventLayers.find((layer) => layer.id === DAY_TIMES_LAYER_ID);
  const dayEvents = dayTimesLayer?.events ?? [];
  zmanitTicks = createZmanitTicks(dayEvents, selectedDefaultZmanitSetId);
  clock.setZmanitTicks(zmanitLayerToggle.checked ? zmanitTicks : []);
  refreshSpecialLayer();
  applyEventLayers();
}

function syncDisplayPreferenceControls(): void {
  displayTemplateSelect.value = displayPreferences.templateId;
  displayModeSelect.value = displayPreferences.displayMode;
  displayFontFamilySelect.value = displayPreferences.fontFamily;
  displayFontScaleInput.value = String(displayPreferences.fontScale);
  displayClockScaleInput.value = String(displayPreferences.clockScale);
  displayBackgroundColorInput.value = displayPreferences.backgroundColor;
  displayPanelColorInput.value = displayPreferences.panelColor;
  displayTextColorInput.value = displayPreferences.textColor;
  displayAccentColorInput.value = displayPreferences.accentColor;
  displayClockFaceColorInput.value = displayPreferences.clockFaceColor;
}

function setDisplayPreferencesOpen(isOpen: boolean): void {
  displayPreferencesPanel.hidden = !isOpen;
  displayPreferencesToggle.setAttribute("aria-expanded", String(isOpen));
}

function applyDisplayPreferences(): void {
  const root = document.documentElement;
  root.dataset.displayTemplate = displayPreferences.templateId;
  root.dataset.displayMode = displayPreferences.displayMode;
  root.style.setProperty("--display-font-family", DISPLAY_FONT_STACKS[displayPreferences.fontFamily]);
  root.style.setProperty("--display-font-scale", `${displayPreferences.fontScale / 100}rem`);
  root.style.setProperty("--display-clock-size", `${round(680 * displayPreferences.clockScale / 100)}px`);
  root.style.setProperty("--display-clock-only-size", `${round(760 * displayPreferences.clockScale / 100)}px`);
  root.style.setProperty("--floating-clock-size", `${floatingClockPixelSize()}px`);
  root.style.setProperty("--clock-font-boost", String(clockFontBoost()));
  root.style.setProperty("--display-background-color", displayPreferences.backgroundColor);
  root.style.setProperty("--display-panel-color", displayPreferences.panelColor);
  root.style.setProperty("--display-text-color", displayPreferences.textColor);
  root.style.setProperty("--display-muted-color", displayPreferences.mutedColor);
  root.style.setProperty("--display-accent-color", displayPreferences.accentColor);
  root.style.setProperty("--display-clock-face-color", displayPreferences.clockFaceColor);
  root.style.setProperty("--display-clock-stroke-color", displayPreferences.clockStrokeColor);
  root.style.setProperty("--display-clock-hand-color", displayPreferences.clockHandColor);
  root.style.setProperty("--event-sunrise-color", displayPreferences.eventStyles.sunrise.color);
  root.style.setProperty("--event-sunset-color", displayPreferences.eventStyles.sunset.color);
  root.style.setProperty("--event-custom-color", displayPreferences.eventStyles.custom.color);
  syncFloatingClockWindowStyles();
  syncCountdownLayer();
  refreshActiveTooltip();
}

function setDisplayMode(displayMode: DisplayMode): void {
  displayPreferences = { ...displayPreferences, displayMode };
  persistDisplayMode(displayMode);
  syncDisplayPreferenceControls();
  applyDisplayPreferences();
  syncFloatingClockMode();
  closeClockContextMenu();
  if (displayMode === "clockOnly" || displayMode === "floatingClock") {
    setDisplayPreferencesOpen(false);
    closeEventVisualEditor();
    closeTimerActionMenu();
  }
}

function handleDisplayColorInput(): void {
  displayPreferences = {
    ...displayPreferences,
    backgroundColor: displayBackgroundColorInput.value,
    panelColor: displayPanelColorInput.value,
    textColor: displayTextColorInput.value,
    accentColor: displayAccentColorInput.value,
    clockFaceColor: displayClockFaceColorInput.value
  };
  applyDisplayPreferences();
  syncClockEventVisuals();
}

function syncFloatingClockMode(): void {
  if (displayPreferences.displayMode === "floatingClock") {
    void openFloatingClockWindow();
    return;
  }

  closeFloatingClockWindow();
}

async function openFloatingClockWindow(): Promise<void> {
  if (floatingClockWindow !== undefined && !floatingClockWindow.closed) {
    syncFloatingClockWindowStyles();
    return;
  }

  const pictureInPicture = documentPictureInPictureApi();
  if (pictureInPicture === undefined) {
    importExportStatus.textContent = "הדפדפן לא תומך בשעון צף מעל כל החלונות; מוצגת גרסה צפה בתוך העמוד.";
    return;
  }

  try {
    const nextWindow = await pictureInPicture.requestWindow({ width: floatingClockPixelSize(), height: floatingClockPixelSize() });
    floatingClockWindow = nextWindow;
    prepareFloatingClockWindow(nextWindow);
  } catch {
    floatingClockWindow = undefined;
    restoreFloatingClockToMainDocument();
    importExportStatus.textContent = "כדי לפתוח שעון צף אמיתי צריך לבחור את המצב מתוך פעולה ישירה במסך.";
  }
}

function prepareFloatingClockWindow(pipWindow: Window): void {
  const pipDocument = pipWindow.document;
  pipDocument.documentElement.lang = document.documentElement.lang;
  pipDocument.documentElement.dir = document.documentElement.dir;
  pipDocument.title = "שעון צף";
  pipDocument.head.replaceChildren(...floatingClockStyleNodes(), createFloatingClockWindowStyle());
  pipDocument.body.replaceChildren(mount, clockTooltip, timerActionMenu, clockContextMenu);
  pipDocument.addEventListener("mousemove", handleDocumentClockMouseMove);
  pipWindow.addEventListener("pagehide", () => handleFloatingClockWindowClosed(pipWindow), { once: true });
  syncFloatingClockWindowStyles();
  syncCountdownLayer();
  refreshActiveTooltip();
}

function handleFloatingClockWindowClosed(pipWindow: Window): void {
  pipWindow.document.removeEventListener("mousemove", handleDocumentClockMouseMove);
  if (floatingClockWindow === pipWindow) {
    floatingClockWindow = undefined;
  }
  restoreFloatingClockToMainDocument();
  syncCountdownLayer();
  refreshActiveTooltip();
}

function closeFloatingClockWindow(): void {
  const pipWindow = floatingClockWindow;
  floatingClockWindow = undefined;
  restoreFloatingClockToMainDocument();
  if (pipWindow !== undefined && !pipWindow.closed) {
    pipWindow.close();
  }
}

function restoreFloatingClockToMainDocument(): void {
  if (mount.ownerDocument !== document) {
    clockPanel.append(mount);
  }
  for (const overlay of [clockTooltip, timerActionMenu, clockContextMenu]) {
    if (overlay.ownerDocument !== document) {
      document.body.append(overlay);
    }
  }
}

function syncFloatingClockWindowStyles(): void {
  if (floatingClockWindow === undefined || floatingClockWindow.closed) {
    return;
  }

  const pipRoot = floatingClockWindow.document.documentElement;
  const sourceRoot = document.documentElement;
  pipRoot.dataset.displayTemplate = displayPreferences.templateId;
  pipRoot.dataset.displayMode = "floatingClock";
  pipRoot.dataset.floatingClockWindow = "true";
  for (const property of [
    "--display-font-family",
    "--display-font-scale",
    "--display-clock-size",
    "--display-clock-only-size",
    "--floating-clock-size",
    "--clock-font-boost",
    "--display-background-color",
    "--display-panel-color",
    "--display-text-color",
    "--display-muted-color",
    "--display-accent-color",
    "--display-clock-face-color",
    "--display-clock-stroke-color",
    "--display-clock-hand-color",
    "--event-sunrise-color",
    "--event-sunset-color",
    "--event-custom-color"
  ]) {
    pipRoot.style.setProperty(property, sourceRoot.style.getPropertyValue(property));
  }
  try {
    floatingClockWindow.resizeTo(floatingClockPixelSize(), floatingClockPixelSize());
  } catch {
    // Some browsers keep Document Picture-in-Picture window size user-controlled after opening.
  }
}

function floatingClockStyleNodes(): Node[] {
  return Array.from(document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style')).map(
    (node) => {
      const clone = node.cloneNode(true);
      if (node instanceof HTMLLinkElement && clone instanceof HTMLLinkElement) {
        clone.href = node.href;
      }
      return clone;
    }
  );
}

function createFloatingClockWindowStyle(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    html[data-floating-clock-window="true"],
    html[data-floating-clock-window="true"] body {
      width: var(--floating-clock-size);
      height: var(--floating-clock-size);
      margin: 0;
      overflow: hidden;
      background: transparent;
    }

    html[data-floating-clock-window="true"] .clock-mount {
      position: static;
      width: var(--floating-clock-size);
      min-width: var(--floating-clock-size);
      max-width: var(--floating-clock-size);
      height: var(--floating-clock-size);
      margin: 0;
    }

    html[data-floating-clock-window="true"] .clock-mount svg {
      width: var(--floating-clock-size);
      height: var(--floating-clock-size);
      filter: none;
    }

    html[data-floating-clock-window="true"] .clock-context-menu,
    html[data-floating-clock-window="true"] .timer-action-menu,
    html[data-floating-clock-window="true"] .clock-event-tooltip {
      max-width: calc(100vw - 12px);
      font-size: 0.74rem;
    }
  `;
  return style;
}

function documentPictureInPictureApi(): DocumentPictureInPictureApi | undefined {
  return (window as Window & { readonly documentPictureInPicture?: DocumentPictureInPictureApi })
    .documentPictureInPicture;
}

function floatingClockPixelSize(): number {
  return Math.max(140, Math.min(260, Math.round(200 * displayPreferences.clockScale / 100)));
}

function clockFontBoost(): number {
  return round(1 + Math.max(0, 100 - displayPreferences.clockScale) / 220);
}

function syncAlertGlobalControls(): void {
  alertsEnabledInput.checked = alertSettings.enabled;
  alertsEnabledInput.setAttribute("aria-checked", String(alertSettings.enabled));
  importExportStatus.textContent = alertSettings.enabled ? "התראות פעילות." : "התראות מושבתות לכל האירועים.";
}

function readAlertFormSettings(controls: AlertFormControls): EventAlertSettings {
  return {
    enabled: controls.enabled.checked,
    sound: controls.sound.checked,
    desktop: controls.desktop.checked,
    direction: isEventAlertDirection(controls.direction.value) ? controls.direction.value : "before",
    offsetValue: Math.max(0, Number(controls.offset.value)),
    offsetUnit: isEventAlertOffsetUnit(controls.unit.value) ? controls.unit.value : "minutes"
  };
}

function eventAlertSettingsForEventId(eventId: string): EventAlertSettings {
  return cloneEventAlertSettings(eventAlertOverrides[eventId] ?? DEFAULT_EVENT_ALERT_SETTINGS);
}

function cloneEventAlertSettings(settings: EventAlertSettings): EventAlertSettings {
  return { ...settings };
}

function createEventAlertControls(event: VisualEvent): HTMLDivElement {
  const settings = eventAlertSettingsForEventId(event.id);
  const controls = document.createElement("div");
  controls.className = "event-alert-controls";
  controls.dataset.eventAlertId = event.id;

  controls.append(
    createEventAlertCheckbox(event, "enabled", settings.enabled, "התראה"),
    createEventAlertCheckbox(event, "sound", settings.sound, "קול"),
    createEventAlertCheckbox(event, "desktop", settings.desktop, "דסקטופ"),
    createEventAlertSelect(event, "direction", settings.direction, [
      ["before", "לפני"],
      ["after", "אחרי"]
    ]),
    createEventAlertNumberInput(event, settings.offsetValue),
    createEventAlertSelect(event, "offsetUnit", settings.offsetUnit, [
      ["minutes", "דקות"],
      ["hours", "שעות"]
    ])
  );

  return controls;
}

function createEventAlertCheckbox(
  event: VisualEvent,
  field: "enabled" | "sound" | "desktop",
  checked: boolean,
  labelText: string
): HTMLLabelElement {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.dataset.eventAlertField = field;
  input.ariaLabel = `${labelText} עבור ${event.title}`;

  const label = document.createElement("label");
  label.className = "event-alert-check";
  label.append(input, document.createTextNode(labelText));
  return label;
}

function createEventAlertSelect(
  event: VisualEvent,
  field: "direction" | "offsetUnit",
  value: string,
  options: readonly (readonly [string, string])[]
): HTMLSelectElement {
  const select = document.createElement("select");
  select.dataset.eventAlertField = field;
  select.ariaLabel = `${field === "direction" ? "תזמון" : "יחידת זמן"} התראה עבור ${event.title}`;
  select.replaceChildren(...options.map(([optionValue, label]) => createOption(optionValue, label)));
  select.value = value;
  return select;
}

function createEventAlertNumberInput(event: VisualEvent, value: number): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.inputMode = "numeric";
  input.value = String(value);
  input.dataset.eventAlertField = "offsetValue";
  input.ariaLabel = `כמה זמן מהאירוע עבור ${event.title}`;
  return input;
}

function handleEventAlertControlEvent(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
    return;
  }

  const container = target.closest<HTMLElement>("[data-event-alert-id]");
  const eventId = container?.dataset.eventAlertId;
  const field = target.dataset.eventAlertField;
  if (eventId === undefined || field === undefined) {
    return;
  }

  const current = eventAlertSettingsForEventId(eventId);
  let next = current;
  if (field === "enabled" && target instanceof HTMLInputElement) {
    next = { ...current, enabled: target.checked };
  } else if (field === "sound" && target instanceof HTMLInputElement) {
    next = { ...current, sound: target.checked };
  } else if (field === "desktop" && target instanceof HTMLInputElement) {
    next = { ...current, desktop: target.checked };
  } else if (field === "direction" && isEventAlertDirection(target.value)) {
    next = { ...current, direction: target.value };
  } else if (field === "offsetUnit" && isEventAlertOffsetUnit(target.value)) {
    next = { ...current, offsetUnit: target.value };
  } else if (field === "offsetValue") {
    next = { ...current, offsetValue: Math.max(0, Number(target.value)) };
  }

  eventAlertOverrides = { ...eventAlertOverrides, [eventId]: next };
  requestDesktopPermissionIfNeeded(next);
}

function eventVisualForEvent(event: Pick<VisualEvent, "id" | "kind">): EventVisualStyle {
  const override = eventVisualOverrides[event.id];
  if (override !== undefined) {
    return override;
  }

  const fixedPreset = FIXED_EVENT_VISUALS[event.id];
  if (fixedPreset !== undefined) {
    return {
      icon: fixedPreset.icon,
      color: colorForEventTone(fixedPreset.tone)
    };
  }

  const derivedEvent = derivedEvents.find((definition) => definition.id === event.id);
  if (derivedEvent !== undefined) {
    return {
      icon: displayPreferences.eventStyles.custom.icon,
      color: colorForEventTone(derivedEvent.base === "sunset" ? "sunset" : "sunrise")
    };
  }

  return displayPreferences.eventStyles[event.kind];
}

function colorForEventTone(tone: EventVisualTone): string {
  if (tone === "sunrise") {
    return displayPreferences.eventStyles.sunrise.color;
  }
  if (tone === "sunset") {
    return displayPreferences.eventStyles.sunset.color;
  }
  return displayPreferences.eventStyles.custom.color;
}

function createEventVisualEditor(): HTMLDivElement {
  const editor = document.createElement("div");
  editor.className = "event-visual-editor";
  editor.hidden = true;
  editor.setAttribute("role", "dialog");
  editor.setAttribute("aria-label", "בחירת סמל וצבע לאירוע");

  const symbolLabel = document.createElement("label");
  symbolLabel.textContent = "אייקון";
  const iconSelect = document.createElement("select");
  iconSelect.dataset.eventVisualEditorIcon = "true";
  iconSelect.append(...EVENT_ICON_OPTIONS.map((option) => createOption(option.id, option.label)));
  symbolLabel.append(iconSelect);

  const colorLabel = document.createElement("label");
  colorLabel.textContent = "צבע";
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.dataset.eventVisualEditorColor = "true";
  colorLabel.append(colorInput);

  iconSelect.addEventListener("change", updateActiveEventVisualFromEditor);
  colorInput.addEventListener("input", updateActiveEventVisualFromEditor);

  editor.append(symbolLabel, colorLabel);
  document.body.append(editor);
  return editor;
}

function openEventVisualEditor(button: HTMLButtonElement): void {
  const eventId = button.dataset.eventVisualId;
  if (eventId === undefined) {
    return;
  }

  const event = renderedEventsById.get(eventId);
  if (event === undefined) {
    return;
  }

  activeVisualEventId = eventId;
  const visual = eventVisualForEvent(event);
  const iconSelect = getEventVisualEditorIconSelect();
  const colorInput = getEventVisualEditorColorInput();
  iconSelect.value = visual.icon;
  colorInput.value = visual.color;

  const rect = button.getBoundingClientRect();
  eventVisualEditor.hidden = false;
  eventVisualEditor.style.insetInlineStart = `${Math.max(8, rect.left)}px`;
  eventVisualEditor.style.top = `${Math.min(window.innerHeight - 128, rect.bottom + 8)}px`;
  iconSelect.focus();
}

function closeEventVisualEditor(): void {
  activeVisualEventId = undefined;
  eventVisualEditor.hidden = true;
}

function updateActiveEventVisualFromEditor(): void {
  if (activeVisualEventId === undefined) {
    return;
  }

  const event = renderedEventsById.get(activeVisualEventId);
  if (event === undefined) {
    closeEventVisualEditor();
    return;
  }

  const icon = getEventVisualEditorIconSelect().value;
  const color = getEventVisualEditorColorInput().value;
  if (!isEventIconId(icon)) {
    return;
  }

  eventVisualOverrides = {
    ...eventVisualOverrides,
    [activeVisualEventId]: { icon, color }
  };
  syncEventList();
  syncClockEventVisuals();
}

function getEventVisualEditorIconSelect(): HTMLSelectElement {
  return getRequiredChild<HTMLSelectElement>(eventVisualEditor, "[data-event-visual-editor-icon]");
}

function getEventVisualEditorColorInput(): HTMLInputElement {
  return getRequiredChild<HTMLInputElement>(eventVisualEditor, "[data-event-visual-editor-color]");
}

function scheduleClockEventVisualSync(): void {
  if (clockVisualSyncFrame !== undefined) {
    return;
  }

  clockVisualSyncFrame = window.requestAnimationFrame(() => {
    clockVisualSyncFrame = undefined;
    syncClockEventVisuals();
  });
}

function syncClockEventVisuals(): void {
  for (const marker of Array.from(mount.querySelectorAll<SVGGElement>('[data-clock-part="event-marker"]'))) {
    const eventId = marker.dataset.eventId;
    const event = eventId === undefined ? undefined : renderedEventsById.get(eventId);
    if (event === undefined) {
      continue;
    }

    const visual = eventVisualForEvent(event);
    const line = marker.querySelector<SVGLineElement>("line");
    const existingSymbol = marker.querySelector('[data-clock-part="event-symbol"]');

    marker.dataset.eventIcon = visual.icon;
    marker.dataset.eventColor = visual.color;
    marker.style.setProperty("--event-marker-color", visual.color);
    line?.style.setProperty("stroke", visual.color);

    if (line === null) {
      continue;
    }

    const x = line.getAttribute("x2") ?? "100";
    const y = line.getAttribute("y2") ?? "100";
    if (existingSymbol !== null && existingSymbol.getAttribute("data-event-icon") === visual.icon) {
      existingSymbol.setAttribute("transform", `translate(${x} ${y}) scale(0.34) translate(-12 -12)`);
      existingSymbol.setAttribute("color", visual.color);
      continue;
    }

    existingSymbol?.remove();
    const symbol = createClockIcon(visual.icon, x, y, visual.color);
    symbol.dataset.eventIcon = visual.icon;
    marker.append(symbol);
  }
}

function createClockTooltip(): HTMLDivElement {
  const tooltip = document.createElement("div");
  tooltip.className = "clock-event-tooltip";
  tooltip.hidden = true;
  tooltip.setAttribute("role", "tooltip");
  document.body.append(tooltip);
  return tooltip;
}

function handleClockTooltipPointerOver(event: MouseEvent): void {
  const target = targetFromElement(event.target);
  if (target === undefined) {
    return;
  }

  activeTooltipTarget = target;
  renderClockTooltip(target);
  positionClockTooltip(event);
}

function handleClockTooltipPointerMove(event: MouseEvent): void {
  if (activeTooltipTarget === undefined) {
    return;
  }

  positionClockTooltip(event);
}

function handleDocumentClockMouseMove(event: MouseEvent): void {
  const eventDocument = eventDocumentFromMouseEvent(event);
  const element = eventDocument.elementFromPoint(event.clientX, event.clientY);
  if (element === null || !mount.contains(element)) {
    if (!clockTooltip.hidden) {
      activeTooltipTarget = undefined;
      clockTooltip.hidden = true;
    }
    return;
  }

  const target = targetFromElement(element);
  if (target === undefined) {
    return;
  }

  activeTooltipTarget = target;
  renderClockTooltip(target);
  positionClockTooltip(event);
}

function handleClockTooltipPointerOut(event: MouseEvent): void {
  const source = clockTargetElementFromEventTarget(event.target);
  if (source === null) {
    return;
  }

  const relatedTarget = event.relatedTarget;
  if (relatedTarget instanceof Node && source.contains(relatedTarget)) {
    return;
  }

  activeTooltipTarget = undefined;
  clockTooltip.hidden = true;
}

function renderClockTooltip(target: CountdownTarget): void {
  const visual = eventVisualForEvent(target);
  const title = document.createElement("div");
  title.className = "clock-event-tooltip-title";

  const symbol = document.createElement("span");
  symbol.className = "clock-event-tooltip-symbol";
  symbol.style.setProperty("--event-symbol-color", visual.color);
  symbol.replaceChildren(createHtmlIcon(visual.icon));

  const name = document.createElement("strong");
  name.textContent = target.title;
  title.append(symbol, name);

  const meta = document.createElement("div");
  meta.className = "clock-event-tooltip-meta";
  meta.textContent = `${formatEventTime(target)} | ${displayRing(target.ring)} | ${displayStatus(target.status)}`;

  const layer = document.createElement("div");
  layer.className = "clock-event-tooltip-layer";
  layer.textContent = target.layerTitle ?? displayLayerKind(target.layerKind);

  clockTooltip.replaceChildren(title, meta, layer);
  if (target.description !== undefined) {
    const description = document.createElement("div");
    description.className = "clock-event-tooltip-description";
    description.textContent = target.description;
    clockTooltip.append(description);
  }

  const remainingSeconds = secondsUntilTarget(target);
  if (remainingSeconds > 0) {
    const countdown = document.createElement("div");
    countdown.className = "clock-event-tooltip-countdown";
    countdown.textContent = `זמן שנותר עד ${target.title}: ${formatRemainingTime(remainingSeconds)}`;
    clockTooltip.append(countdown);
  }

  clockTooltip.hidden = false;
}

function refreshActiveTooltip(): void {
  if (activeTooltipTarget === undefined || clockTooltip.hidden) {
    return;
  }

  const freshTarget = countdownTargetById(activeTooltipTarget.id) ?? activeTooltipTarget;
  activeTooltipTarget = freshTarget;
  renderClockTooltip(freshTarget);
}

function positionClockTooltip(event: MouseEvent): void {
  const margin = 12;
  const tooltipRect = clockTooltip.getBoundingClientRect();
  const hostWindow = overlayWindow(clockTooltip);
  const x = Math.min(hostWindow.innerWidth - tooltipRect.width - margin, Math.max(margin, event.clientX + margin));
  const y = Math.min(hostWindow.innerHeight - tooltipRect.height - margin, Math.max(margin, event.clientY + margin));
  clockTooltip.style.left = `${x}px`;
  clockTooltip.style.top = `${y}px`;
}

function handleClockTargetClick(event: MouseEvent): void {
  const element = clockTargetElementFromEventTarget(event.target);
  if (element === null) {
    return;
  }

  const target = targetFromElement(element);
  if (target === undefined) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (element.dataset.clockPart === "countdown-arc") {
    openTimerActionMenu(target, "hide", event.clientX, event.clientY);
    return;
  }

  if (secondsUntilTarget(target) <= 0) {
    return;
  }

  openTimerActionMenu(target, activeCountdowns[target.id] === undefined ? "show" : "hide", event.clientX, event.clientY);
}

function createTimerActionMenu(): HTMLDivElement {
  const menu = document.createElement("div");
  menu.className = "timer-action-menu";
  menu.hidden = true;
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-label", "פעולת טיימר");
  document.body.append(menu);
  return menu;
}

function createClockContextMenu(): HTMLDivElement {
  const menu = document.createElement("div");
  menu.className = "clock-context-menu";
  menu.hidden = true;
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "תפריט תצוגת שעון");
  document.body.append(menu);
  return menu;
}

function handleClockContextMenu(event: MouseEvent): void {
  event.preventDefault();
  closeTimerActionMenu();
  closeEventVisualEditor();
  openClockContextMenu(event.clientX, event.clientY);
}

function openClockContextMenu(x: number, y: number): void {
  const currentMode = displayPreferences.displayMode;
  const fullMode = createClockContextMenuButton("מעבר למצב מלא", () => setDisplayMode("fullMode"));
  const clockOnly = createClockContextMenuButton("מעבר לשעון בלבד", () => setDisplayMode("clockOnly"));
  const floatingClock = createClockContextMenuButton("מעבר לשעון צף", () => setDisplayMode("floatingClock"));
  const preferences = createClockContextMenuButton("העדפות תצוגה", () => {
    setDisplayMode("fullMode");
    setDisplayPreferencesOpen(true);
    closeClockContextMenu();
  });

  const title = document.createElement("p");
  title.textContent = displayModeLabel(currentMode);
  clockContextMenu.replaceChildren(title, fullMode, clockOnly, floatingClock, preferences);
  clockContextMenu.hidden = false;
  const hostWindow = overlayWindow(clockContextMenu);
  const menuWidth = Math.min(220, Math.max(120, hostWindow.innerWidth - 12));
  clockContextMenu.style.width = `${menuWidth}px`;
  clockContextMenu.style.left = `${Math.min(hostWindow.innerWidth - menuWidth - 6, Math.max(6, x + 10))}px`;
  clockContextMenu.style.top = `${Math.min(hostWindow.innerHeight - 220, Math.max(8, y + 10))}px`;
  const activeButton =
    currentMode === "fullMode" ? fullMode : currentMode === "clockOnly" ? clockOnly : floatingClock;
  activeButton.disabled = true;
  activeButton.focus();
}

function createClockContextMenuButton(label: string, action: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("role", "menuitem");
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function closeClockContextMenu(): void {
  clockContextMenu.hidden = true;
}

function openTimerActionMenu(target: CountdownTarget, action: "show" | "hide", x: number, y: number): void {
  const question = document.createElement("p");
  question.textContent =
    action === "show" ? `להציג טיימר עד ${target.title}?` : `להסתיר את הטיימר עד ${target.title}?`;

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = activeCountdowns[target.id]?.countdownColor ?? eventVisualForEvent(target).color;

  const colorControl = document.createElement("label");
  colorControl.className = "timer-action-menu-color";
  colorControl.textContent = "צבע קשת";
  colorControl.append(colorInput);

  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.textContent = action === "show" ? "הצג" : "הסתר";
  confirm.addEventListener("click", () => {
    if (action === "show") {
      activeCountdowns = { ...activeCountdowns, [target.id]: { ...target, countdownColor: colorInput.value } };
    } else {
      const { [target.id]: _removed, ...remaining } = activeCountdowns;
      activeCountdowns = remaining;
    }
    closeTimerActionMenu();
    syncCountdownLayer();
  });

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "בטל";
  cancel.addEventListener("click", closeTimerActionMenu);

  const actions = document.createElement("div");
  actions.className = "timer-action-menu-actions";
  actions.append(confirm, cancel);

  timerActionMenu.replaceChildren(...(action === "show" ? [question, colorControl, actions] : [question, actions]));
  timerActionMenu.hidden = false;
  const hostWindow = overlayWindow(timerActionMenu);
  const menuWidth = Math.min(220, Math.max(120, hostWindow.innerWidth - 12));
  timerActionMenu.style.width = `${menuWidth}px`;
  timerActionMenu.style.left = `${Math.min(hostWindow.innerWidth - menuWidth - 6, Math.max(6, x + 10))}px`;
  timerActionMenu.style.top = `${Math.min(hostWindow.innerHeight - 120, Math.max(8, y + 10))}px`;
  confirm.focus();
}

function closeTimerActionMenu(): void {
  timerActionMenu.hidden = true;
}

function syncCountdownLayer(): void {
  const svg = mount.querySelector<SVGSVGElement>("svg");
  if (svg === null) {
    return;
  }

  const layer = ensureCountdownLayer(svg);
  const activeTargets = Object.values(activeCountdowns).flatMap((target) => {
    const freshTarget = countdownTargetById(target.id) ?? target;
    const activeTarget: ActiveCountdown =
      target.countdownColor === undefined ? freshTarget : { ...freshTarget, countdownColor: target.countdownColor };
    return secondsUntilTarget(activeTarget) <= 0 ? [] : [activeTarget];
  });
  activeCountdowns = Object.fromEntries(activeTargets.map((target) => [target.id, target]));
  syncCountdownGradients(svg, activeTargets);
  layer.replaceChildren(...activeTargets.map(createCountdownArc));
}

function ensureCountdownLayer(svg: SVGSVGElement): SVGGElement {
  let layer = svg.querySelector<SVGGElement>('[data-clock-part="countdown-layer"]');
  if (layer !== null) {
    return layer;
  }

  layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  layer.dataset.clockPart = "countdown-layer";
  const eventLayer = svg.querySelector('[data-clock-part="event-layer"]');
  if (eventLayer?.parentNode === svg) {
    svg.insertBefore(layer, eventLayer);
  } else {
    svg.append(layer);
  }
  return layer;
}

function syncCountdownGradients(svg: SVGSVGElement, targets: readonly ActiveCountdown[]): void {
  const activeGradientIds = new Set(targets.map((target) => countdownGradientId(target.id)));
  for (const gradient of Array.from(svg.querySelectorAll<SVGLinearGradientElement>('[data-countdown-gradient="true"]'))) {
    if (!activeGradientIds.has(gradient.id)) {
      gradient.remove();
    }
  }

  for (const target of targets) {
    const visual = eventVisualForEvent(target);
    ensureCountdownGradient(svg, countdownGradientId(target.id), target.countdownColor ?? visual.color);
  }
}

function ensureCountdownGradient(svg: SVGSVGElement, gradientId: string, arcColor: string): void {
  const defs = ensureSvgDefs(svg);
  let gradient = Array.from(defs.querySelectorAll<SVGLinearGradientElement>("linearGradient")).find(
    (candidate) => candidate.id === gradientId
  );
  if (gradient === undefined) {
    gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.id = gradientId;
    gradient.dataset.countdownGradient = "true";
    defs.append(gradient);
  }

  gradient.setAttribute("x1", "20");
  gradient.setAttribute("y1", "20");
  gradient.setAttribute("x2", "180");
  gradient.setAttribute("y2", "180");

  const first = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  first.setAttribute("offset", "0%");
  first.setAttribute("stop-color", arcColor);
  first.setAttribute("stop-opacity", "0.35");

  const second = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  second.setAttribute("offset", "100%");
  second.setAttribute("stop-color", arcColor);
  second.setAttribute("stop-opacity", "0.78");

  gradient.replaceChildren(first, second);
}

function ensureSvgDefs(svg: SVGSVGElement): SVGDefsElement {
  let defs = svg.querySelector<SVGDefsElement>("defs");
  if (defs === null) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs;
}

function countdownGradientId(targetId: string): string {
  return `countdown-arc-gradient-${targetId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function createCountdownArc(target: ActiveCountdown): SVGPathElement {
  const visual = eventVisualForEvent(target);
  const arcColor = target.countdownColor ?? visual.color;
  const remainingSeconds = secondsUntilTarget(target);
  const radius = target.ring === "outer" ? 83 : 56;
  const current = projectInstantToStaticClockTime(timeSource.now(), timezoneSelect.value);
  const startAngle = displayAngleForTime(current.hour, current.minute, current.second ?? 0);
  const sweep = Math.min(359.5, Math.max(1, (remainingSeconds / (12 * 60 * 60)) * 360));
  const endAngle = (startAngle + sweep) % 360;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.dataset.clockPart = "countdown-arc";
  path.dataset.countdownTargetId = target.id;
  path.dataset.eventId = target.id;
  path.dataset.eventTitle = target.title;
  path.dataset.eventTime = formatEventTime(target);
  path.dataset.eventStatus = target.status;
  path.dataset.clockRing = target.ring;
  path.dataset.countdownColor = arcColor;
  path.style.setProperty("--event-marker-color", arcColor);
  path.setAttribute("d", describeArc(100, 100, radius, startAngle, endAngle, sweep > 180));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", `url(#${countdownGradientId(target.id)})`);
  path.setAttribute("stroke-width", "4.2");
  path.setAttribute("stroke-linecap", "butt");
  path.setAttribute("opacity", "0.58");
  path.setAttribute("aria-label", `טיימר עד ${target.title}, ${formatRemainingTime(remainingSeconds)}`);
  return path;
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  isLargeArc: boolean
): string {
  const start = pointOnClockFace(startAngle, radius, centerX, centerY);
  const end = pointOnClockFace(endAngle, radius, centerX, centerY);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${isLargeArc ? 1 : 0} 1 ${end.x} ${end.y}`;
}

function pointOnClockFace(
  angleDegrees: number,
  radius: number,
  centerX: number,
  centerY: number
): { readonly x: number; readonly y: number } {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: round(centerX + Math.sin(radians) * radius),
    y: round(centerY - Math.cos(radians) * radius)
  };
}

function targetFromElement(source: EventTarget | null): CountdownTarget | undefined {
  const element = clockTargetElementFromEventTarget(source);
  if (element === null) {
    return undefined;
  }

  if (element.dataset.clockPart === "countdown-arc") {
    const targetId = element.dataset.countdownTargetId;
    return targetId === undefined ? undefined : activeCountdowns[targetId];
  }

  if (element.dataset.clockPart === "event-marker") {
    const eventId = element.dataset.eventId;
    const event = eventId === undefined ? undefined : renderedEventsById.get(eventId);
    return event === undefined ? undefined : { ...event, targetType: "event" };
  }

  if (element.dataset.clockPart === "zmanit-tick") {
    const index = Number(element.dataset.zmanitIndex);
    const hour = Number(element.dataset.zmanitHour);
    const minute = Number(element.dataset.zmanitMinute);
    const second = Number(element.dataset.zmanitSecond);
    if (![index, hour, minute, second].every(Number.isFinite)) {
      return undefined;
    }

    return {
      id: `zmanit-${index}`,
      targetType: "zmanit",
      kind: "custom",
      title: element.dataset.zmanitTitle ?? `שעה זמנית ${index}`,
      hour,
      minute,
      second,
      ring: ringForTime(hour, minute, second),
      status: secondsUntilTime(hour, minute, second) > 0 ? "future" : "past",
      layerTitle: "שעות זמניות"
    };
  }

  return undefined;
}

function clockTargetElementFromEventTarget(source: EventTarget | null): SVGElement | null {
  if (!(source instanceof Element)) {
    return null;
  }

  return source.closest<SVGElement>(
    '[data-clock-part="event-marker"], [data-clock-part="zmanit-tick"], [data-clock-part="countdown-arc"]'
  );
}

function countdownTargetById(targetId: string): CountdownTarget | undefined {
  const event = renderedEventsById.get(targetId);
  if (event !== undefined) {
    return { ...event, targetType: "event" };
  }

  const zmanitMatch = /^zmanit-(\d+)$/.exec(targetId);
  if (zmanitMatch !== null) {
    const tick = zmanitTicks.find((candidate) => candidate.index === Number(zmanitMatch[1]));
    if (tick !== undefined) {
      return {
        id: targetId,
        targetType: "zmanit",
        kind: "custom",
        title: `שעה זמנית ${tick.index}`,
        hour: tick.hour,
        minute: tick.minute,
        second: tick.second,
        ring: ringForTime(tick.hour, tick.minute, tick.second),
        status: secondsUntilTime(tick.hour, tick.minute, tick.second) > 0 ? "future" : "past",
        layerTitle: "שעות זמניות"
      };
    }
  }

  return undefined;
}

function secondsUntilTarget(target: Pick<CountdownTarget, "hour" | "minute" | "second">): number {
  return secondsUntilTime(target.hour, target.minute, target.second ?? 0);
}

function secondsUntilTime(hour: number, minute: number, second = 0): number {
  const current = projectInstantToStaticClockTime(timeSource.now(), timezoneSelect.value);
  return eventSecondOfDay({ hour, minute, second }) - eventSecondOfDay(current);
}

function formatRemainingTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
}

function displayAngleForTime(hour: number, minute: number, second = 0): number {
  const minutesFromSix = (hour * 60 + minute + second / 60 - 6 * 60 + 24 * 60) % (12 * 60);
  return (minutesFromSix / 2 + 180) % 360;
}

function applyEventLayers(): void {
  clock.setEventLayers(eventLayers);
  syncEventList();
  syncClockEventVisuals();
}

function syncAddEventFormVisibility(activeFormName: string | undefined): void {
  for (const form of addEventForms) {
    form.hidden = form.dataset.addEventForm !== activeFormName;
  }

  for (const toggle of eventFormToggles) {
    toggle.setAttribute("aria-expanded", String(toggle.dataset.eventFormToggle === activeFormName));
  }
}

async function refreshDayTimesLayer(force = false): Promise<void> {
  const date = currentDateKey();
  const nextCacheKey = `${selectedLocation.id}:${date}`;
  if (!force && nextCacheKey === dayTimesCacheKey) {
    return;
  }

  dayTimesAbortController?.abort();
  dayTimesAbortController = new AbortController();
  dayTimesStatus.textContent = `טוען זריחה ושקיעה עבור ${selectedLocation.title}...`;

  const provider = new SunriseSunsetEventLayerProvider({
    layerId: DAY_TIMES_LAYER_ID,
    layerTitle: "זמני היום",
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude,
    sunriseTitle: "זריחה",
    sunsetTitle: "שקיעה"
  });

  try {
    const layer = await provider.loadLayer({
      date,
      timeZone: selectedLocation.timeZone,
      signal: dayTimesAbortController.signal
    });
    dayTimesCacheKey = nextCacheKey;
    dayTimesStatus.textContent = `זמני היום נטענו עבור ${selectedLocation.title} בתאריך ${date}.`;
    eventLayers = eventLayers.map((existingLayer) =>
      existingLayer.id === DAY_TIMES_LAYER_ID
        ? addFixedDayTimeEventsToLayer(mergeLayerEnabled(layer, existingLayer.enabled))
        : existingLayer
    );
    syncFixedDayTimeStatus();
    zmanitTicks = createZmanitTicks(layer.events, selectedDefaultZmanitSetId);
    clock.setZmanitTicks(zmanitLayerToggle.checked ? zmanitTicks : []);
    refreshSpecialLayer();
    applyEventLayers();
    void refreshHebcalDetails();
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }

    dayTimesStatus.textContent = `לא ניתן לטעון זמני זריחה ושקיעה עבור ${selectedLocation.title}.`;
    eventLayers = eventLayers.map((layer) =>
      layer.id === DAY_TIMES_LAYER_ID ? { ...layer, events: [] } : layer
    );
    zmanitTicks = [];
    clock.setZmanitTicks([]);
    syncFixedDayTimeStatus();
    refreshSpecialLayer();
    applyEventLayers();
    void refreshHebcalDetails();
  }
}

async function refreshHebcalDetails(force = false): Promise<void> {
  const civilDate = currentDateKey();
  const hebcalDate = currentHebcalDateKey();
  const parshaStartDate = currentParshaRangeStartDateKey(civilDate);
  const nextCacheKey = `${selectedLocation.id}:${civilDate}:${hebcalDate}:${parshaStartDate}`;
  if (!force && nextCacheKey === hebcalCacheKey) {
    return;
  }

  hebcalAbortController?.abort();
  hebcalAbortController = new AbortController();

  try {
    const response = await fetch(
      hebcalUrlForDate(parshaStartDate, addDaysToDateKey(parshaStartDate, 7), selectedLocation.timeZone),
      {
        signal: hebcalAbortController.signal
      }
    );
    if (!response.ok) {
      throw new Error(`Hebcal request failed with status ${response.status}.`);
    }

    jewishDateDetails = parseHebcalDetails(await response.json(), hebcalDate);
    hebcalCacheKey = nextCacheKey;
    clock.refresh();
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }

    jewishDateDetails = { observances: [] };
    hebcalCacheKey = "";
    clock.refresh();
  }
}

function currentHebcalDateKey(): string {
  const date = currentDateKey();
  const sunset = eventLayers
    .find((layer) => layer.id === DAY_TIMES_LAYER_ID)
    ?.events.find((event) => event.kind === "sunset");
  if (sunset === undefined) {
    return date;
  }

  const current = projectInstantToStaticClockTime(timeSource.now(), selectedLocation.timeZone);
  return eventSecondOfDay(current) >= eventSecondOfDay(sunset) ? addDaysToDateKey(date, 1) : date;
}

function currentParshaRangeStartDateKey(civilDate: string): string {
  if (weekdayIndexForDateKey(civilDate) !== 0) {
    return civilDate;
  }

  const sunrise = eventLayers
    .find((layer) => layer.id === DAY_TIMES_LAYER_ID)
    ?.events.find((event) => event.kind === "sunrise");
  if (sunrise === undefined) {
    return civilDate;
  }

  const current = projectInstantToStaticClockTime(timeSource.now(), selectedLocation.timeZone);
  return eventSecondOfDay(current) < eventSecondOfDay(sunrise) ? addDaysToDateKey(civilDate, -1) : civilDate;
}

function renderFixedDayTimeControls(): void {
  fixedDayTimeList.replaceChildren(
    ...fixedDayTimeEvents.map((definition) => {
      const row = document.createElement("div");
      row.className = "fixed-day-time-row";
      row.dataset.fixedDayTimeId = definition.id;

      const title = document.createElement("span");
      title.className = "fixed-day-time-title";
      title.textContent = definition.title;

      const setSelect = document.createElement("select");
      setSelect.dataset.fixedField = "zmanitSetId";
      setSelect.ariaLabel = `${definition.title} סט שעות זמניות`;
      setSelect.append(createOption("", `ברירת מחדל (${getZmanitTimeSetById(selectedDefaultZmanitSetId).title})`));
      for (const set of zmanitTimeSets) {
        setSelect.append(createOption(set.id, set.title));
      }
      setSelect.value = definition.zmanitSetId ?? "";

      const base = document.createElement("select");
      base.dataset.fixedField = "base";
      base.ariaLabel = `${definition.title} מבוסס על`;
      base.append(
        createOption("sunrise", "זריחה"),
        createOption("sunset", "שקיעה"),
        createOption("set-start", "תחילת הסט"),
        createOption("set-end", "סוף הסט")
      );
      base.value = definition.base;

      const direction = document.createElement("select");
      direction.dataset.fixedField = "direction";
      direction.ariaLabel = `${definition.title} לפני או אחרי`;
      direction.append(createOption("before", "לפני"), createOption("after", "אחרי"));
      direction.value = definition.direction;

      const offset = document.createElement("input");
      offset.dataset.fixedField = "offsetValue";
      offset.type = "number";
      offset.min = "0";
      offset.max = "720";
      offset.step = "0.25";
      offset.inputMode = "decimal";
      offset.value = String(definition.offsetValue);
      offset.ariaLabel = `${definition.title} כמות`;

      const unit = document.createElement("select");
      unit.dataset.fixedField = "offsetUnit";
      unit.ariaLabel = `${definition.title} יחידה`;
      unit.append(createOption("minutes", "דקות"), createOption("hours", "שעות"), createOption("zmanit-hours", "שעות זמניות"));
      unit.value = definition.offsetUnit;

      row.append(title, setSelect, base, direction, offset, unit);
      return row;
    })
  );
  syncFixedDayTimeStatus();
}

function handleFixedDayTimeControlEvent(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
    return;
  }

  const row = target.closest<HTMLElement>("[data-fixed-day-time-id]");
  const id = row?.dataset.fixedDayTimeId;
  const field = target.dataset.fixedField;
  if (id === undefined || field === undefined) {
    return;
  }

  fixedDayTimeEvents = fixedDayTimeEvents.map((definition) => {
    if (definition.id !== id) {
      return definition;
    }

    if (field === "base" && isFixedDayTimeBase(target.value)) {
      return { ...definition, base: target.value };
    }
    if (field === "direction" && isDerivedDirection(target.value)) {
      return { ...definition, direction: target.value };
    }
    if (field === "offsetValue") {
      return { ...definition, offsetValue: Number(target.value) };
    }
    if (field === "offsetUnit" && isEventOffsetUnit(target.value)) {
      return { ...definition, offsetUnit: target.value };
    }
    if (field === "zmanitSetId") {
      if (target.value === "") {
        const { zmanitSetId: _removed, ...definitionWithoutSet } = definition;
        return definitionWithoutSet;
      }
      if (isZmanitTimeSetId(target.value)) {
        return { ...definition, zmanitSetId: target.value };
      }
    }
    return definition;
  });

  refreshFixedDayTimeEvents();
  applyEventLayers();
}

function refreshFixedDayTimeEvents(): void {
  eventLayers = eventLayers.map((layer) =>
    layer.id === DAY_TIMES_LAYER_ID ? addFixedDayTimeEventsToLayer(layer) : layer
  );
  syncFixedDayTimeStatus();
}

function addFixedDayTimeEventsToLayer(layer: EventLayerDefinition): EventLayerDefinition {
  const sourceEvents = layer.events.filter((event) => !event.id.startsWith("fixed-"));
  return {
    ...layer,
    events: [...sourceEvents, ...resolveFixedDayTimeEvents(sourceEvents)]
  };
}

function resolveFixedDayTimeEvents(events: readonly InstantEventDefinition[]): InstantEventDefinition[] {
  return resolveOffsetDefinitions(events, fixedDayTimeEvents, "fixed");
}

function resolveAutomaticShabbatEvents(events: readonly InstantEventDefinition[]): InstantEventDefinition[] {
  const weekday = weekdayIndexForDateKey(currentDateKey());
  const definitions = AUTOMATIC_SHABBAT_EVENTS.filter((definition) => definition.weekdays.includes(weekday));
  return resolveOffsetDefinitions(events, definitions, "fixed-shabbat");
}

function resolveOffsetDefinitions(
  events: readonly InstantEventDefinition[],
  definitions: readonly FixedDayTimeDefinition[],
  idPrefix: string
): InstantEventDefinition[] {
  const sunrise = events.find((event) => event.kind === "sunrise");
  const sunset = events.find((event) => event.kind === "sunset");
  if (sunrise === undefined || sunset === undefined) {
    return [];
  }

  return definitions.flatMap((definition) => {
    if (!Number.isFinite(definition.offsetValue) || definition.offsetValue < 0) {
      return [];
    }

    const set = getZmanitTimeSetById(definition.zmanitSetId ?? selectedDefaultZmanitSetId);
    const range = resolveZmanitSetRange(events, set);
    if (range === undefined) {
      return [];
    }

    const baseSeconds = fixedBaseSecondOfDay(definition.base, sunrise, sunset, range);
    const offsetSeconds = fixedOffsetSeconds(definition, range.zmanitHourSeconds);
    const signedOffset = definition.direction === "before" ? -offsetSeconds : offsetSeconds;
    const time = timeFromSeconds(Math.round(baseSeconds + signedOffset));
    return [
      {
        id: `${idPrefix}-${definition.id}`,
        type: "instant",
        kind: "custom",
        title: definition.title,
        hour: time.hour,
        minute: time.minute,
        second: time.second,
        description: `${displayDirection(definition.direction)} ${definition.offsetValue} ${displayOffsetUnit(definition.offsetUnit)} מ${displayFixedBase(definition.base)} | סט: ${set.title}`
      }
    ];
  });
}

function fixedBaseSecondOfDay(
  base: FixedDayTimeBase,
  sunrise: InstantEventDefinition,
  sunset: InstantEventDefinition,
  range: ZmanitSetRange
): number {
  if (base === "sunrise") {
    return eventSecondOfDay(sunrise);
  }
  if (base === "sunset") {
    return eventSecondOfDay(sunset);
  }
  return base === "set-start" ? range.startSeconds : range.endSeconds;
}

function resolveZmanitSetRange(
  events: readonly InstantEventDefinition[],
  set: ZmanitTimeSetDefinition
): ZmanitSetRange | undefined {
  const sunrise = events.find((event) => event.kind === "sunrise");
  const sunset = events.find((event) => event.kind === "sunset");
  if (sunrise === undefined || sunset === undefined) {
    return undefined;
  }

  const standardZmanitHourSeconds = (eventSecondOfDay(sunset) - eventSecondOfDay(sunrise)) / 12;
  if (standardZmanitHourSeconds <= 0) {
    return undefined;
  }

  const startSeconds = resolveZmanitBoundarySecondOfDay(set.startTime, sunrise, sunset, standardZmanitHourSeconds);
  const endSeconds = resolveZmanitBoundarySecondOfDay(set.endTime, sunrise, sunset, standardZmanitHourSeconds);
  if (endSeconds <= startSeconds) {
    return undefined;
  }

  return {
    startSeconds,
    endSeconds,
    zmanitHourSeconds: (endSeconds - startSeconds) / 12
  };
}

function resolveZmanitBoundarySecondOfDay(
  boundary: ZmanitSetBoundary,
  sunrise: InstantEventDefinition,
  sunset: InstantEventDefinition,
  fallbackZmanitHourSeconds: number
): number {
  const baseSeconds = boundary.base === "sunrise" ? eventSecondOfDay(sunrise) : eventSecondOfDay(sunset);
  const offsetSeconds = offsetSecondsForValue(boundary.offsetValue, boundary.offsetUnit, fallbackZmanitHourSeconds);
  return Math.round(baseSeconds + (boundary.direction === "before" ? -offsetSeconds : offsetSeconds));
}

function fixedOffsetSeconds(definition: FixedDayTimeDefinition, zmanitHourSeconds: number): number {
  return offsetSecondsForValue(definition.offsetValue, definition.offsetUnit, zmanitHourSeconds);
}

function offsetSecondsForValue(value: number, unit: EventOffsetUnit, zmanitHourSeconds: number): number {
  if (unit === "minutes") {
    return value * 60;
  }
  if (unit === "hours") {
    return value * 3600;
  }
  return value * zmanitHourSeconds;
}

function syncFixedDayTimeStatus(): void {
  const dayTimesLayer = eventLayers.find((layer) => layer.id === DAY_TIMES_LAYER_ID);
  const activeSet = getZmanitTimeSetById(selectedDefaultZmanitSetId);
  const anchorCount = dayTimesLayer?.events.filter(isSunriseOrSunsetEvent).length ?? 0;
  const resolvedCount = dayTimesLayer?.events.filter((event) => event.id.startsWith("fixed-")).length ?? 0;
  fixedDayTimeStatus.textContent =
    anchorCount < 2
      ? "האירועים הקבועים יחושבו אחרי טעינת זריחה ושקיעה."
      : `${resolvedCount} אירועים קבועים מחושבים בתוך שכבת זמני היום. סט ברירת מחדל: ${activeSet.title}.`;
}

function refreshSpecialLayer(): void {
  const specialEvents = resolveDerivedEvents();
  eventLayers = eventLayers.map((layer) =>
    layer.id === SPECIAL_LAYER_ID ? { ...layer, events: specialEvents } : layer
  );
}

function resolveDerivedEvents(): InstantEventDefinition[] {
  const dayTimesLayer = eventLayers.find((layer) => layer.id === DAY_TIMES_LAYER_ID);
  const dayEvents = dayTimesLayer?.events ?? [];
  const sunrise = dayEvents.find((event) => event.kind === "sunrise");
  const sunset = dayEvents.find((event) => event.kind === "sunset");
  if (sunrise === undefined || sunset === undefined) {
    return [];
  }

  const range = resolveZmanitSetRange(dayEvents, getZmanitTimeSetById(selectedDefaultZmanitSetId));
  if (range === undefined) {
    return [];
  }

  return derivedEvents.flatMap((definition) => {
    const baseSeconds = derivedBaseSecondOfDay(definition.base, sunrise, sunset);
    if (baseSeconds === undefined) {
      return [];
    }

    const offsetSeconds = derivedOffsetSeconds(definition, range.zmanitHourSeconds);
    const signedOffset = definition.direction === "before" ? -offsetSeconds : offsetSeconds;
    const time = timeFromSeconds(Math.round(baseSeconds + signedOffset));
    return [
      {
        id: definition.id,
        type: "instant",
        kind: "custom",
        title: definition.title,
        hour: time.hour,
        minute: time.minute,
        second: time.second
      }
    ];
  });
}

function derivedBaseSecondOfDay(
  base: DerivedBase,
  sunrise: InstantEventDefinition,
  sunset: InstantEventDefinition
): number | undefined {
  if (base === "sunrise") {
    return eventSecondOfDay(sunrise);
  }
  if (base === "sunset") {
    return eventSecondOfDay(sunset);
  }

  const index = Number(base.replace("zmanit-", ""));
  const tick = zmanitTicks.find((candidate) => candidate.index === index);
  return tick === undefined ? undefined : eventSecondOfDay(tick);
}

function derivedOffsetSeconds(definition: DerivedEventDefinition, zmanitHourSeconds: number): number {
  if (definition.offsetUnit === "minutes") {
    return definition.offsetValue * 60;
  }
  if (definition.offsetUnit === "hours") {
    return definition.offsetValue * 3600;
  }
  return definition.offsetValue * zmanitHourSeconds;
}

function checkDueAlerts(): void {
  if (!alertSettings.enabled) {
    return;
  }

  const currentTime = projectInstantToStaticClockTime(timeSource.now(), timezoneSelect.value);
  const currentSeconds = eventSecondOfDay(currentTime);
  const today = currentDateKey();
  const resolved = resolveEventLayers(eventLayers, currentTime);

  for (const event of resolved) {
    const settings = eventAlertSettingsForEventId(event.id);
    if (!settings.enabled || (!settings.sound && !settings.desktop)) {
      continue;
    }

    const triggerSeconds = alertTriggerSecondOfDay(event, settings);
    const secondsSinceTrigger = (currentSeconds - triggerSeconds + 86_400) % 86_400;
    if (secondsSinceTrigger > 1) {
      continue;
    }

    const alertKey = `${today}:${event.id}:${triggerSeconds}:${settings.direction}:${settings.offsetValue}:${settings.offsetUnit}`;
    if (firedAlertKeys.has(alertKey)) {
      continue;
    }

    firedAlertKeys.add(alertKey);
    fireEventAlert(event, settings);
  }
}

function alertTriggerSecondOfDay(event: VisualEvent, settings: EventAlertSettings): number {
  const offsetSeconds = settings.offsetUnit === "hours" ? settings.offsetValue * 3600 : settings.offsetValue * 60;
  const signedOffset = settings.direction === "before" ? -offsetSeconds : offsetSeconds;
  return ((eventSecondOfDay(event) + signedOffset) % 86_400 + 86_400) % 86_400;
}

function fireEventAlert(event: VisualEvent, settings: EventAlertSettings): void {
  if (settings.sound) {
    playAlertSound();
  }

  if (settings.desktop) {
    showDesktopAlert(event, settings);
  }
}

function playAlertSound(): void {
  const AudioContextConstructor =
    window.AudioContext ?? (window as Window & { readonly webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AudioContextConstructor === undefined) {
    return;
  }

  try {
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.42);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    importExportStatus.textContent = "הדפדפן חסם צליל עד לאינטראקציה עם המסך.";
  }
}

function showDesktopAlert(event: VisualEvent, settings: EventAlertSettings): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const relation = settings.direction === "before" ? "לפני" : "אחרי";
  const unit = settings.offsetUnit === "hours" ? "שעות" : "דקות";
  new Notification(event.title, {
    body: `${relation} ${settings.offsetValue} ${unit} | ${formatEventTime(event)}`,
    tag: `dual-ring-event-${event.id}`
  });
}

function requestDesktopPermissionIfNeeded(settings: EventAlertSettings): void {
  if (!settings.enabled || !settings.desktop || !("Notification" in window) || Notification.permission !== "default") {
    return;
  }

  void Notification.requestPermission();
}

function exportAppState(): void {
  const state: AppExportState = {
    version: 1,
    exportedAt: new Date().toISOString(),
    selectedLocationId: selectedLocation.id,
    selectedDefaultZmanitSetId,
    zmanitTimeSets: zmanitTimeSets.map(cloneZmanitTimeSet),
    personalEvents: personalLayerEvents(),
    derivedEvents,
    fixedDayTimeEvents,
    displayPreferences: cloneDisplayPreferences(displayPreferences),
    eventVisualOverrides: { ...eventVisualOverrides },
    alertSettings: { ...alertSettings },
    eventAlertOverrides: { ...eventAlertOverrides }
  };
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `analog-event-clock-${currentDateKey()}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  importExportStatus.textContent = "הייצוא נשמר כקובץ JSON.";
}

async function importAppStateFromInput(event: Event): Promise<void> {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const file = input.files?.[0];
  if (file === undefined) {
    return;
  }

  try {
    importAppState(JSON.parse(await file.text()));
    importExportStatus.textContent = "הייבוא הושלם.";
  } catch (error) {
    importExportStatus.textContent = error instanceof Error ? error.message : "לא ניתן לייבא את הקובץ.";
  } finally {
    input.value = "";
  }
}

function importAppState(payload: unknown): void {
  if (!isRecord(payload)) {
    throw new Error("קובץ הייבוא לא נראה תקין.");
  }

  const state = payload as Partial<AppExportState>;
  if (typeof state.selectedLocationId === "string" && LOCATION_OPTIONS.some((item) => item.id === state.selectedLocationId)) {
    selectedLocation = getLocationById(state.selectedLocationId);
    locationSelect.value = selectedLocation.id;
    syncTimeZoneToLocation();
    clock.setTimeZone(timezoneSelect.value);
    dayTimesCacheKey = "";
  }

  if (Array.isArray(state.zmanitTimeSets)) {
    const importedSets = state.zmanitTimeSets.filter(isZmanitTimeSetDefinition).map(cloneZmanitTimeSet);
    if (importedSets.length > 0) {
      zmanitTimeSets = importedSets;
    }
  }

  if (typeof state.selectedDefaultZmanitSetId === "string") {
    selectedDefaultZmanitSetId = state.selectedDefaultZmanitSetId;
  }
  ensureSelectedZmanitSetIds();

  if (Array.isArray(state.personalEvents)) {
    const importedPersonalEvents = state.personalEvents.filter(isInstantEventDefinition);
    eventLayers = eventLayers.map((layer) =>
      layer.id === PERSONAL_LAYER_ID ? { ...layer, events: importedPersonalEvents } : layer
    );
  }

  if (Array.isArray(state.derivedEvents)) {
    derivedEvents = state.derivedEvents.filter(isDerivedEventDefinition);
  }

  if (Array.isArray(state.fixedDayTimeEvents)) {
    fixedDayTimeEvents = state.fixedDayTimeEvents.filter(isFixedDayTimeDefinition).map(removeMissingZmanitSetReference);
  }

  if (isDisplayPreferences(state.displayPreferences)) {
    displayPreferences = cloneDisplayPreferences(state.displayPreferences);
  }

  if (isRecord(state.eventVisualOverrides)) {
    eventVisualOverrides = Object.fromEntries(
      Object.entries(state.eventVisualOverrides).filter((entry): entry is [string, EventVisualStyle] =>
        isEventVisualStyle(entry[1])
      )
    );
  }

  if (isEventAlertGlobalSettings(state.alertSettings)) {
    alertSettings = { ...state.alertSettings };
  }

  if (isRecord(state.eventAlertOverrides)) {
    eventAlertOverrides = Object.fromEntries(
      Object.entries(state.eventAlertOverrides).filter((entry): entry is [string, EventAlertSettings] =>
        isEventAlertSettings(entry[1])
      )
    );
  }

  firedAlertKeys = new Set();
  renderZmanitSetControls();
  syncDisplayPreferenceControls();
  syncAlertGlobalControls();
  applyDisplayPreferences();
  renderFixedDayTimeControls();
  refreshSpecialLayer();
  applyEventLayers();
  void refreshDayTimesLayer(true);
}

function personalLayerEvents(): readonly InstantEventDefinition[] {
  return eventLayers.find((layer) => layer.id === PERSONAL_LAYER_ID)?.events ?? [];
}

function syncEventList(): void {
  const currentTime = projectInstantToStaticClockTime(timeSource.now(), timezoneSelect.value);
  const resolved = [...resolveEventLayers(eventLayers, currentTime)].sort(
    (first, second) => eventSecondOfDay(first) - eventSecondOfDay(second)
  );
  renderedEventsById = new Map(resolved.map((event) => [event.id, event]));
  status.textContent = `שעה מקומית ${formatTime(currentTime.hour, currentTime.minute)} | ${selectedLocation.title} | ${timezoneSelect.value}`;
  eventList.replaceChildren(
    ...resolved.map((event) => {
      const item = document.createElement("li");
      item.dataset.eventStatus = event.status;
      item.dataset.clockRing = event.ring;
      if (event.layerId !== undefined) {
        item.dataset.eventLayerId = event.layerId;
      }

      const visual = eventVisualForEvent(event);
      const symbol = document.createElement("button");
      symbol.type = "button";
      symbol.className = "event-symbol event-symbol-button";
      symbol.dataset.eventVisualId = event.id;
      symbol.dataset.eventKind = event.kind;
      symbol.style.setProperty("--event-symbol-color", visual.color);
      symbol.replaceChildren(createHtmlIcon(visual.icon));
      symbol.ariaLabel = `שינוי סמל וצבע עבור ${event.title}`;

      const layer = document.createElement("span");
      layer.className = `event-layer event-layer-${event.layerKind ?? "custom"}`;
      layer.textContent = displayLayerKind(event.layerKind);

      const title = document.createElement("span");
      title.className = "event-title";
      title.textContent = event.title;

      const time = document.createElement("span");
      time.className = "event-time";
      time.textContent = formatEventTime(event);

      const ring = document.createElement("span");
      ring.className = "event-ring";
      ring.textContent = displayRing(event.ring);

      const state = document.createElement("span");
      state.className = "event-status";
      state.textContent = displayStatus(event.status);

      item.append(symbol, layer, title, time, ring, state);
      item.append(createEventAlertControls(event));
      if (event.layerId === PERSONAL_LAYER_ID || event.layerId === SPECIAL_LAYER_ID) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.dataset.eventId = event.id;
        remove.textContent = "מחק";
        item.append(remove);
      }
      return item;
    })
  );
}

function validateEventForm(): string {
  const hour = Number(hourInput.value);
  const minute = Number(minuteInput.value);

  hourInput.setCustomValidity("");
  minuteInput.setCustomValidity("");

  const result = validateEventTime(hour, minute);
  if (!result.valid) {
    if (result.field === "hour") {
      hourInput.setCustomValidity(result.message);
    } else {
      minuteInput.setCustomValidity(result.message);
    }
    return result.message;
  }

  return "";
}

function validateDerivedEventForm(): string {
  const offsetValue = Number(derivedOffsetInput.value);

  derivedOffsetInput.setCustomValidity("");

  const result = validateNonNegativeOffset(offsetValue);
  if (!result.valid) {
    derivedOffsetInput.setCustomValidity(result.message);
    return result.message;
  }

  return "";
}

function createEventId(): string {
  const hour = Number(hourInput.value);
  const minute = Number(minuteInput.value);
  return `${kindSelect.value}-${ringForTime(hour, minute)}-${hour}-${minute}-${Date.now()}`;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatEventTime(event: { readonly hour: number; readonly minute: number; readonly second?: number }): string {
  if (event.second === undefined) {
    return formatTime(event.hour, event.minute);
  }

  return `${formatTime(event.hour, event.minute)}:${String(event.second).padStart(2, "0")}`;
}

function createZmanitTicks(events: readonly InstantEventDefinition[], setId: ZmanitTimeSetId): ZmanitTick[] {
  const range = resolveZmanitSetRange(events, getZmanitTimeSetById(setId));
  if (range === undefined) {
    return [];
  }

  return Array.from({ length: 12 }, (_, index) =>
    tickFromSeconds(index + 1, Math.round(range.startSeconds + range.zmanitHourSeconds * (index + 1)))
  );
}

function eventSecondOfDay(event: { readonly hour: number; readonly minute: number; readonly second?: number }): number {
  return event.hour * 60 * 60 + event.minute * 60 + (event.second ?? 0);
}

function timeFromSeconds(totalSeconds: number): { hour: number; minute: number; second: number } {
  const secondsInDay = ((totalSeconds % 86_400) + 86_400) % 86_400;
  const hour = Math.floor(secondsInDay / 3600);
  const minute = Math.floor((secondsInDay % 3600) / 60);
  const second = secondsInDay % 60;
  return { hour, minute, second };
}

function tickFromSeconds(index: number, totalSeconds: number): ZmanitTick {
  return { index, ...timeFromSeconds(totalSeconds) };
}

function currentDateKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: selectedLocation.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(timeSource.now().epochMilliseconds);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("לא ניתן לחשב את התאריך הנוכחי עבור המיקום שנבחר.");
  }

  return `${year}-${month}-${day}`;
}

function weekdayIndexForDateKey(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function emptyDayTimesLayer(): EventLayerDefinition {
  return {
    id: DAY_TIMES_LAYER_ID,
    title: "זמני היום",
    kind: "day-times",
    enabled: true,
    events: []
  };
}

function emptySpecialLayer(): EventLayerDefinition {
  return {
    id: SPECIAL_LAYER_ID,
    title: "אירועים מיוחדים",
    kind: "special",
    enabled: true,
    events: []
  };
}

function mergeLayerEnabled(layer: EventLayerDefinition, enabled: boolean | undefined): EventLayerDefinition {
  if (enabled === undefined) {
    return layer;
  }

  return { ...layer, enabled };
}

function isSunriseOrSunsetEvent(event: InstantEventDefinition): boolean {
  return event.kind === "sunrise" || event.kind === "sunset";
}

function isFixedDayTimeBase(value: string): value is FixedDayTimeBase {
  return value === "sunrise" || value === "sunset" || value === "set-start" || value === "set-end";
}

function isFixedDayTimeAnchorBase(value: string): value is FixedDayTimeAnchorBase {
  return value === "sunrise" || value === "sunset";
}

function isDerivedDirection(value: string): value is DerivedDirection {
  return value === "before" || value === "after";
}

function isEventAlertDirection(value: string): value is EventAlertDirection {
  return value === "before" || value === "after";
}

function isEventOffsetUnit(value: string): value is EventOffsetUnit {
  return value === "minutes" || value === "hours" || value === "zmanit-hours";
}

function isEventAlertOffsetUnit(value: string): value is EventAlertOffsetUnit {
  return value === "minutes" || value === "hours";
}

function isZmanitTimeSetId(value: string): value is ZmanitTimeSetId {
  return zmanitTimeSets.some((set) => set.id === value);
}

function isDisplayTemplateId(value: string): value is DisplayTemplateId {
  return value === "classic" || value === "night" || value === "paper" || value === "focus" || value === "festival";
}

function isDisplayFontFamily(value: string): value is DisplayFontFamily {
  return value === "system" || value === "serif" || value === "mono" || value === "rounded";
}

function isDisplayMode(value: string): value is DisplayMode {
  return value === "fullMode" || value === "clockOnly" || value === "floatingClock";
}

function isInstantEventKind(value: string | undefined): value is InstantEventKind {
  return value === "sunrise" || value === "sunset" || value === "custom";
}

function isEventIconId(value: string): value is EventIconId {
  return EVENT_ICON_OPTIONS.some((option) => option.id === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInstantEventDefinition(value: unknown): value is InstantEventDefinition {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === "instant" &&
    typeof value.id === "string" &&
    isInstantEventKind(typeof value.kind === "string" ? value.kind : undefined) &&
    typeof value.title === "string" &&
    typeof value.hour === "number" &&
    typeof value.minute === "number"
  );
}

function isDerivedEventDefinition(value: unknown): value is DerivedEventDefinition {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.base === "string" &&
    isDerivedDirection(typeof value.direction === "string" ? value.direction : "") &&
    typeof value.offsetValue === "number" &&
    isEventOffsetUnit(typeof value.offsetUnit === "string" ? value.offsetUnit : "")
  );
}

function isFixedDayTimeDefinition(value: unknown): value is FixedDayTimeDefinition {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isFixedDayTimeBase(typeof value.base === "string" ? value.base : "") &&
    isDerivedDirection(typeof value.direction === "string" ? value.direction : "") &&
    typeof value.offsetValue === "number" &&
    isEventOffsetUnit(typeof value.offsetUnit === "string" ? value.offsetUnit : "") &&
    (value.zmanitSetId === undefined || typeof value.zmanitSetId === "string")
  );
}

function isZmanitSetBoundary(value: unknown): value is ZmanitSetBoundary {
  return (
    isRecord(value) &&
    typeof value.base === "string" &&
    isFixedDayTimeAnchorBase(value.base) &&
    typeof value.direction === "string" &&
    isDerivedDirection(value.direction) &&
    typeof value.offsetValue === "number" &&
    typeof value.offsetUnit === "string" &&
    isEventOffsetUnit(value.offsetUnit)
  );
}

function isZmanitTimeSetDefinition(value: unknown): value is ZmanitTimeSetDefinition {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.trim() !== "" &&
    typeof value.title === "string" &&
    value.title.trim() !== "" &&
    isZmanitSetBoundary(value.startTime) &&
    isZmanitSetBoundary(value.endTime)
  );
}

function isEventVisualStyle(value: unknown): value is EventVisualStyle {
  return (
    isRecord(value) &&
    typeof value.icon === "string" &&
    isEventIconId(value.icon) &&
    typeof value.color === "string"
  );
}

function isEventAlertSettings(value: unknown): value is EventAlertSettings {
  return (
    isRecord(value) &&
    typeof value.enabled === "boolean" &&
    typeof value.sound === "boolean" &&
    typeof value.desktop === "boolean" &&
    typeof value.direction === "string" &&
    isEventAlertDirection(value.direction) &&
    typeof value.offsetValue === "number" &&
    typeof value.offsetUnit === "string" &&
    isEventAlertOffsetUnit(value.offsetUnit)
  );
}

function isEventAlertGlobalSettings(value: unknown): value is EventAlertGlobalSettings {
  return isRecord(value) && typeof value.enabled === "boolean";
}

function isDisplayPreferences(value: unknown): value is DisplayPreferences {
  if (!isRecord(value) || !isRecord(value.eventStyles)) {
    return false;
  }

  return (
    typeof value.templateId === "string" &&
    isDisplayTemplateId(value.templateId) &&
    typeof value.displayMode === "string" &&
    isDisplayMode(value.displayMode) &&
    typeof value.fontFamily === "string" &&
    isDisplayFontFamily(value.fontFamily) &&
    typeof value.fontScale === "number" &&
    (typeof value.clockScale === "number" || value.clockScale === undefined) &&
    typeof value.backgroundColor === "string" &&
    typeof value.panelColor === "string" &&
    typeof value.textColor === "string" &&
    typeof value.mutedColor === "string" &&
    typeof value.accentColor === "string" &&
    typeof value.clockFaceColor === "string" &&
    typeof value.clockStrokeColor === "string" &&
    typeof value.clockHandColor === "string" &&
    isEventVisualStyle(value.eventStyles.sunrise) &&
    isEventVisualStyle(value.eventStyles.sunset) &&
    isEventVisualStyle(value.eventStyles.custom)
  );
}

function cloneDisplayPreferences(preferences: DisplayPreferences): DisplayPreferences {
  return {
    ...preferences,
    clockScale: preferences.clockScale ?? 100,
    eventStyles: {
      sunrise: { ...preferences.eventStyles.sunrise },
      sunset: { ...preferences.eventStyles.sunset },
      custom: { ...preferences.eventStyles.custom }
    }
  };
}

function cloneZmanitTimeSet(set: ZmanitTimeSetDefinition): ZmanitTimeSetDefinition {
  return {
    ...set,
    startTime: { ...set.startTime },
    endTime: { ...set.endTime },
    fixedEvents: [...set.fixedEvents]
  };
}

function createZmanitSetId(): ZmanitTimeSetId {
  let index = zmanitTimeSets.length + 1;
  let candidate = `custom-zmanit-set-${index}`;
  while (zmanitTimeSets.some((set) => set.id === candidate)) {
    index += 1;
    candidate = `custom-zmanit-set-${index}`;
  }
  return candidate;
}

function removeMissingZmanitSetReference(definition: FixedDayTimeDefinition): FixedDayTimeDefinition {
  if (definition.zmanitSetId === undefined || isZmanitTimeSetId(definition.zmanitSetId)) {
    return definition;
  }

  const { zmanitSetId: _removed, ...definitionWithoutSet } = definition;
  return definitionWithoutSet;
}

function loadDisplayPreferences(): DisplayPreferences {
  const preferences = cloneDisplayPreferences(DISPLAY_TEMPLATES.night);
  const savedMode = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
  if (savedMode !== null && isDisplayMode(savedMode)) {
    return { ...preferences, displayMode: savedMode };
  }
  const legacySavedMode = localStorage.getItem(LEGACY_DISPLAY_MODE_STORAGE_KEY);
  if (legacySavedMode !== null && isDisplayMode(legacySavedMode)) {
    localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, legacySavedMode);
    return { ...preferences, displayMode: legacySavedMode };
  }
  return preferences;
}

function persistDisplayMode(displayMode: DisplayMode): void {
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, displayMode);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function createOption(value: string, label: string): HTMLOptionElement {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function syncTimeZoneToLocation(): void {
  timezoneSelect.value = selectedLocation.timeZone;
}

function displayLayerKind(kind: EventLayerKind | undefined): string {
  if (kind === "day-times" || kind === "api") {
    return "זמני היום";
  }
  if (kind === "personal") {
    return "אישי";
  }
  if (kind === "special") {
    return "מיוחד";
  }
  return "שכבה";
}

function displayFixedBase(base: FixedDayTimeBase): string {
  if (base === "sunrise") {
    return "זריחה";
  }
  if (base === "sunset") {
    return "שקיעה";
  }
  return base === "set-start" ? "תחילת הסט" : "סוף הסט";
}

function displayDirection(direction: DerivedDirection): string {
  return direction === "before" ? "לפני" : "אחרי";
}

function displayZmanitBoundary(boundary: ZmanitSetBoundary): string {
  if (boundary.offsetValue === 0) {
    return displayFixedBase(boundary.base);
  }
  return `${displayDirection(boundary.direction)} ${boundary.offsetValue} ${displayOffsetUnit(boundary.offsetUnit)} מ${displayFixedBase(boundary.base)}`;
}

function displayOffsetUnit(unit: EventOffsetUnit): string {
  if (unit === "minutes") {
    return "דקות";
  }
  if (unit === "hours") {
    return "שעות";
  }
  return "שעות זמניות";
}

function getZmanitTimeSetById(id: ZmanitTimeSetId): ZmanitTimeSetDefinition {
  const set = zmanitTimeSets.find((candidate) => candidate.id === id);
  if (set === undefined) {
    throw new Error(`חסר סט שעות זמניות: ${id}`);
  }
  return set;
}

function displayRing(ring: "outer" | "inner"): string {
  return ring === "outer" ? "טבעת יום" : "טבעת לילה";
}

function displayStatus(status: "past" | "next" | "future"): string {
  if (status === "past") {
    return "עבר";
  }
  if (status === "next") {
    return "האירוע הבא";
  }
  return "עתידי";
}

function displayModeLabel(displayMode: DisplayMode): string {
  if (displayMode === "clockOnly") {
    return "מצב שעון בלבד";
  }
  if (displayMode === "floatingClock") {
    return "מצב שעון צף";
  }
  return "מצב מלא";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function overlayWindow(element: Element): Window {
  return element.ownerDocument.defaultView ?? window;
}

function eventDocumentFromMouseEvent(event: MouseEvent): Document {
  return event.view?.document ?? document;
}

function getRequiredChild<T extends Element>(parent: ParentNode, selector: string): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    throw new Error(`חסר רכיב אפליקציה פנימי נדרש: ${selector}`);
  }
  return element;
}

function destroyClock(): void {
  closeFloatingClockWindow();
  dayTimesAbortController?.abort();
  hebcalAbortController?.abort();
  window.clearInterval(statusTimer);
  window.clearInterval(visualTimer);
  window.removeEventListener("beforeunload", destroyClock);
  mount.removeEventListener("pointerover", handleClockTooltipPointerOver);
  mount.removeEventListener("pointermove", handleClockTooltipPointerMove);
  mount.removeEventListener("pointerout", handleClockTooltipPointerOut);
  mount.removeEventListener("mouseover", handleClockTooltipPointerOver);
  mount.removeEventListener("mousemove", handleClockTooltipPointerMove);
  mount.removeEventListener("mouseout", handleClockTooltipPointerOut);
  mount.removeEventListener("click", handleClockTargetClick);
  mount.removeEventListener("contextmenu", handleClockContextMenu);
  document.removeEventListener("mousemove", handleDocumentClockMouseMove);
  clockEventObserver.disconnect();
  if (clockVisualSyncFrame !== undefined) {
    window.cancelAnimationFrame(clockVisualSyncFrame);
  }
  clockTooltip.remove();
  eventVisualEditor.remove();
  timerActionMenu.remove();
  clockContextMenu.remove();
  clock.destroy();
}

const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot;
hot?.dispose(destroyClock);
