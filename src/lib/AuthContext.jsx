import React, { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  function toAuthError(error, fallbackMessage) {
    const reason = error?.data?.extra_data?.reason;
    if (reason === "user_not_registered") {
      return { type: "user_not_registered", message: error?.message || "User not registered" };
    }
    if (reason === "auth_required" || error?.status === 401 || error?.status === 403) {
      return { type: "auth_required", message: error?.message || "Authentication required" };
    }
    return { type: "unknown", message: error?.message || fallbackMessage };
  }

  async function checkUserAuth() {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(toAuthError(error, "Failed to authenticate user"));
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function checkAppState() {
    try {
      setIsLoadingAuth(true);
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      if (!appParams.appId) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: "unknown", message: "Base44 app ID is missing." });
        return;
      }

      setAppPublicSettings({
        id: appParams.appId,
        appBaseUrl: appParams.appBaseUrl || null
      });

      if (!appParams.token) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: "auth_required", message: "Authentication required" });
        return;
      }

      await checkUserAuth();
    } catch (appError) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(toAuthError(appError, "Failed to load app"));
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  }

  function logout(shouldRedirect = true) {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  }

  function navigateToLogin() {
    base44.auth.redirectToLogin(window.location.href);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
