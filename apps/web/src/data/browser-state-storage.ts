export function loadStoredJson(storage: Storage, key: string): unknown | undefined {
  try {
    const value = storage.getItem(key);
    return value === null ? undefined : JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function saveStoredJson(storage: Storage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
