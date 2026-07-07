// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createEventEditorController, type AlertFormControls } from "./event-editor-controller.js";

describe("createEventEditorController", () => {
  it("handles form toggles and regular event submission without owning application state", () => {
    const elements = createElements();
    const activeForms: Array<string | undefined> = [];
    const onRegularEventSubmit = vi.fn();
    const onDerivedEventSubmit = vi.fn();
    const controller = createEventEditorController({
      elements,
      setActiveForm: (formName) => activeForms.push(formName),
      readAlertFormSettings,
      onRegularEventSubmit,
      onDerivedEventSubmit
    });

    const toggle = elements.eventFormToggles[0];
    if (toggle === undefined) {
      throw new Error("missing event form toggle");
    }

    controller.start();
    toggle.click();
    elements.eventForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    controller.destroy();
    toggle.click();

    expect(activeForms).toEqual(["regular"]);
    expect(onRegularEventSubmit).toHaveBeenCalledTimes(1);
    expect(onDerivedEventSubmit).not.toHaveBeenCalled();
    expect(onRegularEventSubmit.mock.calls[0]?.[0]).toMatchObject({
      type: "instant",
      kind: "custom",
      title: "בדיקה",
      hour: 10,
      minute: 5
    });
    expect(onRegularEventSubmit.mock.calls[0]?.[0].id).toContain("custom-");
    expect(onRegularEventSubmit.mock.calls[0]?.[1]).toMatchObject({
      enabled: true,
      sound: true,
      desktop: false,
      direction: "before",
      offsetValue: 7,
      offsetUnit: "minutes"
    });
  });

  it("keeps invalid regular events inside the form boundary", () => {
    const elements = createElements();
    const onRegularEventSubmit = vi.fn();
    const controller = createEventEditorController({
      elements: { ...elements, hourInput: input("30") },
      setActiveForm: vi.fn(),
      readAlertFormSettings,
      onRegularEventSubmit,
      onDerivedEventSubmit: vi.fn()
    });

    controller.start();
    elements.eventForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(onRegularEventSubmit).not.toHaveBeenCalled();
    expect(elements.eventError.textContent).not.toBe("");
  });

  it("submits derived events and removes listeners on destroy", () => {
    const elements = createElements();
    const onDerivedEventSubmit = vi.fn();
    const controller = createEventEditorController({
      elements,
      setActiveForm: vi.fn(),
      readAlertFormSettings,
      onRegularEventSubmit: vi.fn(),
      onDerivedEventSubmit
    });

    controller.start();
    elements.derivedForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    controller.destroy();
    elements.derivedForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(onDerivedEventSubmit).toHaveBeenCalledTimes(1);
    expect(onDerivedEventSubmit.mock.calls[0]?.[0]).toMatchObject({
      title: "מיוחד",
      base: "sunrise",
      direction: "after",
      offsetValue: 12,
      offsetUnit: "minutes"
    });
  });
});

function createElements() {
  const eventForm = document.createElement("form");
  const derivedForm = document.createElement("form");
  const eventFormToggle = document.createElement("button");
  eventFormToggle.dataset.eventFormToggle = "regular";
  eventFormToggle.setAttribute("aria-expanded", "false");

  return {
    eventFormToggles: [eventFormToggle],
    eventForm,
    kindSelect: select("custom"),
    titleInput: input("בדיקה"),
    hourInput: input("10"),
    minuteInput: input("5"),
    eventAlertControls: alertControls(),
    eventError: document.createElement("p"),
    derivedForm,
    derivedTitleInput: input("מיוחד"),
    derivedBaseSelect: select("sunrise"),
    derivedDirectionSelect: select("after"),
    derivedOffsetInput: input("12"),
    derivedOffsetUnitSelect: select("minutes"),
    derivedEventAlertControls: alertControls(),
    derivedError: document.createElement("p")
  };
}

function alertControls(): AlertFormControls {
  return {
    enabled: checkedInput(true),
    sound: checkedInput(true),
    desktop: checkedInput(false),
    direction: select("before"),
    offset: input("7"),
    unit: select("minutes")
  };
}

function readAlertFormSettings(controls: AlertFormControls) {
  return {
    enabled: controls.enabled.checked,
    sound: controls.sound.checked,
    desktop: controls.desktop.checked,
    direction: controls.direction.value === "after" ? "after" as const : "before" as const,
    offsetValue: Number(controls.offset.value),
    offsetUnit: controls.unit.value === "hours" ? "hours" as const : "minutes" as const
  };
}

function input(value: string): HTMLInputElement {
  const element = document.createElement("input");
  element.value = value;
  return element;
}

function checkedInput(checked: boolean): HTMLInputElement {
  const element = document.createElement("input");
  element.type = "checkbox";
  element.checked = checked;
  return element;
}

function select(value: string): HTMLSelectElement {
  const element = document.createElement("select");
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  element.append(option);
  element.value = value;
  return element;
}
