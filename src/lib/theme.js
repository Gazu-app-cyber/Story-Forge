export const COLOR_PRESETS = {
  indigo: {
    label: "Índigo",
    light: { primary: "250 40% 45%", ring: "250 40% 45%" },
    dark: { primary: "250 50% 60%", ring: "250 50% 60%" }
  },
  violet: {
    label: "Violeta",
    light: { primary: "270 45% 48%", ring: "270 45% 48%" },
    dark: { primary: "270 55% 65%", ring: "270 55% 65%" }
  },
  rose: {
    label: "Rosa",
    light: { primary: "345 55% 48%", ring: "345 55% 48%" },
    dark: { primary: "345 60% 62%", ring: "345 60% 62%" }
  },
  emerald: {
    label: "Esmeralda",
    light: { primary: "160 55% 38%", ring: "160 55% 38%" },
    dark: { primary: "160 50% 52%", ring: "160 50% 52%" }
  },
  amber: {
    label: "Âmbar",
    light: { primary: "35 85% 42%", ring: "35 85% 42%" },
    dark: { primary: "35 90% 56%", ring: "35 90% 56%" }
  },
  sky: {
    label: "Azul",
    light: { primary: "205 80% 42%", ring: "205 80% 42%" },
    dark: { primary: "205 80% 58%", ring: "205 80% 58%" }
  }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToHsl(hex) {
  const normalized = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case r:
        hue = ((g - b) / delta) % 6;
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
        break;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100)
  };
}

function getCustomColorVars(hex, mode) {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  const saturation = clamp(hsl.s, 32, 92);
  const lightness = mode === "dark" ? clamp(hsl.l + 10, 48, 66) : clamp(hsl.l, 32, 58);
  return {
    primary: `${hsl.h} ${saturation}% ${lightness}%`,
    ring: `${hsl.h} ${clamp(saturation, 36, 92)}% ${mode === "dark" ? clamp(lightness + 2, 50, 70) : clamp(lightness - 2, 28, 56)}%`
  };
}

export function isCustomColorActive(theme = getTheme()) {
  return Boolean(theme.custom_primary);
}

function getStoredTheme() {
  try {
    return JSON.parse(localStorage.getItem("escritorio_theme") || "{}");
  } catch {
    return {};
  }
}

function getResolvedMode(theme) {
  const themeMode = theme.theme_mode || (theme.dark_mode ? "dark" : "system");
  if (themeMode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return themeMode;
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolvedMode = getResolvedMode(theme);
  root.classList.toggle("dark", resolvedMode === "dark");
  const customVars = theme.custom_primary ? getCustomColorVars(theme.custom_primary, resolvedMode) : null;
  const colorKey = theme.color_preset || "indigo";
  const preset = COLOR_PRESETS[colorKey] || COLOR_PRESETS.indigo;
  const vars = customVars || (resolvedMode === "dark" ? preset.dark : preset.light);
  root.style.setProperty("--primary", vars.primary);
  root.style.setProperty("--ring", vars.ring);
  root.style.setProperty("--sidebar-primary", vars.primary);
  root.style.setProperty("--sidebar-ring", vars.ring);
}

export function saveTheme(themeData) {
  const current = getStoredTheme();
  const merged = { ...current, ...themeData };
  localStorage.setItem("escritorio_theme", JSON.stringify(merged));
  applyTheme(merged);
}

export function getTheme() {
  return getStoredTheme();
}

export function getResolvedThemeMode(theme = getTheme()) {
  return getResolvedMode(theme);
}

export function initThemeWatcher() {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => applyTheme(getStoredTheme());
  media.addEventListener("change", handler);
  applyTheme(getStoredTheme());
  return () => media.removeEventListener("change", handler);
}

applyTheme(getStoredTheme());
