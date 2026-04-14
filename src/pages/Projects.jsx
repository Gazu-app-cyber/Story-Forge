import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, Plus, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sortOptions = [
  { value: "updated_date", label: "Última edição" },
  { value: "created_date", label: "Data de criação" },
  { value: "name", label: "Nome" }
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated_date");
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, folderData] = await Promise.all([
        base44.entities.Project.list("-updated_date", 200),
        base44.entities.Folder.list("-created_date", 50)
      ]);
      setProjects(projectData);
      setFolders(folderData);
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
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "created_date") return new Date(b.created_date) - new Date(a.created_date);
      return new Date(b.updated_date) - new Date(a.updated_date);
    });
    return result;
  }, [projects, search, sortBy]);

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
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      <div className="mb-7 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar projetos..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 pl-9 text-sm" />
        </div>
        <div className="w-full sm:w-48">
          <AdaptiveSelect value={sortBy} onValueChange={setSortBy} options={sortOptions} placeholder="Ordenar" title="Ordenar projetos" triggerClassName="h-10" />
        </div>
      </div>

      {filteredProjects.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} folders={folders} onToggleFavorite={handleToggleFavorite} onDelete={(item) => setDeleteProject(item)} onEdit={(item) => setEditProject(item)} onMove={handleMove} />
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
