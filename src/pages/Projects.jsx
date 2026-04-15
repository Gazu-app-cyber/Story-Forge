import { useEffect, useMemo, useState } from "react";
import { BookOpen, Grid2X2, LayoutList, Loader2, Plus, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import ProjectCard from "@/components/ProjectCard";
import { checkProjectLimit, PLAN_DEFINITIONS } from "@/lib/planLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PROJECT_VIEW_STORAGE_KEY = "storyforge_project_view_mode";

const sortOptions = [
  { value: "updated_date", label: "Última edição" },
  { value: "created_date", label: "Data de criação" },
  { value: "name", label: "Nome" }
];

const projectSortOptions = [
  { value: "name_asc", label: "Nome (A - Z)" },
  { value: "name_desc", label: "Nome (Z - A)" },
  { value: "created_desc", label: "Criacao (mais recente)" },
  { value: "created_asc", label: "Criacao (mais antiga)" },
  { value: "updated_desc", label: "Modificacao (recente)" },
  { value: "updated_asc", label: "Modificacao (antiga)" }
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, folderData, currentUser] = await Promise.all([
        base44.entities.Project.list("-updated_date", 200),
        base44.entities.Folder.list("-created_date", 50),
        base44.auth.me()
      ]);
      setProjects(projectData);
      setFolders(folderData);
      setUser(currentUser);
      const storedViewMode = typeof window !== "undefined" ? window.localStorage.getItem(PROJECT_VIEW_STORAGE_KEY) : null;
      setViewMode(storedViewMode || currentUser.project_view_mode || "grid");
    } catch (error) {
      console.error("Failed to load projects", error);
      setProjects([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (search) {
      const query = search.toLowerCase();
      result = result.filter((project) => project.name.toLowerCase().includes(query));
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "created_asc":
          return new Date(a.created_date || 0) - new Date(b.created_date || 0);
        case "created_desc":
          return new Date(b.created_date || 0) - new Date(a.created_date || 0);
        case "updated_asc":
          return new Date(a.updated_date || 0) - new Date(b.updated_date || 0);
        default:
          return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
      }
    });
    return result;
  }, [projects, search, sortBy]);
  const projectLimitStatus = checkProjectLimit(user, projects.length);

  async function handleToggleFavorite(project) {
    await base44.entities.Project.update(project.id, { is_favorite: !project.is_favorite });
    loadData();
  }

  async function handleDelete() {
    if (!deleteProject) return;
    const manuscripts = await base44.entities.Manuscript.filter({ project_id: deleteProject.id });
    for (const manuscript of manuscripts) {
      await base44.entities.Manuscript.delete(manuscript.id);
    }
    await base44.entities.Project.delete(deleteProject.id);
    setDeleteProject(null);
    loadData();
  }

  async function handleMove(project, folderId) {
    await base44.entities.Project.update(project.id, { folder_id: folderId || "" });
    loadData();
  }

  async function handleViewModeChange(nextMode) {
    setViewMode(nextMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROJECT_VIEW_STORAGE_KEY, nextMode);
    }
    if (!user) return;
    try {
      const updatedUser = await base44.auth.updateMe({ project_view_mode: nextMode });
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to persist project view mode", error);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-5xl px-4 pb-28 sm:px-6 lg:pb-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{projects.length} projeto{projects.length !== 1 ? "s" : ""}</p>
          {user ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 font-medium text-primary">Plano {PLAN_DEFINITIONS[user.plan || "free"].label}</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
                {projectLimitStatus.limit === Infinity ? "Projetos ilimitados" : `${projectLimitStatus.remaining} de ${projectLimitStatus.limit} projetos restantes`}
              </span>
            </div>
          ) : null}
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      <div className="mb-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar projetos..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 pl-9 text-sm" />
        </div>
        <div className="w-full sm:w-64">
          <AdaptiveSelect value={sortBy} onValueChange={setSortBy} options={projectSortOptions} placeholder="Ordenar" title="Ordenar projetos" triggerClassName="h-10" />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <Button type="button" size="sm" variant={viewMode === "grid" ? "default" : "ghost"} className="gap-2" onClick={() => handleViewModeChange("grid")}>
            <Grid2X2 className="h-4 w-4" />
            Grade
          </Button>
          <Button type="button" size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="gap-2" onClick={() => handleViewModeChange("list")}>
            <LayoutList className="h-4 w-4" />
            Lista
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-card px-3 py-1.5">{viewMode === "grid" ? "Visualizacao em grade" : "Visualizacao em lista"}</span>
        <span className="rounded-full border border-border bg-card px-3 py-1.5">{projectSortOptions.find((option) => option.value === sortBy)?.label}</span>
        {search ? <span className="rounded-full border border-border bg-card px-3 py-1.5">Busca: {search}</span> : null}
      </div>

      {!projectLimitStatus.allowed ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Voce atingiu o limite do plano gratuito. Faca upgrade para continuar.</span>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                base44.auth.updateMe({ plan: "premium" }).then((updatedUser) => {
                  setUser(updatedUser);
                })
              }
            >
              Fazer upgrade
            </Button>
          </div>
        </div>
      ) : null}

      {filteredProjects.length ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"}>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} viewMode={viewMode} folders={folders} onToggleFavorite={handleToggleFavorite} onDelete={(item) => setDeleteProject(item)} onEdit={(item) => setEditProject(item)} onMove={handleMove} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="mb-1 font-semibold">{search ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{search ? "Tente uma busca diferente." : "Crie seu primeiro projeto para começar."}</p>
          {!search ? (
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Projeto
            </Button>
          ) : null}
        </div>
      )}

      <CreateProjectDialog
        open={showCreate || !!editProject}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setEditProject(null);
          }
        }}
        folders={folders}
        editProject={editProject}
        onSuccess={loadData}
      />
      <ConfirmDialog
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        title="Excluir projeto?"
        description={`Isso vai excluir "${deleteProject?.name}" e todos os seus manuscritos permanentemente.`}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
