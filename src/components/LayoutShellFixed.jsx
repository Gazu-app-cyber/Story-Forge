import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Compass, FolderOpen, Globe, Home, Library, Menu, PenTool, Plus, Search, Settings, Star, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CreatePublicWorkDialog from "@/components/CreatePublicWorkDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import "@/lib/theme";

const navItems = [
  { path: "/", icon: Home, label: "Inicio" },
  { path: "/discover", icon: Compass, label: "Descobrir" },
  { path: "/projects", icon: BookOpen, label: "Projetos" },
  { path: "/public-works", icon: Library, label: "Obras" },
  { path: "/folders", icon: FolderOpen, label: "Pastas" },
  { path: "/favorites", icon: Star, label: "Favoritos" },
  { path: "/search", icon: Search, label: "Buscar" }
];

function getPageMeta(pathname) {
  if (pathname.startsWith("/project/")) return { title: "Projeto", backTo: "/projects" };
  if (pathname.startsWith("/public-works")) return { title: "Obras", backTo: "/" };
  if (pathname.startsWith("/folder/")) return { title: "Pasta", backTo: "/folders" };
  if (pathname.startsWith("/discover")) return { title: "Descobrir", backTo: "/" };
  if (pathname.startsWith("/obra/")) return { title: "Obra publica", backTo: "/public-works" };
  if (pathname.startsWith("/autor/")) return { title: "Autor", backTo: "/discover" };
  if (pathname.startsWith("/public-profile")) return { title: "Perfil publico", backTo: "/" };
  if (pathname === "/settings") return { title: "Configuracoes", backTo: "/" };
  return null;
}

export default function LayoutShellFixed() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showCreatePublicWork, setShowCreatePublicWork] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const pageMeta = useMemo(() => getPageMeta(location.pathname), [location.pathname]);

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen ? <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-5" style={{ paddingTop: "max(1.25rem, var(--safe-top))" }}>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <PenTool className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight text-sidebar-foreground">Escritorio</span>
          </Link>
          <button className="text-muted-foreground lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 px-3 pb-2 pt-4">
          <button className="inline-flex h-9 w-full items-center justify-start gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm" onClick={() => navigate("/projects")}>
            <Plus className="h-4 w-4" />
            Novo projeto
          </button>
          <button className="inline-flex h-9 w-full items-center justify-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 text-sm font-medium text-primary shadow-sm" onClick={() => setShowCreatePublicWork(true)}>
            <Library className="h-4 w-4" />
            Nova obra publica
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive(item.path) ? "bg-primary/10 text-primary" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive(item.path) ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
              {item.label}
            </Link>
          ))}

          <div className="mt-2 border-t border-sidebar-border pt-2">
            <Link
              to="/public-profile"
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive("/public-profile") ? "bg-primary/10 text-primary" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Globe className={cn("h-4 w-4 shrink-0", isActive("/public-profile") ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
              Perfil público
            </Link>
            <Link
              to="/settings"
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive("/settings") ? "bg-primary/10 text-primary" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Settings className={cn("h-4 w-4 shrink-0", isActive("/settings") ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
              Configuracoes
            </Link>
          </div>
        </nav>

        {user ? (
          <div className="border-t border-sidebar-border p-3">
            <Link to="/settings" className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-sidebar-accent">
              {user.profile_image ? (
                <img src={user.profile_image} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-sm">
                  <span className="text-xs font-bold text-primary-foreground">{(user.display_name || user.full_name || "U")[0].toUpperCase()}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight text-sidebar-foreground">{user.display_name || user.full_name || "Usuario"}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              </div>
            </Link>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden" style={{ paddingTop: "var(--safe-top)" }}>
          <div className="flex items-center gap-3 px-4 py-3">
            {pageMeta ? (
              <button onClick={() => navigate(pageMeta.backTo)} className="text-foreground/70 transition-colors hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <button onClick={() => setSidebarOpen(true)} className="text-foreground/70 transition-colors hover:text-foreground">
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div className="flex min-w-0 items-center gap-2">
              {!pageMeta ? (
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                  <PenTool className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              ) : null}
              <span className="truncate text-sm font-semibold">{pageMeta?.title || "Escritorio"}</span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: isMobile ? 18 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isMobile ? -18 : 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="mobile-bottom-safe sticky bottom-0 z-30 border-t border-border bg-background/95 px-2 pt-2 backdrop-blur lg:hidden" style={{ paddingBottom: "calc(0.75rem + var(--safe-bottom))" }}>
          <div className="grid grid-cols-7 gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn("flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <CreatePublicWorkDialog open={showCreatePublicWork} onOpenChange={setShowCreatePublicWork} onSuccess={() => navigate("/public-works")} />
    </div>
  );
}
