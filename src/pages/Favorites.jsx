import { useEffect, useState } from "react";
import { BookOpen, Loader2, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/EmptyState";
import ManuscriptCard from "@/components/ManuscriptCard";
import ProjectCard from "@/components/ProjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Favorites() {
  const [projects, setProjects] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, manuscriptData, folderData] = await Promise.all([
        base44.entities.Project.filter({ is_favorite: true }, "-updated_date", 100),
        base44.entities.Manuscript.filter({ is_favorite: true }, "-updated_date", 100),
        base44.entities.Folder.list("-created_date", 50)
      ]);
      setProjects(projectData);
      setManuscripts(manuscriptData);
      setFolders(folderData);
    } catch (error) {
      console.error("Failed to load favorites", error);
      setProjects([]);
      setManuscripts([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggleFavProject(project) {
    await base44.entities.Project.update(project.id, { is_favorite: false });
    loadData();
  }

  async function handleToggleFavMs(manuscript) {
    await base44.entities.Manuscript.update(manuscript.id, { is_favorite: false });
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
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Star className="h-6 w-6 text-accent" />
          Favoritos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {projects.length} projetos • {manuscripts.length} manuscritos
        </p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList className="mb-6">
          <TabsTrigger value="projects">Projetos ({projects.length})</TabsTrigger>
          <TabsTrigger value="manuscripts">Manuscritos ({manuscripts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          {projects.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} folders={folders} onToggleFavorite={handleToggleFavProject} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Star} title="Nenhum projeto favorito" description="Marque projetos como favoritos para encontrá-los aqui." />
          )}
        </TabsContent>
        <TabsContent value="manuscripts">
          {manuscripts.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {manuscripts.map((manuscript) => (
                <ManuscriptCard key={manuscript.id} manuscript={manuscript} onToggleFavorite={handleToggleFavMs} />
              ))}
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="Nenhum manuscrito favorito" description="Marque manuscritos como favoritos para encontrá-los aqui." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
