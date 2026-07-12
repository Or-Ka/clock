import { ringForTime, type InstantEventDefinition, type InstantEventKind } from "@clock/clock";

import { createLifecycleRegistry } from "../app/lifecycle.js";
import { validateEventTime, validateNonNegativeOffset } from "./event-validation.js";

type EventAlertOffsetUnit = "minutes" | "hours";
type EventAlertDirection = "before" | "after";
type DerivedBase = "sunrise" | "sunset" | `zmanit-${number}`;
type DerivedDirection = "before" | "after";
type DerivedOffsetUnit = "minutes" | "hours" | "zmanit-hours";

export type EventAlertSettings = {
  readonly enabled: boolean;
  readonly sound: boolean;
  readonly desktop: boolean;
  readonly direction: EventAlertDirection;
  readonly offsetValue: number;
  readonly offsetUnit: EventAlertOffsetUnit;
};

export type AlertFormControls = {
  readonly enabled: HTMLInputElement;
  readonly sound: HTMLInputElement;
  readonly desktop: HTMLInputElement;
  readonly direction: HTMLSelectElement;
  readonly offset: HTMLInputElement;
  readonly unit: HTMLSelectElement;
};

export type DerivedEventDefinition = {
  readonly id: string;
  readonly title: string;
  readonly base: DerivedBase;
  readonly direction: DerivedDirection;
  readonly offsetValue: number;
  readonly offsetUnit: DerivedOffsetUnit;
};

export type EventEditorElements = {
  readonly eventFormToggles: readonly HTMLButtonElement[];
  readonly eventForm: HTMLFormElement;
  readonly kindSelect: HTMLSelectElement;
  readonly titleInput: HTMLInputElement;
  readonly hourInput: HTMLInputElement;
  readonly minuteInput: HTMLInputElement;
  readonly eventAlertControls: AlertFormControls;
  readonly eventError: HTMLElement;
  readonly derivedForm: HTMLFormElement;
  readonly derivedTitleInput: HTMLInputElement;
  readonly derivedBaseSelect: HTMLSelectElement;
  readonly derivedDirectionSelect: HTMLSelectElement;
  readonly derivedOffsetInput: HTMLInputElement;
  readonly derivedOffsetUnitSelect: HTMLSelectElement;
  readonly derivedEventAlertControls: AlertFormControls;
  readonly derivedError: HTMLElement;
};

export type EventEditorController = {
  readonly start: () => void;
  readonly destroy: () => void;
};

export type EventEditorControllerOptions = {
  readonly elements: EventEditorElements;
  readonly setActiveForm: (formName: string | undefined) => void;
  readonly readAlertFormSettings: (controls: AlertFormControls) => EventAlertSettings;
  readonly onRegularEventSubmit: (event: InstantEventDefinition, alertSettings: EventAlertSettings) => void;
  readonly onDerivedEventSubmit: (event: DerivedEventDefinition, alertSettings: EventAlertSettings) => void;
};

export function createEventEditorController(options: EventEditorControllerOptions): EventEditorController {
  const lifecycle = createLifecycleRegistry();
  let started = false;

  return {
    start() {
      if (started) {
        return;
      }

      started = true;

      for (const toggle of options.elements.eventFormToggles) {
        const handleClick = () => {
          const formName = toggle.dataset.eventFormToggle;
          if (formName === undefined) {
            return;
          }

          const isExpanded = toggle.getAttribute("aria-expanded") === "true";
          options.setActiveForm(isExpanded ? undefined : formName);
        };

        toggle.addEventListener("click", handleClick);
        lifecycle.add(() => toggle.removeEventListener("click", handleClick));
      }

      const handleEventSubmit = (event: SubmitEvent) => {
        event.preventDefault();

        const validationError = validateEventForm(options.elements);
        if (validationError) {
          options.elements.eventError.textContent = validationError;
          return;
        }

        options.elements.eventError.textContent = "";
        const hour = Number(options.elements.hourInput.value);
        const minute = Number(options.elements.minuteInput.value);
        const eventId = createEventId(options.elements.kindSelect.value, hour, minute);
        const nextEvent: InstantEventDefinition = {
          id: eventId,
          type: "instant",
          kind: options.elements.kindSelect.value as InstantEventKind,
          title: options.elements.titleInput.value.trim() || "אירוע",
          hour,
          minute
        };
        options.onRegularEventSubmit(
          nextEvent,
          options.readAlertFormSettings(options.elements.eventAlertControls)
        );
      };

      options.elements.eventForm.addEventListener("submit", handleEventSubmit);
      lifecycle.add(() => options.elements.eventForm.removeEventListener("submit", handleEventSubmit));

      const handleDerivedSubmit = (event: SubmitEvent) => {
        event.preventDefault();

        const validationError = validateDerivedEventForm(options.elements);
        if (validationError) {
          options.elements.derivedError.textContent = validationError;
          return;
        }

        options.elements.derivedError.textContent = "";
        const eventId = `derived-${Date.now()}`;
        const nextEvent: DerivedEventDefinition = {
          id: eventId,
          title: options.elements.derivedTitleInput.value.trim() || "אירוע מיוחד",
          base: options.elements.derivedBaseSelect.value as DerivedBase,
          direction: options.elements.derivedDirectionSelect.value as DerivedDirection,
          offsetValue: Number(options.elements.derivedOffsetInput.value),
          offsetUnit: options.elements.derivedOffsetUnitSelect.value as DerivedOffsetUnit
        };
        options.onDerivedEventSubmit(
          nextEvent,
          options.readAlertFormSettings(options.elements.derivedEventAlertControls)
        );
      };

      options.elements.derivedForm.addEventListener("submit", handleDerivedSubmit);
      lifecycle.add(() => options.elements.derivedForm.removeEventListener("submit", handleDerivedSubmit));
    },

    destroy() {
      lifecycle.destroy();
    }
  };
}

function validateEventForm(elements: EventEditorElements): string {
  const hour = Number(elements.hourInput.value);
  const minute = Number(elements.minuteInput.value);

  elements.hourInput.setCustomValidity("");
  elements.minuteInput.setCustomValidity("");

  const result = validateEventTime(hour, minute);
  if (!result.valid) {
    if (result.field === "hour") {
      elements.hourInput.setCustomValidity(result.message);
    } else {
      elements.minuteInput.setCustomValidity(result.message);
    }
    return result.message;
  }

  return "";
}

function validateDerivedEventForm(elements: EventEditorElements): string {
  const offsetValue = Number(elements.derivedOffsetInput.value);

  elements.derivedOffsetInput.setCustomValidity("");

  const result = validateNonNegativeOffset(offsetValue);
  if (!result.valid) {
    elements.derivedOffsetInput.setCustomValidity(result.message);
    return result.message;
  }

  return "";
}

function createEventId(kind: string, hour: number, minute: number): string {
  return `${kind}-${ringForTime(hour, minute)}-${hour}-${minute}-${Date.now()}`;
}
