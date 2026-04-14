import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, FolderOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ConfirmDialog from "@/components/ConfirmDialog";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import { Button } from "@/components/ui/button";

export default function Folders() {
  const [folders, setFolders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [deleteFolder, setDeleteFolder] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [folderData, projectData] = await Promise.all([
        base44.entities.Folder.list("-created_date", 100),
        base44.entities.Project.list("-updated_date", 200)
      ]);
      setFolders(folderData);
      setProjects(projectData);
    } catch (error) {
      console.error("Failed to load folders", error);
      setFolders([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getProjectCount(folderId) {
    return projects.filter((project) => project.folder_id === folderId).length;
  }

  async function handleDelete() {
    if (!deleteFolder) return;
    const folderProjects = projects.filter((project) => project.folder_id === deleteFolder.id);
    for (const project of folderProjects) {
      await base44.entities.Project.update(project.id, { folder_id: "" });
    }
    await base44.entities.Folder.delete(deleteFolder.id);
    setDeleteFolder(null);
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
    <div className="page-shell mx-auto max-w-3xl px-4 pb-28 sm:px-6 lg:pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pastas</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{folders.length} pasta{folders.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Pasta
        </Button>
      </div>

      {folders.length ? (
        <div className="space-y-2">
          {folders.map((folder) => {
            const count = getProjectCount(folder.id);
            return (
              <div key={folder.id} className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:border-primary/20 hover:shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <FolderOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <Link to={`/folder/${folder.id}`} className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-semibold transition-colors group-hover:text-primary">{folder.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    {count} projeto{count !== 1 ? "s" : ""}
                  </p>
                </Link>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted" onClick={() => setEditFolder(folder)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-destructive/10" onClick={() => setDeleteFolder(folder)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
                  </button>
                </div>
                <Link to={`/folder/${folder.id}`} className="shrink-0">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FolderOpen className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Nenhuma pasta</h3>
          <p className="mb-5 max-w-xs text-sm text-muted-foreground">Crie pastas para organizar seus projetos de forma prática.</p>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Pasta
          </Button>
        </div>
      )}

      <CreateFolderDialog
        open={showCreate || !!editFolder}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setEditFolder(null);
          }
        }}
        editFolder={editFolder}
        onSuccess={loadData}
      />
      <ConfirmDialog
        open={!!deleteFolder}
        onOpenChange={(open) => !open && setDeleteFolder(null)}
        title="Excluir pasta?"
        description={`"${deleteFolder?.name}" será excluída. Os projetos dentro dela voltam para a área geral.`}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
