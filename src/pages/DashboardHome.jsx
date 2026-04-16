import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, Flame, FolderOpen, Heart, Library, Loader2, Medal, Plus, Radio, Sparkles, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import CreatePublicWorkDialog from "@/components/CreatePublicWorkDialog";
import ProjectCard from "@/components/ProjectCard";
import PublicWorkCard from "@/components/PublicWorkCard";
import { listDiscoverPublicWorks, listPublicWorksByAuthor } from "@/lib/publicWorksStore";
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

function PublicAuthorCard({ author, onToggleFollow }) {
  return (
    <article className="social-card overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="social-banner h-24" style={{ backgroundImage: author.profile_banner ? `url(${author.profile_banner})` : undefined }} />
      <div className="relative px-4 pb-4 pt-0">
        <div className="-mt-8 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {author.profile_image ? (
              <img src={author.profile_image} alt="" className="h-16 w-16 rounded-2xl border-4 border-card object-cover shadow-sm" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-card bg-primary text-xl font-bold text-primary-foreground shadow-sm">
                {(author.display_name || author.full_name || "A")[0].toUpperCase()}
              </div>
            )}
            <div>
              <Link to={`/autor/${author.username}`} className="text-base font-semibold text-foreground hover:text-primary">
                {author.display_name || author.full_name}
              </Link>
              <p className="text-sm text-muted-foreground">@{author.username}</p>
            </div>
          </div>
          <Button type="button" size="sm" variant={author.is_following ? "secondary" : "default"} onClick={() => onToggleFollow(author)} className="gap-2 rounded-full px-4">
            <Heart className={`h-4 w-4 ${author.is_following ? "fill-current" : ""}`} />
            {author.is_following ? "Seguindo" : "Seguir"}
          </Button>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{author.bio || "Esse autor ainda está montando seu perfil público."}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-3 py-1.5">{author.followers_count} seguidores</span>
          <span className="rounded-full bg-muted px-3 py-1.5">{author.following_count} seguindo</span>
          <span className="rounded-full bg-muted px-3 py-1.5">{author.projects_count} obras públicas</span>
        </div>
      </div>
    </article>
  );
}

function FeedCard({ item }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <Radio className="h-3.5 w-3.5" />
        Feed literário
      </div>
      <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
      <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
        <p className="text-sm font-semibold text-foreground">{item.work.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">por {item.work.author_name}</p>
      </div>
    </article>
  );
}

export default function DashboardHome() {
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [publicWorks, setPublicWorks] = useState([]);
  const [socialFeed, setSocialFeed] = useState({ featuredAuthors: [], featuredWorks: [], feedItems: [] });
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreatePublicWork, setShowCreatePublicWork] = useState(false);
  const [user, setUser] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, folderData, currentUser, feedData, users] = await Promise.all([
        base44.entities.Project.list("-updated_date", 50),
        base44.entities.Folder.list("-created_date", 50),
        base44.auth.me(),
        base44.social.listFeed(),
        base44.auth.listUsers().catch(() => [])
      ]);
      const discoverWorks = listDiscoverPublicWorks(users);
      setProjects(projectData);
      setFolders(folderData);
      setUser(currentUser);
      setPublicWorks(listPublicWorksByAuthor(currentUser.email).map((work) => ({ ...work, author_username: currentUser.username || "" })));
      setSocialFeed({
        ...feedData,
        featuredWorks: discoverWorks.slice(0, 6),
        feedItems: discoverWorks.slice(0, 4).map((work) => ({
          id: `feed_${work.id}`,
          title: `Obra em destaque: ${work.name}`,
          body: work.public_summary || work.description || "Uma obra em destaque para a comunidade.",
          work
        }))
      });
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setProjects([]);
      setFolders([]);
      setPublicWorks([]);
      setUser(null);
      setSocialFeed({ featuredAuthors: [], featuredWorks: [], feedItems: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    function handleRefresh() {
      loadData();
    }

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storyforge:data-changed", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storyforge:data-changed", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
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

  async function handleToggleFollow(author) {
    await base44.social.toggleFollow(author.id);
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
        <p className="mt-2 text-[15px] text-muted-foreground">Continue sua história ou publique algo novo para a comunidade hoje.</p>
      </div>

      <div className="mb-8 rounded-2xl border border-orange-200/70 bg-[linear-gradient(135deg,rgba(251,146,60,0.14),rgba(245,158,11,0.06))] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
              <Flame className="h-3.5 w-3.5" />
              Sequência diária
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold tracking-tight text-foreground">{user?.streakCount || 0}</p>
              <p className="pb-1 text-sm font-medium text-muted-foreground">dias seguidos</p>
            </div>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">Escreva pelo menos 100 palavras por dia para manter sua sequência.</p>
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
              {streakProgress.completedToday ? "Meta concluída hoje" : `${streakProgress.remaining} palavras restantes`}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: BookOpen, label: "Projetos", value: projects.length, color: "text-primary bg-primary/10" },
          { icon: Library, label: "Obras publicas", value: publicWorks.length, color: "text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30" },
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
        <button onClick={() => setShowCreateProject(true)} className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 transition-all hover:bg-primary/10">
          <Plus className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          <span className="text-sm font-semibold text-primary">Criar projeto</span>
        </button>
      </div>

      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        <button onClick={() => setShowCreateProject(true)} className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30">
          <p className="text-sm font-semibold text-foreground">Projeto privado</p>
          <p className="mt-2 text-sm text-muted-foreground">Ambiente de escrita e organização. Ideal para estruturar pastas, manuscritos e fluxo editorial interno.</p>
        </button>
        <button onClick={() => setShowCreatePublicWork(true)} className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left shadow-sm transition-all hover:border-primary/40">
          <p className="text-sm font-semibold text-foreground">Obra pública</p>
          <p className="mt-2 text-sm text-muted-foreground">Publicação para leitores. Importe manuscritos como capítulos e apareça no feed literário e na descoberta.</p>
        </button>
      </div>

      <section className="mb-12">
        <SectionHeader icon={Sparkles} title="Descobrir autores" linkTo="/discover" linkLabel="Explorar obras" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {socialFeed.featuredAuthors.map((author) => (
            <PublicAuthorCard key={author.id} author={author} onToggleFollow={handleToggleFollow} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader icon={Radio} title="Feed literário" linkTo="/discover" linkLabel="Abrir descoberta" />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {socialFeed.feedItems.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
          <div className="space-y-4">
            {socialFeed.featuredWorks.slice(0, 3).map((work) => (
              <PublicWorkCard key={work.id} work={work} />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader icon={BookOpen} title="Minhas obras publicas" linkTo="/public-works" linkLabel="Gerenciar obras" />
        {publicWorks.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {publicWorks.map((work) => (
              <PublicWorkCard key={work.id} work={work} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-lg font-semibold text-foreground">Nenhuma obra pública criada ainda</p>
            <p className="mt-2 text-sm text-muted-foreground">Publique sua primeira obra para aparecer na descoberta e no seu perfil público de autor.</p>
            <Button className="mt-4 gap-2" onClick={() => setShowCreatePublicWork(true)}>
              <Plus className="h-4 w-4" />
              Criar obra pública
            </Button>
          </div>
        )}
      </section>

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
          <Button onClick={() => setShowCreateProject(true)} className="gap-2">
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

      <CreateProjectDialog open={showCreateProject} onOpenChange={setShowCreateProject} folders={folders} onSuccess={loadData} />
      <CreatePublicWorkDialog open={showCreatePublicWork} onOpenChange={setShowCreatePublicWork} onSuccess={loadData} />
    </div>
  );
}
