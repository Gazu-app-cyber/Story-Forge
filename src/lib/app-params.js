const FALLBACK_BASE44_APP_ID = "69dd02b08129a9c0986214cf";
const FALLBACK_BASE44_APP_BASE_URL = "https://singing-story-forge-hub.base44.app";

const isNode = typeof window === "undefined";
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function getStoredItem(key) {
  if (storage.getItem) return storage.getItem(key);
  return storage.get(key);
}

function setStoredItem(key, value) {
  if (storage.setItem) return storage.setItem(key, value);
  return storage.set(key, value);
}

function removeStoredItem(key) {
  if (storage.removeItem) return storage.removeItem(key);
  return storage.delete?.(key);
}

function resolveStoredValue(paramName) {
  if (paramName === "app_id" || paramName === "app_base_url") {
    return null;
  }

  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const storedValue = getStoredItem(storageKey);
  if (storedValue) return storedValue;

  if (paramName === "access_token") {
    return getStoredItem("token") || null;
  }

  return null;
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) return defaultValue ?? null;

  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl && searchParam) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    setStoredItem(storageKey, searchParam);
    return searchParam;
  }

  const storedValue = resolveStoredValue(paramName);
  if (storedValue) {
    return storedValue;
  }

  if (defaultValue !== undefined && defaultValue !== null && defaultValue !== "") {
    setStoredItem(storageKey, defaultValue);
    return defaultValue;
  }

  return null;
};

function getAppParams() {
  if (getAppParamValue("clear_access_token") === "true") {
    removeStoredItem("base44_access_token");
    removeStoredItem("token");
  }

  const resolvedAppId = import.meta.env.VITE_BASE44_APP_ID || FALLBACK_BASE44_APP_ID;
  const resolvedAppBaseUrl = import.meta.env.VITE_BASE44_APP_BASE_URL || FALLBACK_BASE44_APP_BASE_URL;

  setStoredItem("base44_app_id", resolvedAppId);
  setStoredItem("base44_app_base_url", resolvedAppBaseUrl);

  return {
    appId: resolvedAppId,
    token: getAppParamValue("access_token", { removeFromUrl: true }),
    fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
    functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || null }),
    appBaseUrl: resolvedAppBaseUrl
  };
}

export const appParams = { ...getAppParams() };
