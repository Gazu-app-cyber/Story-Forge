import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { getBrazilDateKey, shouldSendReminder } from "@/lib/streak";

const AuthContext = createContext();

function normalizeAuthError(error, fallbackMessage) {
  if (error?.type === "auth_required" || error?.status === 401) {
    return { type: "auth_required", message: error.message || "Autenticacao necessaria." };
  }
  return { type: "unknown", message: error?.message || fallbackMessage };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleSessionChange(event) {
      const changedKey = event?.detail?.key;
      if (!changedKey || changedKey === "storyforge_session" || changedKey === "storyforge_users") {
        checkAppState();
      }
    }

    window.addEventListener("storyforge:data-changed", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    window.addEventListener("focus", checkAppState);

    return () => {
      window.removeEventListener("storyforge:data-changed", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
      window.removeEventListener("focus", checkAppState);
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const interval = window.setInterval(() => {
      checkDailyReminder();
    }, 60 * 1000);

    checkDailyReminder();
    return () => window.clearInterval(interval);
  }, [user?.id, user?.wordsWrittenToday, user?.reminderSentDate, user?.wordsTrackingDate]);

  async function checkAppState() {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(normalizeAuthError(error, "Falha ao carregar a sessao."));
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function login(credentials) {
    try {
      const currentUser = await base44.auth.login(credentials);
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      const normalized = normalizeAuthError(error, "Não foi possível iniciar a sessão.");
      setAuthError(normalized);
      throw createReadableError(normalized.message);
    }
  }

  async function register(payload) {
    try {
      const currentUser = await base44.auth.register(payload);
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      const message = error?.message || "Não foi possível criar a conta.";
      setAuthError({ type: "unknown", message });
      throw createReadableError(message);
    }
  }

  async function logout() {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: "auth_required", message: "Autenticacao necessaria." });
  }

  async function checkDailyReminder() {
    try {
      const currentUser = await base44.auth.syncStreak();
      setUser(currentUser);

      if (!shouldSendReminder(currentUser)) return;

      const message = "Você ainda não atingiu sua meta de hoje. Escreva 100 palavras para manter sua sequência!";
      toast.warning(message, {
        id: `streak-reminder-${getBrazilDateKey()}`,
        duration: 10000
      });

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Meta diária do StoryForge", { body: message });
      }

      const updatedUser = await base44.auth.markReminderSent();
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to check streak reminder", error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: null,
        checkAppState,
        login,
        register,
        logout,
        navigateToLogin: () => {}
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function createReadableError(message) {
  const error = new Error(message);
  error.message = message;
  return error;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
