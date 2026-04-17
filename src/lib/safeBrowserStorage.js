const memoryStore = new Map();
let storageAvailabilityChecked = false;
let cachedLocalStorage = null;

function canUseWindow() {
  return typeof window !== "undefined";
}

function getLocalStorage() {
  if (!canUseWindow()) return null;
  if (storageAvailabilityChecked) return cachedLocalStorage;

  try {
    const storage = window.localStorage;
    const probeKey = "__storyforge_storage_probe__";
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    cachedLocalStorage = storage;
    storageAvailabilityChecked = true;
    return cachedLocalStorage;
  } catch {
    cachedLocalStorage = null;
    storageAvailabilityChecked = true;
    return null;
  }
}

function getMemoryValue(key) {
  return memoryStore.has(key) ? memoryStore.get(key) : null;
}

export function isPersistentStorageAvailable() {
  return Boolean(getLocalStorage());
}

export function safeGetItem(key) {
  const storage = getLocalStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      return getMemoryValue(key);
    }
  }
  return getMemoryValue(key);
}

export function safeSetItem(key, value) {
  const normalized = String(value);
  const storage = getLocalStorage();

  if (storage) {
    try {
      storage.setItem(key, normalized);
      memoryStore.set(key, normalized);
      return true;
    } catch {
      memoryStore.set(key, normalized);
      return false;
    }
  }

  memoryStore.set(key, normalized);
  return false;
}

export function safeRemoveItem(key) {
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage removal failures and fall back to memory cleanup.
    }
  }
  memoryStore.delete(key);
}

export function safeReadJson(key, fallback) {
  const raw = safeGetItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function safeWriteJson(key, value) {
  return safeSetItem(key, JSON.stringify(value));
}

export function dispatchStoryforgeDataChanged(key) {
  if (!canUseWindow()) return;

  try {
    window.dispatchEvent(new CustomEvent("storyforge:data-changed", { detail: { key } }));
  } catch {
    try {
      const event = document.createEvent("CustomEvent");
      event.initCustomEvent("storyforge:data-changed", false, false, { key });
      window.dispatchEvent(event);
    } catch {
      // Ignore event dispatch issues on restrictive environments.
    }
  }
}

export function safeReplaceState(url) {
  if (!canUseWindow()) return;
  try {
    window.history.replaceState({}, document.title, url);
  } catch {
    // Ignore history failures in restrictive environments.
  }
}

export function safePushState(url) {
  if (!canUseWindow()) return;
  try {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch {
    window.location.assign(url);
  }
}
