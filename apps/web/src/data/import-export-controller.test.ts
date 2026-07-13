// @ts-expect-error jsdom is already a dev dependency, but the project does not ship @types/jsdom.
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";

import { createImportExportController, serializeExportState } from "./import-export-controller.js";

describe("createImportExportController", () => {
  it("downloads the current version 1 state as formatted JSON", () => {
    const harness = createHarness();
    const click = vi.spyOn(harness.window.HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      harness.clickedDownload = this.download;
      harness.clickedHref = this.href;
    });

    harness.controller.start();
    harness.exportButton.click();

    expect(harness.createExportState).toHaveBeenCalledTimes(1);
    expect(harness.createObjectURL).toHaveBeenCalledTimes(1);
    expect(harness.clickedDownload).toBe("analog-event-clock-2026-07-13.json");
    expect(harness.clickedHref).toBe("blob:test-export");
    expect(harness.status.textContent).toBe("הייצוא נשמר כקובץ JSON.");
    expect(serializeExportState(harness.exportState)).toBe(
      '{\n  "version": 1,\n  "selectedLocationId": "jerusalem"\n}'
    );

    click.mockRestore();
  });

  it("reads and applies a selected JSON file, then clears the input", async () => {
    const harness = createHarness();
    const file = new harness.window.File(['{"selectedLocationId":"tel-aviv"}'], "clock.json", {
      type: "application/json"
    });
    Object.defineProperty(harness.fileInput, "files", { configurable: true, value: [file] });
    Object.defineProperty(harness.fileInput, "value", {
      configurable: true,
      writable: true,
      value: "C:\\fakepath\\clock.json"
    });

    harness.controller.start();
    harness.fileInput.dispatchEvent(new harness.window.Event("change"));
    await vi.waitFor(() => expect(harness.applyImportedState).toHaveBeenCalledTimes(1));

    expect(harness.applyImportedState).toHaveBeenCalledWith({ selectedLocationId: "tel-aviv" });
    expect(harness.status.textContent).toBe("הייבוא הושלם.");
    expect(harness.fileInput.value).toBe("");
  });

  it("shows import validation errors and still clears the input", async () => {
    const harness = createHarness();
    const file = new harness.window.File(["{}"], "clock.json", { type: "application/json" });
    Object.defineProperty(harness.fileInput, "files", { configurable: true, value: [file] });
    Object.defineProperty(harness.fileInput, "value", {
      configurable: true,
      writable: true,
      value: "C:\\fakepath\\clock.json"
    });
    harness.applyImportedState.mockImplementation(() => {
      throw new Error("קובץ הייבוא לא נראה תקין.");
    });

    harness.controller.start();
    harness.fileInput.dispatchEvent(new harness.window.Event("change"));
    await vi.waitFor(() => expect(harness.status.textContent).toBe("קובץ הייבוא לא נראה תקין."));

    expect(harness.fileInput.value).toBe("");
  });

  it("guards repeated starts and removes all listeners on destroy", () => {
    const harness = createHarness();
    const fileInputClick = vi.spyOn(harness.fileInput, "click").mockImplementation(() => undefined);

    harness.controller.start();
    harness.controller.start();
    harness.importButton.click();
    expect(fileInputClick).toHaveBeenCalledTimes(1);

    harness.controller.destroy();
    harness.importButton.click();
    harness.exportButton.click();
    expect(fileInputClick).toHaveBeenCalledTimes(1);
    expect(harness.createExportState).not.toHaveBeenCalled();
  });
});

function createHarness() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://clock.test" });
  const window = dom.window as unknown as Window & typeof globalThis;
  const document = window.document;
  const exportButton = document.createElement("button");
  const importButton = document.createElement("button");
  const fileInput = document.createElement("input");
  const status = document.createElement("p");
  fileInput.type = "file";
  document.body.append(exportButton, importButton, fileInput, status);

  const exportState = { version: 1 as const, selectedLocationId: "jerusalem" };
  const createExportState = vi.fn(() => exportState);
  const applyImportedState = vi.fn();
  const createObjectURL = vi.fn(() => "blob:test-export");
  const revokeObjectURL = vi.fn();
  Object.assign(window.URL, { createObjectURL, revokeObjectURL });

  return {
    window,
    exportButton,
    importButton,
    fileInput,
    status,
    exportState,
    createExportState,
    applyImportedState,
    createObjectURL,
    clickedDownload: "",
    clickedHref: "",
    controller: createImportExportController({
      document,
      window,
      elements: { exportButton, importButton, fileInput, status },
      createExportState,
      applyImportedState,
      exportFileName: () => "analog-event-clock-2026-07-13.json"
    })
  };
}
