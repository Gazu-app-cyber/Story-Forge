import { createClient } from "@supabase/supabase-js";
import { safeGetItem, safeRemoveItem, safeSetItem } from "@/lib/safeBrowserStorage";

const DEFAULT_SUPABASE_URL = "https://supzfqiiyzejkxqgdyyk.supabase.com";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cHpmcWlpeXplamt4cWdkeXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDAwNDUsImV4cCI6MjA5MjExNjA0NX0.3G5sB8LBVKBJ_ff5UFmg6btxmDn3smqlqJkdO68REaM";
const DEFAULT_PUBLIC_APP_URL = "https://story-forge-xi-nine.vercel.app";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const PUBLIC_APP_URL = (import.meta.env.VITE_PUBLIC_APP_URL || DEFAULT_PUBLIC_APP_URL).replace(/\/$/, "");
const NATIVE_AUTH_REDIRECT_URL = (import.meta.env.VITE_NATIVE_AUTH_REDIRECT_URL || "").trim();

const storage = {
  getItem(key) {
    return safeGetItem(key);
  },
  setItem(key, value) {
    safeSetItem(key, value);
  },
  removeItem(key) {
    safeRemoveItem(key);
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage
  }
});

export function getPublicAppUrl() {
  return PUBLIC_APP_URL;
}

export function getAuthRedirectUrl(action) {
  const baseUrl = NATIVE_AUTH_REDIRECT_URL || `${PUBLIC_APP_URL}/auth`;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}action=${encodeURIComponent(action)}`;
}

export function hasNativeAuthRedirectUrl() {
  return Boolean(NATIVE_AUTH_REDIRECT_URL);
}
