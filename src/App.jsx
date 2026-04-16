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
import DashboardHomeRefined from "@/pages/DashboardHomeRefined";
import DiscoverHub from "@/pages/DiscoverHub";
import Favorites from "@/pages/Favorites";
import Folders from "@/pages/Folders";
import FolderView from "@/pages/FolderView";
import ManuscriptEditorPage from "@/pages/ManuscriptEditorPage";
import ProjectView from "@/pages/ProjectView";
import Projects from "@/pages/Projects";
import PublicProfilePage from "@/pages/PublicProfilePage";
import PublicWorkPageResolved from "@/pages/PublicWorkPageResolved";
import PublicWorksPage from "@/pages/PublicWorksPage";
import SearchPage from "@/pages/SearchPage";
import Settings from "@/pages/Settings";
import AuthPageFixed from "@/pages/AuthPageFixed";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function AuthenticatedApp() {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/obra/:id" element={<PublicWorkPageResolved />} />
      <Route path="/autor/:username" element={<PublicProfilePage />} />
      {authError?.type === "user_not_registered" ? (
        <Route path="*" element={<UserNotRegisteredError />} />
      ) : authError?.type === "auth_required" ? (
        <Route path="*" element={<AuthPageFixed />} />
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
