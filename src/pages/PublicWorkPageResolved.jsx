import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Ban, BookOpen, Flag, Library, Loader2, MessageCircle, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import PublicWorkCard from "@/components/PublicWorkCard";
import ReportContentDialog from "@/components/ReportContentDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildParagraphAnchorKey } from "@/lib/publicChapterCommentsStore";
import { getAvailableManuscriptOptions, getPublicWorkChapterCount, getPublicWorkStatusLabel, normalizePublicWork } from "@/lib/publicWorks";
import { addManuscriptsToPublicWork, getPublicWork, reorderPublicWorkChapter, removeChapterFromPublicWork } from "@/lib/publicWorksStore";
import { cn } from "@/lib/utils";

function buildProjectBackedWork(project, manuscripts) {
  const source = project && typeof project === "object" ? project : {};
  const projectManuscripts = manuscripts
    .filter((item) => item.project_id === source.id)
    .sort((left, right) => new Date(left.created_date || 0) - new Date(right.created_date || 0));

  return normalizePublicWork({
    id: source.id,
    title: source.name,
    cover_image: source.cover_image || "",
    short_description: source.public_summary || source.description || "",
    full_summary: source.description || source.public_summary || "",
    genre: source.public_genre || "Geral",
    chapter_mode: projectManuscripts.length <= 1 ? "oneshot" : "open",
    planned_chapter_count: "",
    is_completed: String(source.public_status || "").toLowerCase().includes("concl"),
    age_rating: source.age_rating || "Livre",
    chapter_entries: projectManuscripts.map((manuscript, index) => ({
      id: `project_chapter_${manuscript.id}`,
      manuscript_id: manuscript.id,
      title: manuscript.name,
      order: index + 1,
      published_at: manuscript.updated_date || manuscript.created_date || "",
      image: manuscript.image || ""
    })),
    public_likes: source.public_likes || 0,
    public_comments: source.public_comments || 0,
    public_views: source.public_views || 0,
    public_origin: source.public_origin || "original",
    created_by: source.created_by || "",
    created_date: source.created_date || "",
    updated_date: source.updated_date || ""
  });
}

function normalizeReadableText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function extractChapterBlocks(content = "") {
  if (typeof window === "undefined") {
    return [];
  }

  const parser = new window.DOMParser();
  const document = parser.parseFromString(content || "", "text/html");
  const blocks = [];
  const occurrences = new Map();

  function registerParagraph(text) {
    const normalized = normalizeReadableText(text);
    if (!normalized) return;
    const currentCount = occurrences.get(normalized) || 0;
    occurrences.set(normalized, currentCount + 1);
    blocks.push({
      type: "paragraph",
      text: normalized,
      anchor: buildParagraphAnchorKey(normalized, currentCount)
    });
  }

  function walk(node) {
    if (node.nodeType === window.Node.TEXT_NODE) {
      registerParagraph(node.textContent || "");
      return;
    }

    if (node.nodeType !== window.Node.ELEMENT_NODE) {
      return;
    }

    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const text = normalizeReadableText(node.textContent || "");
      if (text) {
        blocks.push({
          type: "heading",
          level: Number(tag.slice(1)),
          text
        });
      }
      return;
    }

    if (tag === "p" || tag === "blockquote" || tag === "li") {
      registerParagraph(node.textContent || "");
      return;
    }

    if (tag === "ul" || tag === "ol" || tag === "section" || tag === "article" || tag === "main" || tag === "div") {
      Array.from(node.childNodes).forEach(walk);
      return;
    }

    if (!node.children.length) {
      registerParagraph(node.textContent || "");
      return;
    }

    Array.from(node.childNodes).forEach(walk);
  }

  Array.from(document.body.childNodes).forEach(walk);
  return blocks;
}

function formatCommentDate(value) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function PublicWorkPageResolved() {
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
  const [moderationState, setModerationState] = useState({ isBlocked: false, blockedByViewer: false, viewerBlockedByUser: false });
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedParagraphAnchor, setSelectedParagraphAnchor] = useState("");
  const [chapterComments, setChapterComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [paragraphCommentDraft, setParagraphCommentDraft] = useState("");
  const [chapterCommentDraft, setChapterCommentDraft] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setLoadError("");

        const [currentUser, ownManuscripts, publicPayload] = await Promise.all([
          base44.auth.me().catch(() => null),
          base44.entities.Manuscript.list("-updated_date", 500).catch(() => []),
          base44.social.getPublicWorkById(id).catch(() => null)
        ]);

        if (cancelled) return;

        const managedWork = getPublicWork(id);
        const resolvedPayload = managedWork
          ? {
            source: "managed",
            work: managedWork,
            author: null,
            manuscripts: ownManuscripts
          }
          : publicPayload;

        if (!resolvedPayload?.work) {
          setWork(null);
          setAuthor(null);
          setChapters([]);
          setManuscripts([]);
          setUser(currentUser);
          setIsManagedPublicWork(false);
          setModerationState({ isBlocked: false, blockedByViewer: false, viewerBlockedByUser: false });
          setLoadError("Não encontramos essa obra pública. Ela pode ter sido removida ou ainda não foi publicada corretamente.");
          return;
        }

        const manuscriptList = resolvedPayload.manuscripts || [];
        const normalizedWork =
          resolvedPayload.source === "managed"
            ? normalizePublicWork(resolvedPayload.work)
            : buildProjectBackedWork(resolvedPayload.work, manuscriptList);

        const nextChapters = (normalizedWork.chapter_entries || [])
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
        setAuthor(resolvedPayload.author || null);
        setWork(normalizedWork);
        setChapters(nextChapters);
        setManuscripts(manuscriptList);
        setIsManagedPublicWork(resolvedPayload.source === "managed");
        setModerationState(
          resolvedPayload.author?.email
            ? await base44.moderation.getUserModerationState(resolvedPayload.author.email)
            : { isBlocked: false, blockedByViewer: false, viewerBlockedByUser: false }
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load public work page", error);
        setWork(null);
        setAuthor(null);
        setChapters([]);
        setLoadError(error?.message || "Não foi possível carregar esta obra pública.");
        toast.error(error?.message || "Não foi possível carregar esta obra pública.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isOwner = Boolean(user?.email && work?.created_by === user.email && isManagedPublicWork);
  const manuscriptOptions = useMemo(() => getAvailableManuscriptOptions(manuscripts, work), [manuscripts, work]);
  const selectedChapter = useMemo(() => {
    const chapter = chapters.find((entry) => entry.id === selectedChapterId);
    if (!chapter) return null;

    const manuscript = manuscripts.find((entry) => entry.id === chapter.manuscript_id);
    return {
      ...chapter,
      content: manuscript?.content || "",
      manuscript_type: manuscript?.type || chapter.manuscript_type || "Capítulo"
    };
  }, [chapters, manuscripts, selectedChapterId]);

  const chapterBlocks = useMemo(() => extractChapterBlocks(selectedChapter?.content || ""), [selectedChapter?.content]);
  const paragraphCommentCounts = useMemo(
    () =>
      chapterComments.reduce((accumulator, comment) => {
        if (comment.scope !== "paragraph" || !comment.paragraph_anchor) return accumulator;
        accumulator[comment.paragraph_anchor] = (accumulator[comment.paragraph_anchor] || 0) + 1;
        return accumulator;
      }, {}),
    [chapterComments]
  );
  const selectedParagraphBlock = useMemo(
    () => chapterBlocks.find((block) => block.type === "paragraph" && block.anchor === selectedParagraphAnchor) || null,
    [chapterBlocks, selectedParagraphAnchor]
  );
  const selectedParagraphComments = useMemo(
    () => chapterComments.filter((comment) => comment.scope === "paragraph" && comment.paragraph_anchor === selectedParagraphAnchor),
    [chapterComments, selectedParagraphAnchor]
  );
  const chapterGeneralComments = useMemo(
    () => chapterComments.filter((comment) => comment.scope === "chapter"),
    [chapterComments]
  );

  async function reloadOwnedData() {
    try {
      const publicPayload = await base44.social.getPublicWorkById(id).catch(() => null);
      const managedWork = getPublicWork(id);
      const resolvedPayload = managedWork
        ? {
            source: "managed",
            work: managedWork,
            author,
            manuscripts: manuscripts
          }
        : publicPayload;

      if (!resolvedPayload?.work) return;
      const manuscriptList = resolvedPayload.manuscripts || [];
      const normalizedWork =
        resolvedPayload.source === "managed"
          ? normalizePublicWork(resolvedPayload.work)
          : buildProjectBackedWork(resolvedPayload.work, manuscriptList);

      const nextChapters = (normalizedWork.chapter_entries || [])
        .map((entry) => {
          const manuscript = manuscriptList.find((item) => item.id === entry.manuscript_id);
          return {
            ...entry,
            excerpt: manuscript?.content?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) || "",
            manuscript_type: manuscript?.type || "Capítulo"
          };
        })
        .sort((left, right) => left.order - right.order);

      setWork(normalizedWork);
      setChapters(nextChapters);
      setManuscripts(manuscriptList);
      setIsManagedPublicWork(resolvedPayload.source === "managed");
    } catch (error) {
      toast.error(error?.message || "Não foi possível atualizar a obra pública.");
    }
  }

  useEffect(() => {
    if (!readerOpen || !selectedChapter || !work?.id) {
      setChapterComments([]);
      return;
    }

    let cancelled = false;

    async function loadChapterComments() {
      try {
        setCommentsLoading(true);
        const nextComments = await base44.social.listPublicChapterComments(work.id, selectedChapter.id);
        if (!cancelled) {
          setChapterComments(nextComments);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error?.message || "Não foi possível carregar os comentários deste capítulo.");
        }
      } finally {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      }
    }

    loadChapterComments();
    return () => {
      cancelled = true;
    };
  }, [readerOpen, selectedChapter, work?.id]);

  useEffect(() => {
    if (!readerOpen) return;
    if (!chapterBlocks.some((block) => block.type === "paragraph")) {
      setSelectedParagraphAnchor("");
      return;
    }

    if (!selectedParagraphAnchor || !chapterBlocks.some((block) => block.anchor === selectedParagraphAnchor)) {
      const firstParagraph = chapterBlocks.find((block) => block.type === "paragraph");
      setSelectedParagraphAnchor(firstParagraph?.anchor || "");
    }
  }, [chapterBlocks, readerOpen, selectedParagraphAnchor]);

  function handleOpenChapter(chapter) {
    setSelectedChapterId(chapter.id);
    setParagraphCommentDraft("");
    setChapterCommentDraft("");
    setReaderOpen(true);
  }

  async function handleSubmitComment(scope) {
    if (!selectedChapter || !work?.id) return;
    if (!user) {
      toast.error("Entre na sua conta para comentar neste capítulo.");
      return;
    }

    const isParagraphComment = scope === "paragraph";
    const draft = isParagraphComment ? paragraphCommentDraft : chapterCommentDraft;
    if (!draft.trim()) {
      toast.error("Escreva um comentário antes de enviar.");
      return;
    }

    if (isParagraphComment && !selectedParagraphBlock) {
      toast.error("Selecione um parágrafo para comentar.");
      return;
    }

    try {
      setSubmittingComment(true);
      const createdComment = await base44.social.createPublicChapterComment({
        work_id: work.id,
        chapter_entry_id: selectedChapter.id,
        manuscript_id: selectedChapter.manuscript_id,
        scope,
        paragraph_anchor: isParagraphComment ? selectedParagraphBlock.anchor : "",
        paragraph_excerpt: isParagraphComment ? selectedParagraphBlock.text.slice(0, 180) : "",
        content: draft
      });

      setChapterComments((current) =>
        [...current, createdComment].sort((left, right) => new Date(left.created_date) - new Date(right.created_date))
      );
      setWork((current) => (current ? { ...current, public_comments: (current.public_comments || 0) + 1 } : current));

      if (isParagraphComment) {
        setParagraphCommentDraft("");
      } else {
        setChapterCommentDraft("");
      }

      toast.success(isParagraphComment ? "Comentário do trecho enviado." : "Comentário final enviado.");
    } catch (error) {
      toast.error(error?.message || "Não foi possível enviar o comentário.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleImportChapter() {
    if (!selectedManuscriptId || !user?.email || !isManagedPublicWork) return;
    try {
      const selected = manuscripts.find((entry) => entry.id === selectedManuscriptId);
      if (!selected) return;
      addManuscriptsToPublicWork(id, [selected], user.email);
      setSelectedManuscriptId("");
      toast.success("Manuscrito importado como capítulo.");
      await reloadOwnedData();
    } catch (error) {
      toast.error(error?.message || "Não foi possível adicionar o capítulo.");
    }
  }

  async function handleMoveChapter(chapterId, direction) {
    if (!user?.email || !isManagedPublicWork) return;
    try {
      reorderPublicWorkChapter(id, chapterId, direction, user.email);
      await reloadOwnedData();
    } catch (error) {
      toast.error(error?.message || "Não foi possível reordenar o capítulo.");
    }
  }

  async function handleRemoveChapter(chapterId) {
    if (!user?.email || !isManagedPublicWork) return;
    try {
      removeChapterFromPublicWork(id, chapterId, user.email);
      await reloadOwnedData();
    } catch (error) {
      toast.error(error?.message || "Não foi possível remover o capítulo.");
    }
  }

  async function handleBlockAuthor() {
    if (!author?.email) return;
    try {
      await base44.moderation.blockUserByEmail(author.email);
      setShowBlockConfirm(false);
      setModerationState({ isBlocked: true, blockedByViewer: true, viewerBlockedByUser: false });
      toast.success("Usuário bloqueado.");
    } catch (error) {
      toast.error(error?.message || "Não foi possível bloquear este usuário.");
    }
  }

  async function handleUnblockAuthor() {
    if (!author?.email) return;
    try {
      await base44.moderation.unblockUserByEmail(author.email);
      setShowUnblockConfirm(false);
      setModerationState({ isBlocked: false, blockedByViewer: false, viewerBlockedByUser: false });
      toast.success("Usuário desbloqueado.");
    } catch (error) {
      toast.error(error?.message || "Não foi possível desbloquear este usuário.");
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
          {!isOwner && author ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="gap-2" onClick={() => setShowReportDialog(true)}>
                <Flag className="h-4 w-4" />
                Denunciar obra
              </Button>
              {moderationState.blockedByViewer ? (
                <Button type="button" variant="secondary" className="gap-2" onClick={() => setShowUnblockConfirm(true)}>
                  <ShieldCheck className="h-4 w-4" />
                  Desbloquear autor
                </Button>
              ) : (
                <Button type="button" variant="outline" className="gap-2" onClick={() => setShowBlockConfirm(true)}>
                  <Ban className="h-4 w-4" />
                  Bloquear autor
                </Button>
              )}
            </div>
          ) : null}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => handleOpenChapter(chapter)} className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Ler capítulo
                    </Button>
                    {isOwner ? (
                      <>
                        <Button type="button" variant="outline" size="icon" onClick={() => handleMoveChapter(chapter.id, "up")} disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => handleMoveChapter(chapter.id, "down")} disabled={index === chapters.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveChapter(chapter.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : null}
                  </div>
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

      <Dialog
        open={readerOpen}
        onOpenChange={(nextOpen) => {
          setReaderOpen(nextOpen);
          if (!nextOpen) {
            setParagraphCommentDraft("");
            setChapterCommentDraft("");
          }
        }}
      >
        <DialogContent className="max-w-6xl overflow-hidden p-0">
          <div className="grid max-h-[calc(100dvh-2rem)] lg:grid-cols-[minmax(0,1.3fr)_360px]">
            <div className="overflow-y-auto p-5 sm:p-7">
              <DialogHeader className="pr-10">
                <DialogTitle>{selectedChapter?.title || "Capítulo publicado"}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedChapter?.manuscript_type || "Capítulo"} publicado em leitura pública. Cada parágrafo pode receber comentários contextuais sem misturar com os comentários finais.
                </p>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                {chapterBlocks.map((block, index) =>
                  block.type === "heading" ? (
                    <div key={`${block.type}_${index}`} className={cn(block.level <= 2 ? "text-2xl font-bold tracking-tight text-foreground" : "text-lg font-semibold text-foreground")}>
                      {block.text}
                    </div>
                  ) : (
                    <article
                      key={block.anchor}
                      className={cn(
                        "rounded-2xl border px-4 py-4 transition-colors",
                        selectedParagraphAnchor === block.anchor ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border hover:bg-muted/30"
                      )}
                    >
                      <p className="text-base leading-8 text-foreground">{block.text}</p>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            selectedParagraphAnchor === block.anchor ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          )}
                          onClick={() => setSelectedParagraphAnchor(block.anchor)}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {paragraphCommentCounts[block.anchor] || 0} comentário{(paragraphCommentCounts[block.anchor] || 0) === 1 ? "" : "s"}
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            </div>

            <aside className="flex min-h-0 flex-col border-t border-border bg-background/70 lg:border-l lg:border-t-0">
              <div className="border-b border-border px-5 py-4">
                <p className="text-sm font-semibold text-foreground">Interações do capítulo</p>
                <p className="mt-1 text-sm text-muted-foreground">Comentários por trecho e comentários finais ficam separados para manter a leitura limpa.</p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                <section className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Comentários do trecho</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedParagraphBlock ? selectedParagraphBlock.text.slice(0, 120) : "Selecione um parágrafo para ver e enviar comentários contextuais."}
                    </p>
                  </div>

                  {commentsLoading ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando comentários...
                    </div>
                  ) : selectedParagraphBlock ? (
                    <>
                      <div className="space-y-3">
                        {selectedParagraphComments.length ? (
                          selectedParagraphComments.map((comment) => (
                            <article key={comment.id} className="rounded-2xl border border-border bg-card p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-foreground">{comment.author_name}</p>
                                <span className="text-xs text-muted-foreground">{formatCommentDate(comment.created_date)}</span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{comment.content}</p>
                            </article>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-5 text-sm text-muted-foreground">
                            Ainda não há comentários neste trecho.
                          </div>
                        )}
                      </div>

                      {user ? (
                        <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
                          <Textarea
                            value={paragraphCommentDraft}
                            onChange={(event) => setParagraphCommentDraft(event.target.value)}
                            rows={3}
                            placeholder="Escreva um comentário sobre este trecho..."
                          />
                          <Button type="button" onClick={() => handleSubmitComment("paragraph")} disabled={submittingComment} className="w-full gap-2">
                            {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                            Comentar trecho
                          </Button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-sm text-muted-foreground">
                          Entre na sua conta para comentar neste parágrafo.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-5 text-sm text-muted-foreground">
                      Selecione um parágrafo do capítulo para abrir a conversa contextual.
                    </div>
                  )}
                </section>

                <section className="space-y-3 border-t border-border pt-6">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Comentários finais do capítulo</p>
                    <p className="mt-1 text-xs text-muted-foreground">Use esta área para opiniões gerais sobre o capítulo inteiro.</p>
                  </div>

                  <div className="space-y-3">
                    {chapterGeneralComments.length ? (
                      chapterGeneralComments.map((comment) => (
                        <article key={comment.id} className="rounded-2xl border border-border bg-card p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground">{comment.author_name}</p>
                            <span className="text-xs text-muted-foreground">{formatCommentDate(comment.created_date)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{comment.content}</p>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-5 text-sm text-muted-foreground">
                        Ainda não há comentários finais neste capítulo.
                      </div>
                    )}
                  </div>

                  {user ? (
                    <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
                      <Textarea
                        value={chapterCommentDraft}
                        onChange={(event) => setChapterCommentDraft(event.target.value)}
                        rows={4}
                        placeholder="Deixe um comentário geral sobre este capítulo..."
                      />
                      <Button type="button" onClick={() => handleSubmitComment("chapter")} disabled={submittingComment} className="w-full gap-2">
                        {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        Comentar capítulo
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-sm text-muted-foreground">
                      Entre na sua conta para comentar ao final do capítulo.
                    </div>
                  )}
                </section>
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      <ReportContentDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        contentType="public_work"
        contentId={work.id}
        contentTitle={work.title}
        contentAuthorEmail={author?.email || work.created_by}
        triggerLabel="Denunciar obra pública"
      />

      <ConfirmDialog
        open={showBlockConfirm}
        onOpenChange={setShowBlockConfirm}
        title="Bloquear este autor?"
        description="Ao bloquear este usuário, o app passa a ocultar os conteúdos públicos dele para a sua conta sempre que isso for possível na camada atual."
        onConfirm={handleBlockAuthor}
        destructive
      />

      <ConfirmDialog
        open={showUnblockConfirm}
        onOpenChange={setShowUnblockConfirm}
        title="Desbloquear este autor?"
        description="Ao desbloquear, as obras e o perfil público desse autor voltam a ficar acessíveis para a sua conta."
        onConfirm={handleUnblockAuthor}
      />
    </div>
  );
}
