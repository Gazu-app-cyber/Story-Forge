import React, { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

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
    const currentUser = await base44.auth.login(credentials);
    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentUser;
  }

  async function register(payload) {
    const currentUser = await base44.auth.register(payload);
    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentUser;
  }

  async function logout() {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: "auth_required", message: "Autenticacao necessaria." });
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
