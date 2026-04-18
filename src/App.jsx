import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import LayoutShellFixed from "@/components/LayoutShellFixed";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { isNativeApp } from "@/lib/mobile";
import PageNotFound from "@/lib/PageNotFound";
import { queryClientInstance } from "@/lib/query-client";
const DashboardHomeRefined = lazy(() => import("@/pages/DashboardHomeRefined"));
const CommunityGuidelinesPage = lazy(() => import("@/pages/CommunityGuidelinesPage"));
const DeleteAccountPage = lazy(() => import("@/pages/DeleteAccountPage"));
const DiscoverHub = lazy(() => import("@/pages/DiscoverHub"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Folders = lazy(() => import("@/pages/Folders"));
const FolderView = lazy(() => import("@/pages/FolderView"));
const ManuscriptEditorPage = lazy(() => import("@/pages/ManuscriptEditorPage"));
const ProjectView = lazy(() => import("@/pages/ProjectView"));
const Projects = lazy(() => import("@/pages/Projects"));
const PublicProfilePage = lazy(() => import("@/pages/PublicProfilePage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const PublicWorkPageResolved = lazy(() => import("@/pages/PublicWorkPageResolved"));
const PublicWorksPage = lazy(() => import("@/pages/PublicWorksPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const Settings = lazy(() => import("@/pages/Settings"));
const AuthPageResolved = lazy(() => import("@/pages/AuthPageResolved"));
const TermsOfUsePage = lazy(() => import("@/pages/TermsOfUsePage"));

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) return <LoadingScreen />;

  const shouldShowAuthenticatedApp = isAuthenticated && !!user;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/auth" element={<AuthPageResolved />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/delete-account" element={<DeleteAccountPage />} />
        <Route path="/terms" element={<TermsOfUsePage />} />
        <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
        <Route path="/obra/:id" element={<PublicWorkPageResolved />} />
        <Route path="/autor/:username" element={<PublicProfilePage />} />
        {!shouldShowAuthenticatedApp && authError?.type === "user_not_registered" ? (
          <Route path="*" element={<UserNotRegisteredError />} />
        ) : !shouldShowAuthenticatedApp ? (
          <Route path="*" element={<AuthPageResolved />} />
        ) : (
          <>
            <Route path="/manuscript/:id" element={<ManuscriptEditorPage />} />
            <Route element={<LayoutShellFixed />}>
              <Route path="/" element={<DashboardHomeRefined />} />
              <Route path="/discover" element={<DiscoverHub />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/public-works" element={<PublicWorksPage />} />
              <Route path="/project/:id" element={<ProjectView />} />
              <Route path="/folders" element={<Folders />} />
              <Route path="/folder/:id" element={<FolderView />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/public-profile" element={<PublicProfilePage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<PageNotFound />} />
            </Route>
          </>
        )}
      </Routes>
    </Suspense>
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
