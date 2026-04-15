import { useEffect, useState } from "react";
import { FolderOpen, Loader2, Plus } from "lucide-react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import EmptyState from "@/components/EmptyState";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";

export default function FolderView() {
  const { id } = useParams();
  const [folder, setFolder] = useState(null);
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [allFolders, allProjects] = await Promise.all([
        base44.entities.Folder.list("-created_date", 100),
        base44.entities.Project.filter({ folder_id: id }, "-updated_date", 200)
      ]);
      setFolder(allFolders.find((item) => item.id === id));
      setFolders(allFolders);
      setProjects(allProjects);
    } catch (error) {
      console.error("Failed to load folder view", error);
      setFolder(null);
      setFolders([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleToggleFavorite(project) {
    await base44.entities.Project.update(project.id, { is_favorite: !project.is_favorite });
    loadData();
  }

  async function handleDelete(project) {
    const manuscripts = await base44.entities.Manuscript.filter({ project_id: project.id });
    for (const manuscript of manuscripts) {
      await base44.entities.Manuscript.delete(manuscript.id);
    }
    await base44.entities.Project.delete(project.id);
    loadData();
  }

  async function handleMove(project, folderId) {
    await base44.entities.Project.update(project.id, { folder_id: folderId || "" });
    loadData();
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-accent" />
            <h1 className="text-2xl font-bold tracking-tight">{folder?.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{projects.length} projetos</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {projects.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} folders={folders} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} onMove={handleMove} />
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderOpen} title="Pasta vazia" description="Adicione projetos a esta pasta." actionLabel="Criar Projeto" onAction={() => setShowCreate(true)} />
      )}

      <CreateProjectDialog open={showCreate} onOpenChange={setShowCreate} folders={folders} initialFolderId={id} onSuccess={loadData} />
    </div>
  );
}
