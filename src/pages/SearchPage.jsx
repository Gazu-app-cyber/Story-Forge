import { useEffect, useState } from "react";
import { BookOpen, FileText, Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import EmptyState from "@/components/EmptyState";
import ManuscriptCard from "@/components/ManuscriptCard";
import ProjectCard from "@/components/ProjectCard";
import { manuscriptTypes } from "@/lib/manuscriptTypes";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [projects, setProjects] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    base44.entities.Folder.list("-created_date", 50).then(setFolders);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setProjects([]);
      setManuscripts([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const [allProjects, allManuscripts] = await Promise.all([
          base44.entities.Project.list("-updated_date", 500),
          base44.entities.Manuscript.list("-updated_date", 500)
        ]);
        const lower = query.toLowerCase();
        const filteredProjects = allProjects.filter((project) => project.name.toLowerCase().includes(lower));
        let filteredManuscripts = allManuscripts.filter((manuscript) => manuscript.name.toLowerCase().includes(lower));
        if (filterType !== "all") {
          filteredManuscripts = filteredManuscripts.filter((manuscript) => manuscript.type === filterType);
        }
        setProjects(filteredProjects);
        setManuscripts(filteredManuscripts);
        setSearched(true);
      } catch (error) {
        console.error("Failed to run search", error);
        setProjects([]);
        setManuscripts([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, filterType]);

  return (
    <div className="page-shell mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Buscar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Encontre projetos e manuscritos rapidamente.</p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Digite para buscar..." value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 pl-10" autoFocus />
        </div>
        <div className="w-full sm:w-56">
          <AdaptiveSelect
            value={filterType}
            onValueChange={setFilterType}
            options={[{ value: "all", label: "Todos os tipos" }, ...manuscriptTypes.map((item) => ({ value: item, label: item }))]}
            placeholder="Filtrar tipo"
            title="Filtrar manuscritos"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : null}

      {!loading && searched ? (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">Todos ({projects.length + manuscripts.length})</TabsTrigger>
            <TabsTrigger value="projects">Projetos ({projects.length})</TabsTrigger>
            <TabsTrigger value="manuscripts">Manuscritos ({manuscripts.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {!projects.length && !manuscripts.length ? (
              <EmptyState icon={Search} title="Nenhum resultado" description="Tente termos diferentes." />
            ) : (
              <div className="space-y-6">
                {projects.length ? (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      Projetos
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} folders={folders} />
                      ))}
                    </div>
                  </div>
                ) : null}
                {manuscripts.length ? (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Manuscritos
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {manuscripts.map((manuscript) => (
                        <ManuscriptCard key={manuscript.id} manuscript={manuscript} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>
          <TabsContent value="projects">
            {projects.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} folders={folders} />
                ))}
              </div>
            ) : (
              <EmptyState icon={BookOpen} title="Nenhum projeto encontrado" />
            )}
          </TabsContent>
          <TabsContent value="manuscripts">
            {manuscripts.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {manuscripts.map((manuscript) => (
                  <ManuscriptCard key={manuscript.id} manuscript={manuscript} />
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="Nenhum manuscrito encontrado" />
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      {!loading && !searched ? <EmptyState icon={Search} title="Busque seus projetos e manuscritos" description="Digite o nome do que você procura." /> : null}
    </div>
  );
}
