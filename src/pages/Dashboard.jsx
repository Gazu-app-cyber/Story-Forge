import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, Flame, FolderOpen, Loader2, Medal, Plus, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import ProjectCard from "@/components/ProjectCard";
import { getStreakProgress } from "@/lib/streak";
import { Button } from "@/components/ui/button";

function SectionHeader({ icon: Icon, title, linkTo, linkLabel }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </h2>
      {linkTo ? (
        <Link to={linkTo} className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, folderData, currentUser] = await Promise.all([
        base44.entities.Project.list("-updated_date", 50),
        base44.entities.Folder.list("-created_date", 50),
        base44.auth.me()
      ]);
      setProjects(projectData);
      setFolders(folderData);
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setProjects([]);
      setFolders([]);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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

  const recentProjects = useMemo(() => projects.slice(0, 6), [projects]);
  const favoriteProjects = useMemo(() => projects.filter((project) => project.is_favorite).slice(0, 4), [projects]);
  const streakProgress = useMemo(() => getStreakProgress(user), [user]);

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
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
      <div className="mb-10">
        <p className="mb-1 text-sm font-medium text-muted-foreground">{greeting()},</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{user?.display_name || user?.full_name || "Escritor"} ✨</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Continue sua história ou comece algo novo hoje.</p>
      </div>

      <div className="mb-8 rounded-2xl border border-orange-200/70 bg-[linear-gradient(135deg,rgba(251,146,60,0.14),rgba(245,158,11,0.06))] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
              <Flame className="h-3.5 w-3.5" />
              SequÃªncia diÃ¡ria
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold tracking-tight text-foreground">{user?.streakCount || 0}</p>
              <p className="pb-1 text-sm font-medium text-muted-foreground">dias seguidos</p>
            </div>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">Escreva pelo menos 100 palavras por dia para manter sua sequÃªncia.</p>
          </div>

          <div className="min-w-[230px] rounded-2xl border border-white/70 bg-white/75 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Meta de hoje</span>
              <span className="text-muted-foreground">{streakProgress.words}/{streakProgress.goal} palavras</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-orange-100">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#f97316,#ef4444)] transition-all" style={{ width: `${Math.min((streakProgress.words / streakProgress.goal) * 100, 100)}%` }} />
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Medal className="h-3.5 w-3.5 text-amber-500" />
              {streakProgress.completedToday ? "Meta concluÃ­da hoje" : `${streakProgress.remaining} palavras restantes`}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: BookOpen, label: "Projetos", value: projects.length, color: "text-primary bg-primary/10" },
          { icon: FolderOpen, label: "Pastas", value: folders.length, color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" },
          { icon: Star, label: "Favoritos", value: favoriteProjects.length, color: "text-rose-500 bg-rose-100 dark:bg-rose-900/30" }
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{stat.value}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
        <button
          onClick={() => setShowCreate(true)}
          className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 transition-all hover:bg-primary/10"
        >
          <Plus className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          <span className="text-sm font-semibold text-primary">Criar projeto</span>
        </button>
      </div>

      {recentProjects.length ? (
        <section className="mb-10">
          <SectionHeader icon={Clock} title="Recentes" linkTo="/projects" linkLabel="Ver todos" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} folders={folders} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} onMove={handleMove} />
            ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
            <BookOpen className="h-7 w-7 text-primary/50" strokeWidth={1.5} />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Nenhum projeto ainda</h3>
          <p className="mb-5 max-w-xs text-sm text-muted-foreground">Comece sua jornada criativa criando seu primeiro projeto.</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Projeto
          </Button>
        </div>
      )}

      {favoriteProjects.length ? (
        <section>
          <SectionHeader icon={Star} title="Favoritos" linkTo="/favorites" linkLabel="Ver todos" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteProjects.map((project) => (
              <ProjectCard key={project.id} project={project} folders={folders} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} onMove={handleMove} />
            ))}
          </div>
        </section>
      ) : null}

      <CreateProjectDialog open={showCreate} onOpenChange={setShowCreate} folders={folders} onSuccess={loadData} />
    </div>
  );
}
