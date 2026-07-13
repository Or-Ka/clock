export type ImportExportElements = {
  readonly exportButton: HTMLButtonElement;
  readonly importButton: HTMLButtonElement;
  readonly fileInput: HTMLInputElement;
  readonly status: HTMLElement;
};

export type ImportExportController = {
  readonly start: () => void;
  readonly destroy: () => void;
};

export type ImportExportControllerDeps<TExportState> = {
  readonly document: Document;
  readonly window: Window & typeof globalThis;
  readonly elements: ImportExportElements;
  readonly createExportState: () => TExportState;
  readonly applyImportedState: (payload: unknown) => void;
  readonly exportFileName: () => string;
};

export function serializeExportState<TExportState>(state: TExportState): string {
  return JSON.stringify(state, null, 2);
}

export function createImportExportController<TExportState>(
  deps: ImportExportControllerDeps<TExportState>
): ImportExportController {
  const cleanups: Array<() => void> = [];
  let started = false;

  function addEventListener(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener);
    cleanups.push(() => target.removeEventListener(type, listener));
  }

  function exportAppState(): void {
    const state = deps.createExportState();
    const blob = new deps.window.Blob([serializeExportState(state)], { type: "application/json" });
    const url = deps.window.URL.createObjectURL(blob);
    const link = deps.document.createElement("a");
    link.href = url;
    link.download = deps.exportFileName();
    link.click();
    deps.window.setTimeout(() => deps.window.URL.revokeObjectURL(url), 0);
    deps.elements.status.textContent = "הייצוא נשמר כקובץ JSON.";
  }

  async function importAppStateFromInput(): Promise<void> {
    const file = deps.elements.fileInput.files?.[0];
    if (file === undefined) {
      return;
    }

    try {
      deps.applyImportedState(JSON.parse(await file.text()));
      deps.elements.status.textContent = "הייבוא הושלם.";
    } catch (error) {
      deps.elements.status.textContent = error instanceof Error ? error.message : "לא ניתן לייבא את הקובץ.";
    } finally {
      deps.elements.fileInput.value = "";
    }
  }

  return {
    start() {
      if (started) {
        return;
      }

      started = true;
      addEventListener(deps.elements.exportButton, "click", exportAppState);
      addEventListener(deps.elements.importButton, "click", () => deps.elements.fileInput.click());
      addEventListener(deps.elements.fileInput, "change", () => {
        void importAppStateFromInput();
      });
    },

    destroy() {
      if (!started) {
        return;
      }

      started = false;
      for (const cleanup of cleanups.splice(0).reverse()) {
        cleanup();
      }
    }
  };
}
