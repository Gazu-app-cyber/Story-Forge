import React, { createContext, useContext, useEffect, useState } from "react";
import { createAxiosClient } from "@base44/sdk/dist/utils/axios-client";
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

  async function checkUserAuth() {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: "auth_required", message: "Authentication required" });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function checkAppState() {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      const appClient = createAxiosClient({
        baseURL: "/api/apps/public",
        headers: { "X-App-Id": appParams.appId },
        token: appParams.token,
        interceptResponses: true
      });
      const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
      setAppPublicSettings(publicSettings);
      if (appParams.token) {
        await checkUserAuth();
      } else {
        setAuthError({ type: "auth_required", message: "Authentication required" });
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
    } catch (appError) {
      const reason = appError?.data?.extra_data?.reason;
      if (appError?.status === 403 && reason) {
        setAuthError({ type: reason, message: appError.message });
      } else {
        setAuthError({ type: "unknown", message: appError?.message || "Failed to load app" });
      }
      setIsLoadingAuth(false);
    } finally {
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
