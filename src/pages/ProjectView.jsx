import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import "moment/locale/pt-br";
import { BookOpen, LayoutGrid, List, Loader2, Pencil, Plus, Search, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import CreateManuscriptDialog from "@/components/CreateManuscriptDialog";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import ManuscriptCard from "@/components/ManuscriptCard";
import { getTypeColor, getTypeIcon, manuscriptTypes } from "@/lib/manuscriptTypes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

moment.locale("pt-br");

const sortOptions = [
  { value: "updated_date", label: "Última edição" },
  { value: "created_date", label: "Criação" },
  { value: "name", label: "Nome" },
  { value: "type", label: "Categoria" }
];

export default function ProjectView() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated_date");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateMs, setShowCreateMs] = useState(false);
  const [editMs, setEditMs] = useState(null);
  const [deleteMs, setDeleteMs] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, manuscriptData, folderData] = await Promise.all([
        base44.entities.Project.filter({ id }, "-updated_date", 1),
        base44.entities.Manuscript.filter({ project_id: id }, "-updated_date", 500),
        base44.entities.Folder.list("-created_date", 50)
      ]);
      setProject(projectData[0]);
      setManuscripts(manuscriptData);
      setFolders(folderData);
    } catch (error) {
      console.error("Failed to load project view", error);
      setProject(null);
      setManuscripts([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const filteredMs = useMemo(() => {
    let result = [...manuscripts];
    if (search) {
      const query = search.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(query));
    }
    if (filterType !== "all") {
      result = result.filter((item) => item.type === filterType);
    }
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "created_date") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "type") return (a.type || "").localeCompare(b.type || "");
      return new Date(b.updated_date) - new Date(a.updated_date);
    });
    return result;
  }, [manuscripts, search, sortBy, filterType]);

  const typeGroups = useMemo(() => manuscriptTypes.filter((type) => manuscripts.some((item) => item.type === type)), [manuscripts]);

  async function handleToggleFavorite(manuscript) {
    await base44.entities.Manuscript.update(manuscript.id, { is_favorite: !manuscript.is_favorite });
    loadData();
  }

  async function handleDeleteMs() {
    if (!deleteMs) return;
    await base44.entities.Manuscript.delete(deleteMs.id);
    setDeleteMs(null);
    loadData();
  }

  async function handleDuplicate(manuscript) {
    await base44.entities.Manuscript.create({
      name: `${manuscript.name} (cópia)`,
      type: manuscript.type,
      image: manuscript.image,
      content: manuscript.content,
      project_id: id
    });
    loadData();
  }

  async function handleToggleProjectFav() {
    await base44.entities.Project.update(id, { is_favorite: !project.is_favorite });
    loadData();
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="page-shell mx-auto max-w-5xl px-4 pb-28 sm:px-6 lg:pb-8">
      <div className="mb-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-full shrink-0 md:w-52">
            <div className="overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: "4/3" }}>
              {project.cover_image ? (
                <img
                  src={project.cover_image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10"
                style={{ display: project.cover_image ? "none" : "flex" }}
              >
                <BookOpen className="h-8 w-8 text-primary/30" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <div className="flex gap-1.5 shrink-0">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted" onClick={handleToggleProjectFav}>
                  <Star className={cn("h-4 w-4", project.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted" onClick={() => setShowEditProject(true)}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {project.description ? <p className="mb-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">{project.description}</p> : null}

            <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {manuscripts.length} manuscritos
              </span>
              <span>•</span>
              <span>Editado {moment(project.updated_date).fromNow()}</span>
            </div>

            {typeGroups.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {typeGroups.map((type) => {
                  const TypeIcon = getTypeIcon(type);
                  const count = manuscripts.filter((item) => item.type === type).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(filterType === type ? "all" : type)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                        filterType === type ? getTypeColor(type) : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <TypeIcon className="h-3 w-3" />
                      {type} ({count})
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">Manuscritos</h2>
        <Button onClick={() => setShowCreateMs(true)} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo manuscrito
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar manuscritos..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 pl-9 text-sm" />
        </div>
        <div className="w-full sm:w-44">
          <AdaptiveSelect value={filterType} onValueChange={setFilterType} options={[{ value: "all", label: "Todos os tipos" }, ...manuscriptTypes.map((item) => ({ value: item, label: item }))]} placeholder="Tipo" title="Filtrar por tipo" />
        </div>
        <div className="w-full sm:w-44">
          <AdaptiveSelect value={sortBy} onValueChange={setSortBy} options={sortOptions} placeholder="Ordenar" title="Ordenar manuscritos" />
        </div>
        <div className="flex h-10 overflow-hidden rounded-lg border border-border">
          <button onClick={() => setViewMode("grid")} className={cn("flex items-center px-3 transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode("list")} className={cn("flex items-center border-l border-border px-3 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {filteredMs.length ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMs.map((manuscript) => (
              <ManuscriptCard key={manuscript.id} manuscript={manuscript} onToggleFavorite={handleToggleFavorite} onDelete={(item) => setDeleteMs(item)} onEdit={(item) => setEditMs(item)} onDuplicate={handleDuplicate} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMs.map((manuscript) => {
              const TypeIcon = getTypeIcon(manuscript.type);
              const typeColor = getTypeColor(manuscript.type);
              return (
                <Link key={manuscript.id} to={`/manuscript/${manuscript.id}`} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
                  {manuscript.image ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img src={manuscript.image} alt="" className="h-full w-full object-cover" onError={(event) => (event.currentTarget.style.display = "none")} />
                    </div>
                  ) : (
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", typeColor)}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-medium transition-colors group-hover:text-primary">{manuscript.name}</h3>
                    <p className="text-[12px] text-muted-foreground">
                      {manuscript.type} • {moment(manuscript.updated_date).fromNow()}
                    </p>
                  </div>
                  {manuscript.is_favorite ? <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" /> : null}
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="mb-1 font-semibold">{search || filterType !== "all" ? "Nenhum resultado" : "Nenhum manuscrito"}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{search || filterType !== "all" ? "Tente filtros diferentes." : "Crie seu primeiro manuscrito."}</p>
          {!search && filterType === "all" ? (
            <Button size="sm" onClick={() => setShowCreateMs(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Manuscrito
            </Button>
          ) : null}
        </div>
      )}

      <CreateManuscriptDialog
        open={showCreateMs || !!editMs}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateMs(false);
            setEditMs(null);
          }
        }}
        projectId={id}
        editManuscript={editMs}
        onSuccess={loadData}
      />
      <CreateProjectDialog open={showEditProject} onOpenChange={setShowEditProject} folders={folders} editProject={project} onSuccess={loadData} />
      <ConfirmDialog open={!!deleteMs} onOpenChange={(open) => !open && setDeleteMs(null)} title="Excluir manuscrito?" description={`Tem certeza que deseja excluir "${deleteMs?.name}"?`} onConfirm={handleDeleteMs} destructive />
    </div>
  );
}
