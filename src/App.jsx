import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import LayoutShell from "@/components/LayoutShell";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { isNativeApp } from "@/lib/mobile";
import PageNotFound from "@/lib/PageNotFound";
import { queryClientInstance } from "@/lib/query-client";
import DashboardHome from "@/pages/DashboardHome";
import DiscoverHub from "@/pages/DiscoverHub";
import Favorites from "@/pages/Favorites";
import Folders from "@/pages/Folders";
import FolderView from "@/pages/FolderView";
import ManuscriptEditorPage from "@/pages/ManuscriptEditorPage";
import ProjectView from "@/pages/ProjectView";
import Projects from "@/pages/Projects";
import PublicAuthorProfilePage from "@/pages/PublicAuthorProfilePage";
import PublicWorkPage from "@/pages/PublicWorkPage";
import SearchPage from "@/pages/SearchPage";
import Settings from "@/pages/Settings";
import AuthPage from "@/pages/AuthPage";

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

  if (authError) {
    if (authError.type === "user_not_registered") return <UserNotRegisteredError />;
    if (authError.type === "auth_required") return <AuthPage />;
  }

  return (
    <Routes>
      <Route path="/manuscript/:id" element={<ManuscriptEditorPage />} />
      <Route element={<LayoutShell />}>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/discover" element={<DiscoverHub />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:id" element={<ProjectView />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/folder/:id" element={<FolderView />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/autor/:username" element={<PublicAuthorProfilePage />} />
        <Route path="/obra/:id" element={<PublicWorkPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const Router = isNativeApp() ? HashRouter : BrowserRouter;

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
