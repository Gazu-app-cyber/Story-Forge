import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { getBrazilDateKey, shouldSendReminder } from "@/lib/streak";

const AuthContext = createContext();

function normalizeAuthError(error, fallbackMessage) {
  if (error?.type) {
    return { type: error.type, message: error.message || fallbackMessage };
  }
  if (error?.status === 401) {
    return { type: "auth_required", message: error.message || "Autenticacao necessaria." };
  }
  return { type: "unknown", message: error?.message || fallbackMessage };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const authRequestRef = useRef(0);

  const checkAppState = useCallback(async () => {
    const requestId = authRequestRef.current + 1;
    authRequestRef.current = requestId;

    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();

      if (authRequestRef.current !== requestId) return null;

      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      if (authRequestRef.current !== requestId) return null;

      setUser(null);
      setIsAuthenticated(false);
      setAuthError(normalizeAuthError(error, "Falha ao carregar a sessao."));
      return null;
    } finally {
      if (authRequestRef.current === requestId) {
        setIsLoadingAuth(false);
      }
    }
  }, []);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleSessionChange(event) {
      const changedKey = event?.detail?.key ?? event?.key ?? null;
      if (
        changedKey === "storyforge_session" ||
        changedKey === "storyforge_auth_register" ||
        changedKey === "storyforge_auth_delete"
      ) {
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
  }, [checkAppState]);

  useEffect(() => {
    if (!user) return undefined;

    const interval = window.setInterval(() => {
      checkDailyReminder();
    }, 60 * 1000);

    checkDailyReminder();
    return () => window.clearInterval(interval);
  }, [user?.id, user?.wordsWrittenToday, user?.reminderSentDate, user?.wordsTrackingDate]);

  async function login(credentials) {
    try {
      const currentUser = await base44.auth.login(credentials);
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      const normalized = normalizeAuthError(error, "Não foi possível iniciar a sessão.");
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(normalized);
      throw createReadableError(normalized.message);
    }
  }

  async function register(payload) {
    try {
      const result = await base44.auth.register(payload);
      if (result?.status === "verification_required") {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: "email_not_verified", message: result.message });
        return result;
      }
      setUser(result);
      setIsAuthenticated(true);
      setAuthError(null);
      return result;
    } catch (error) {
      const message = error?.message || "Não foi possível criar a conta.";
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(normalizeAuthError(error, message));
      throw createReadableError(message);
    }
  }

  async function logout() {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: "auth_required", message: "Autenticacao necessaria." });
  }

  async function resendVerificationEmail(email) {
    try {
      const result = await base44.auth.resendVerificationEmail(email);
      setAuthError({ type: "email_not_verified", message: result.message });
      return result;
    } catch (error) {
      const normalized = normalizeAuthError(error, "Nao foi possivel reenviar a verificacao.");
      setAuthError(normalized);
      throw createReadableError(normalized.message);
    }
  }

  async function requestPasswordReset(email) {
    try {
      return await base44.auth.requestPasswordReset(email);
    } catch (error) {
      const normalized = normalizeAuthError(error, "Nao foi possivel enviar a recuperacao de senha.");
      setAuthError(normalized);
      throw createReadableError(normalized.message);
    }
  }

  async function verifyEmail(token) {
    try {
      return await base44.auth.verifyEmail(token);
    } catch (error) {
      const normalized = normalizeAuthError(error, "Nao foi possivel verificar o email.");
      setAuthError(normalized);
      throw createReadableError(normalized.message);
    }
  }

  async function resetPassword(token, password) {
    try {
      return await base44.auth.resetPassword(token, password);
    } catch (error) {
      const normalized = normalizeAuthError(error, "Nao foi possivel redefinir a senha.");
      setAuthError(normalized);
      throw createReadableError(normalized.message);
    }
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
        resendVerificationEmail,
        requestPasswordReset,
        verifyEmail,
        resetPassword,
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
