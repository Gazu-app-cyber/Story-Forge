import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Library, Loader2, Plus, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import PublicWorkCard from "@/components/PublicWorkCard";
import { Button } from "@/components/ui/button";
import { getAvailableManuscriptOptions, getPublicWorkChapterCount, getPublicWorkStatusLabel, normalizePublicWork } from "@/lib/publicWorks";
import { addManuscriptsToPublicWork, getPublicWork, reorderPublicWorkChapter, removeChapterFromPublicWork } from "@/lib/publicWorksStore";

function buildProjectBackedWork(project, manuscripts) {
  const projectManuscripts = manuscripts
    .filter((item) => item.project_id === project.id)
    .sort((left, right) => new Date(left.created_date || 0) - new Date(right.created_date || 0));

  return normalizePublicWork({
    id: project.id,
    title: project.name,
    cover_image: project.cover_image || "",
    short_description: project.public_summary || project.description || "",
    full_summary: project.description || project.public_summary || "",
    genre: project.public_genre || "Geral",
    chapter_mode: projectManuscripts.length <= 1 ? "oneshot" : "open",
    planned_chapter_count: "",
    is_completed: String(project.public_status || "").toLowerCase().includes("concl"),
    age_rating: project.age_rating || "Livre",
    chapter_entries: projectManuscripts.map((manuscript, index) => ({
      id: `project_chapter_${manuscript.id}`,
      manuscript_id: manuscript.id,
      title: manuscript.name,
      order: index + 1,
      published_at: manuscript.updated_date || manuscript.created_date || "",
      image: manuscript.image || ""
    })),
    public_likes: project.public_likes || 0,
    public_comments: project.public_comments || 0,
    public_views: project.public_views || 0,
    public_origin: project.public_origin || "original",
    created_by: project.created_by || "",
    created_date: project.created_date || "",
    updated_date: project.updated_date || ""
  });
}

export default function PublicWorkPageFixed() {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [author, setAuthor] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedManuscriptId, setSelectedManuscriptId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isManagedPublicWork, setIsManagedPublicWork] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setLoadError("");

      const [currentUser, users, manuscriptList, projectList] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.social.listPublicUsers().catch(() => []),
        base44.entities.Manuscript.list("-updated_date", 500).catch(() => []),
        base44.social.listDiscoverWorks().catch(() => [])
      ]);

      const managedWork = getPublicWork(id);
      const resolvedWork = managedWork || projectList.find((entry) => entry.id === id) || null;

      if (!resolvedWork) {
        setWork(null);
        setAuthor(null);
        setChapters([]);
        setUser(currentUser);
        setManuscripts(manuscriptList);
        setIsManagedPublicWork(false);
        setLoadError("Não encontramos essa obra pública. Ela pode ter sido removida ou ainda não foi publicada corretamente.");
        return;
      }

      const normalizedWork = managedWork ? normalizePublicWork(managedWork) : buildProjectBackedWork(resolvedWork, manuscriptList);
      const workAuthor =
        users.find((entry) => entry.email === normalizedWork.created_by) ||
        users.find((entry) => entry.username === resolvedWork.author_username) ||
        null;

      const nextChapters = normalizedWork.chapter_entries
        .map((entry) => {
          const manuscript = manuscriptList.find((item) => item.id === entry.manuscript_id);
          return {
            ...entry,
            excerpt: manuscript?.content?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) || "",
            manuscript_type: manuscript?.type || "Capítulo"
          };
        })
        .sort((left, right) => left.order - right.order);

      setUser(currentUser);
      setAuthor(workAuthor);
      setWork(normalizedWork);
      setChapters(nextChapters);
      setManuscripts(manuscriptList);
      setIsManagedPublicWork(Boolean(managedWork));
    } catch (error) {
      console.error("Failed to load public work page", error);
      setWork(null);
      setAuthor(null);
      setChapters([]);
      setLoadError(error?.message || "Não foi possível carregar esta obra pública.");
      toast.error(error?.message || "Não foi possível carregar esta obra pública.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const isOwner = Boolean(user?.email && work?.created_by === user.email && isManagedPublicWork);
  const manuscriptOptions = useMemo(() => getAvailableManuscriptOptions(manuscripts, work), [manuscripts, work]);

  async function handleImportChapter() {
    if (!selectedManuscriptId || !user?.email || !isManagedPublicWork) return;
    try {
      const selected = manuscripts.find((entry) => entry.id === selectedManuscriptId);
      if (!selected) return;
      addManuscriptsToPublicWork(id, [selected], user.email);
      setSelectedManuscriptId("");
      toast.success("Manuscrito importado como capítulo.");
      loadData();
    } catch (error) {
      toast.error(error?.message || "Não foi possível adicionar o capítulo.");
    }
  }

  async function handleMoveChapter(chapterId, direction) {
    if (!user?.email || !isManagedPublicWork) return;
    try {
      reorderPublicWorkChapter(id, chapterId, direction, user.email);
      loadData();
    } catch (error) {
      toast.error(error?.message || "Não foi possível reordenar o capítulo.");
    }
  }

  async function handleRemoveChapter(chapterId) {
    if (!user?.email || !isManagedPublicWork) return;
    try {
      removeChapterFromPublicWork(id, chapterId, user.email);
      loadData();
    } catch (error) {
      toast.error(error?.message || "Não foi possível remover o capítulo.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="page-shell discover-shell mx-auto max-w-4xl px-4 pb-28 sm:px-6 lg:pb-10">
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card px-6 py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Library className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold text-foreground">Obra pública não encontrada</p>
          <p className="mt-2 text-sm text-muted-foreground">{loadError || "Não foi possível localizar a obra solicitada."}</p>
          <Button asChild className="mt-4 gap-2">
            <Link to="/public-works">
              <ArrowDown className="h-4 w-4 rotate-90" />
              Voltar para Obras Públicas
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell discover-shell mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-10">
      <section className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <PublicWorkCard work={{ ...work, author_username: author?.username || "", public_summary: work.short_description }} compact />
        <article className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">{work.genre}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{getPublicWorkStatusLabel(work)}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{work.age_rating}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{work.title}</h1>
          {author ? (
            <Link to={`/autor/${author.username}`} className="mt-2 inline-block text-sm text-muted-foreground hover:text-primary">
              por {author.display_name || author.full_name}
            </Link>
          ) : null}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{work.short_description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              <span className="block text-xl font-semibold text-foreground">{getPublicWorkChapterCount(work)}</span>
              capítulos
            </div>
            <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              <span className="block text-xl font-semibold text-foreground">{work.chapter_mode === "oneshot" ? "Oneshot" : work.chapter_mode === "limited" ? `${work.planned_chapter_count || 0}` : "Aberta"}</span>
              formato
            </div>
            <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              <span className="block text-xl font-semibold text-foreground">{work.public_views || 0}</span>
              visualizações
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-background/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo completo</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{work.full_summary}</p>
          </div>
        </article>
      </section>

      {isOwner ? (
        <section className="mb-8 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Importar manuscritos como capítulos</p>
              <p className="mt-1 text-sm text-muted-foreground">Os manuscritos originais continuam privados e independentes. Aqui você cria apenas o vínculo de publicação.</p>
              <div className="mt-3">
                <AdaptiveSelect value={selectedManuscriptId} onValueChange={setSelectedManuscriptId} options={manuscriptOptions} placeholder="Escolha um manuscrito" title="Importar manuscrito" />
              </div>
            </div>
            <Button type="button" onClick={handleImportChapter} disabled={!selectedManuscriptId} className="gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Adicionar capítulo
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Capítulos publicados</h2>
            <p className="text-sm text-muted-foreground">No feed aparece a apresentação breve da obra. Aqui o leitor encontra o resumo completo e a ordem dos capítulos publicados.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            {chapters.length} capítulos vinculados
          </div>
        </div>

        {chapters.length ? (
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <article key={chapter.id} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Capítulo {index + 1}: {chapter.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{chapter.manuscript_type}</p>
                    {chapter.excerpt ? <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{chapter.excerpt}</p> : null}
                  </div>
                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={() => handleMoveChapter(chapter.id, "up")} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => handleMoveChapter(chapter.id, "down")} disabled={index === chapters.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveChapter(chapter.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <p className="text-lg font-semibold text-foreground">Nenhum capítulo publicado ainda</p>
            <p className="mt-2 text-sm text-muted-foreground">Assim que o autor importar manuscritos, eles aparecerão aqui em ordem de leitura.</p>
          </div>
        )}
      </section>
    </div>
  );
}
