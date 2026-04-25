import { Suspense, lazy, useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from "react-router-dom";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import AuthPageResolved from "@/pages/AuthPageResolved";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { isNativeApp } from "@/lib/mobile";
import PageNotFound from "@/lib/PageNotFound";
import { queryClientInstance } from "@/lib/query-client";

const CommunityGuidelinesPage = lazy(() => import("@/pages/CommunityGuidelinesPage"));
const DashboardHomeRefined = lazy(() => import("@/pages/DashboardHomeRefined"));
const DeleteAccountPage = lazy(() => import("@/pages/DeleteAccountPage"));
const DiscoverHub = lazy(() => import("@/pages/DiscoverHub"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Folders = lazy(() => import("@/pages/Folders"));
const FolderView = lazy(() => import("@/pages/FolderView"));
const LayoutShellFixed = lazy(() => import("@/components/LayoutShellFixed"));
const ManuscriptEditorPage = lazy(() => import("@/pages/ManuscriptEditorPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const ProjectView = lazy(() => import("@/pages/ProjectView"));
const Projects = lazy(() => import("@/pages/Projects"));
const PublicProfilePage = lazy(() => import("@/pages/PublicProfilePage"));
const PublicWorkPageResolved = lazy(() => import("@/pages/PublicWorkPageResolved"));
const PublicWorksPage = lazy(() => import("@/pages/PublicWorksPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const Settings = lazy(() => import("@/pages/Settings"));
const TermsOfUsePage = lazy(() => import("@/pages/TermsOfUsePage"));


function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function RouteLoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function DeferredRoute({ children }) {
  return <Suspense fallback={<RouteLoadingScreen />}>{children}</Suspense>;
}

function hasAuthCallbackHash(hash = "") {
  return /(access_token=|refresh_token=|token_hash=|type=recovery|type=signup|type=email)/.test(hash || "");
}

function isPublicOrCallbackRoute(pathname = "", hash = "") {
  return (
    pathname === "/auth" ||
    pathname === "/privacy" ||
    pathname === "/delete-account" ||
    pathname === "/terms" ||
    pathname === "/community-guidelines" ||
    pathname.startsWith("/obra/") ||
    pathname.startsWith("/autor/") ||
    hasAuthCallbackHash(hash)
  );
}

function getBackFallback(pathname = "") {
  if (pathname.startsWith("/project/")) return "/projects";
  if (pathname.startsWith("/public-works")) return "/";
  if (pathname.startsWith("/folder/")) return "/folders";
  if (pathname.startsWith("/discover")) return "/";
  if (pathname.startsWith("/obra/")) return "/public-works";
  if (pathname.startsWith("/autor/")) return "/discover";
  if (pathname.startsWith("/public-profile")) return "/";
  if (pathname === "/settings") return "/";
  if (pathname === "/favorites" || pathname === "/search" || pathname === "/folders") return "/";
  return "";
}

function closeOpenTransientLayer() {
  const activeLayer = document.querySelector('[data-ui-layer][data-state="open"]');
  if (!activeLayer) return false;

  const escapeEvent = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true
  });
  document.dispatchEvent(escapeEvent);

  const closeButton = document.querySelector('[data-ui-close="true"]');
  if (closeButton instanceof HTMLElement) {
    closeButton.click();
  }

  return true;
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();
  const location = useLocation();
  const native = isNativeApp();
  const [allowNativeBootFallback, setAllowNativeBootFallback] = useState(!native);

  useEffect(() => {
    if (!native) return undefined;

    if (!isLoadingAuth && !isLoadingPublicSettings) {
      setAllowNativeBootFallback(true);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAllowNativeBootFallback(true);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [isLoadingAuth, isLoadingPublicSettings, native]);

  useEffect(() => {
    if (!native) return undefined;

    let subscription = null;

    async function attachBackHandler() {
      try {
        subscription = await CapacitorApp.addListener("backButton", () => {
          if (closeOpenTransientLayer()) return;

          if (location.pathname === "/auth") return;

          const historyIndex = window.history.state?.idx ?? 0;
          if (historyIndex > 0) {
            navigate(-1);
            return;
          }

          const fallback = getBackFallback(location.pathname);
          if (fallback && fallback !== location.pathname) {
            navigate(fallback, { replace: true });
          }
        });
      } catch (error) {
        console.error("Failed to attach Android back handler", error);
      }
    }

    attachBackHandler();

    return () => {
      if (subscription?.remove) {
        subscription.remove().catch(() => {});
      }
    };
  }, [location.pathname, navigate, native]);

  const shouldBypassGlobalLoading = isPublicOrCallbackRoute(location.pathname, location.hash) || (native && allowNativeBootFallback);

  if ((isLoadingAuth || isLoadingPublicSettings) && !shouldBypassGlobalLoading) return <LoadingScreen />;

  const shouldShowAuthenticatedApp = isAuthenticated && !!user;

  return (
    <Routes>
      <Route path="/auth" element={<AuthPageResolved />} />
      <Route
        path="/privacy"
        element={
          <DeferredRoute>
            <PrivacyPolicyPage />
          </DeferredRoute>
        }
      />
      <Route
        path="/delete-account"
        element={
          <DeferredRoute>
            <DeleteAccountPage />
          </DeferredRoute>
        }
      />
      <Route
        path="/terms"
        element={
          <DeferredRoute>
            <TermsOfUsePage />
          </DeferredRoute>
        }
      />
      <Route
        path="/community-guidelines"
        element={
          <DeferredRoute>
            <CommunityGuidelinesPage />
          </DeferredRoute>
        }
      />
      <Route
        path="/obra/:id"
        element={
          <DeferredRoute>
            <PublicWorkPageResolved />
          </DeferredRoute>
        }
      />
      <Route
        path="/autor/:username"
        element={
          <DeferredRoute>
            <PublicProfilePage />
          </DeferredRoute>
        }
      />
      {!shouldShowAuthenticatedApp && authError?.type === "user_not_registered" ? (
        <Route path="*" element={<UserNotRegisteredError />} />
      ) : !shouldShowAuthenticatedApp ? (
        <Route path="*" element={<AuthPageResolved />} />
      ) : (
        <>
          <Route
            path="/manuscript/:id"
            element={
              <DeferredRoute>
                <ManuscriptEditorPage />
              </DeferredRoute>
            }
          />
          <Route
            element={
              <DeferredRoute>
                <LayoutShellFixed />
              </DeferredRoute>
            }
          >
            <Route
              path="/"
              element={
                <DeferredRoute>
                  <DashboardHomeRefined />
                </DeferredRoute>
              }
            />
            <Route
              path="/discover"
              element={
                <DeferredRoute>
                  <DiscoverHub />
                </DeferredRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <DeferredRoute>
                  <Projects />
                </DeferredRoute>
              }
            />
            <Route
              path="/public-works"
              element={
                <DeferredRoute>
                  <PublicWorksPage />
                </DeferredRoute>
              }
            />
            <Route
              path="/project/:id"
              element={
                <DeferredRoute>
                  <ProjectView />
                </DeferredRoute>
              }
            />
            <Route
              path="/folders"
              element={
                <DeferredRoute>
                  <Folders />
                </DeferredRoute>
              }
            />
            <Route
              path="/folder/:id"
              element={
                <DeferredRoute>
                  <FolderView />
                </DeferredRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <DeferredRoute>
                  <Favorites />
                </DeferredRoute>
              }
            />
            <Route
              path="/search"
              element={
                <DeferredRoute>
                  <SearchPage />
                </DeferredRoute>
              }
            />
            <Route
              path="/public-profile"
              element={
                <DeferredRoute>
                  <PublicProfilePage />
                </DeferredRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <DeferredRoute>
                  <Settings />
                </DeferredRoute>
              }
            />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </>
      )}
    </Routes>
  );
}

export default function App() {
  const Router = isNativeApp() ? HashRouter : BrowserRouter;

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
