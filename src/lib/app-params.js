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

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) return defaultValue;

  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    setStoredItem(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue) {
    setStoredItem(storageKey, defaultValue);
    return defaultValue;
  }

  return getStoredItem(storageKey) || null;
};

function getAppParams() {
  if (getAppParamValue("clear_access_token") === "true") {
    storage.removeItem?.("base44_access_token");
    storage.removeItem?.("token");
  }

  return {
    appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
    token: getAppParamValue("access_token", { removeFromUrl: true }),
    fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
    functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
    appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL })
  };
}

export const appParams = { ...getAppParams() };
