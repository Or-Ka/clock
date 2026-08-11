export const MAX_IMPORT_FILE_BYTES = 1_048_576;

const MAX_IMPORT_DEPTH = 20;
const MAX_IMPORT_NODES = 5_000;
const MAX_COLLECTION_ENTRIES = 500;
const MAX_GENERIC_STRING_LENGTH = 1_000;
const FORBIDDEN_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function assertImportPayloadWithinLimits(payload: unknown): void {
  const pending: Array<{ readonly value: unknown; readonly depth: number }> = [{ value: payload, depth: 0 }];
  let visitedNodes = 0;

  while (pending.length > 0) {
    const entry = pending.pop();
    if (entry === undefined) {
      break;
    }

    visitedNodes += 1;
    if (visitedNodes > MAX_IMPORT_NODES) {
      throw new Error("קובץ הייבוא מכיל יותר מדי נתונים.");
    }
    if (entry.depth > MAX_IMPORT_DEPTH) {
      throw new Error("קובץ הייבוא מקונן עמוק מדי.");
    }

    if (typeof entry.value === "string") {
      if (entry.value.length > MAX_GENERIC_STRING_LENGTH) {
        throw new Error("קובץ הייבוא מכיל טקסט ארוך מדי.");
      }
      continue;
    }

    if (Array.isArray(entry.value)) {
      if (entry.value.length > MAX_COLLECTION_ENTRIES) {
        throw new Error("קובץ הייבוא מכיל רשימה ארוכה מדי.");
      }
      for (const value of entry.value) {
        pending.push({ value, depth: entry.depth + 1 });
      }
      continue;
    }

    if (!isRecord(entry.value)) {
      continue;
    }

    const entries = Object.entries(entry.value);
    if (entries.length > MAX_COLLECTION_ENTRIES) {
      throw new Error("קובץ הייבוא מכיל אובייקט גדול מדי.");
    }
    for (const [key, value] of entries) {
      if (FORBIDDEN_OBJECT_KEYS.has(key)) {
        throw new Error("קובץ הייבוא מכיל מפתח שאינו נתמך.");
      }
      pending.push({ value, depth: entry.depth + 1 });
    }
  }
}

export function isSafeIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value.trim() === value &&
    !containsControlCharacter(value, false)
  );
}

export function isSafeDisplayText(value: unknown, maximumLength = 240): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maximumLength &&
    !containsControlCharacter(value, true)
  );
}

export function isOptionalSafeDisplayText(value: unknown, maximumLength = 500): value is string | undefined {
  return value === undefined || isSafeDisplayText(value, maximumLength);
}

export function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= minimum && value <= maximum;
}

export function isFiniteNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[\da-f]{6}$/iu.test(value);
}

export function hasUniqueIds(values: readonly { readonly id: string }[]): boolean {
  return new Set(values.map((value) => value.id)).size === values.length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function containsControlCharacter(value: string, allowCommonWhitespace: boolean): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isAllowedWhitespace = allowCommonWhitespace && (code === 9 || code === 10 || code === 13);
    if ((code < 32 && !isAllowedWhitespace) || code === 127) {
      return true;
    }
  }

  return false;
}
