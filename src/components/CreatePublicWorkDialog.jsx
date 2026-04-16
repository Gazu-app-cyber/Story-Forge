import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ageRatingOptions, chapterModeOptions, completionStatusOptions } from "@/lib/publicWorks";
import { createPublicWork, updatePublicWork } from "@/lib/publicWorksStore";
import { STORY_GENRE_OPTIONS } from "@/lib/storyTemplates";

export default function CreatePublicWorkDialog({ open, onOpenChange, editWork, onSuccess }) {
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullSummary, setFullSummary] = useState("");
  const [genre, setGenre] = useState(STORY_GENRE_OPTIONS[0]?.value || "Romance");
  const [chapterMode, setChapterMode] = useState("open");
  const [plannedChapterCount, setPlannedChapterCount] = useState("");
  const [completionStatus, setCompletionStatus] = useState("ongoing");
  const [ageRating, setAgeRating] = useState("Livre");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTitle(editWork?.title || "");
    setCoverImage(editWork?.cover_image || "");
    setShortDescription(editWork?.short_description || "");
    setFullSummary(editWork?.full_summary || "");
    setGenre(editWork?.genre || STORY_GENRE_OPTIONS[0]?.value || "Romance");
    setChapterMode(editWork?.chapter_mode || "open");
    setPlannedChapterCount(editWork?.planned_chapter_count ? String(editWork.planned_chapter_count) : "");
    setCompletionStatus(editWork?.is_completed ? "completed" : "ongoing");
    setAgeRating(editWork?.age_rating || "Livre");
  }, [editWork, open]);

  const genreOptions = useMemo(() => STORY_GENRE_OPTIONS, []);

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCoverImage(file_url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      const payload = {
        title: title.trim(),
        cover_image: coverImage,
        short_description: shortDescription.trim(),
        full_summary: fullSummary.trim(),
        genre,
        chapter_mode: chapterMode,
        planned_chapter_count: chapterMode === "limited" ? Number(plannedChapterCount || 0) || "" : "",
        is_completed: completionStatus === "completed",
        age_rating: ageRating
      };

      if (editWork) {
        updatePublicWork(editWork.id, payload, currentUser.email);
        toast.success("Obra pública atualizada!");
      } else {
        createPublicWork(payload, currentUser.email);
        toast.success("Obra pública criada!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error?.message || "Não foi possível salvar a obra pública.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editWork ? "Editar obra pública" : "Nova obra pública"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <Label>Nome da obra</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5" placeholder="Nome obrigatório" />
              </div>
              <div>
                <Label>Descrição breve</Label>
                <Textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} className="mt-1.5" rows={3} placeholder="Texto curto para o feed e listagens." />
              </div>
            </div>
            <div>
              <Label>Capa da obra</Label>
              <div className="mt-1.5">
                {coverImage ? (
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                    <img src={coverImage} alt="" className="h-full w-full object-cover" />
                    <Button type="button" variant="destructive" size="sm" className="absolute right-2 top-2" onClick={() => setCoverImage("")}>
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border transition-colors hover:border-primary/40">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImagePlus className="mb-2 h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Adicionar capa</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label>Resumo completo</Label>
            <Textarea value={fullSummary} onChange={(event) => setFullSummary(event.target.value)} className="mt-1.5" rows={5} placeholder="Resumo detalhado mostrado apenas na página interna da obra." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Gênero</Label>
              <div className="mt-1.5">
                <AdaptiveSelect value={genre} onValueChange={setGenre} options={genreOptions} placeholder="Selecione um gênero" title="Gênero da obra" />
              </div>
            </div>
            <div>
              <Label>Classificação indicativa</Label>
              <div className="mt-1.5">
                <AdaptiveSelect value={ageRating} onValueChange={setAgeRating} options={ageRatingOptions} placeholder="Classificação indicativa" title="Classificação indicativa" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Duração / categoria de capítulos</Label>
              <div className="mt-1.5">
                <AdaptiveSelect value={chapterMode} onValueChange={setChapterMode} options={chapterModeOptions} placeholder="Formato dos capítulos" title="Duração da obra" />
              </div>
            </div>
            <div>
              <Label>Status de conclusão</Label>
              <div className="mt-1.5">
                <AdaptiveSelect value={completionStatus} onValueChange={setCompletionStatus} options={completionStatusOptions} placeholder="Status" title="Status da obra" />
              </div>
            </div>
          </div>

          {chapterMode === "limited" ? (
            <div>
              <Label>Quantidade inicial de capítulos</Label>
              <Input value={plannedChapterCount} onChange={(event) => setPlannedChapterCount(event.target.value.replace(/[^\d]/g, ""))} className="mt-1.5" placeholder="Ex.: 12" />
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Diferença importante</p>
            <p className="mt-2">Projeto é o espaço privado de escrita. Obra pública é a vitrine publicada no feed, onde você importa manuscritos como capítulos para leitura pública.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editWork ? "Salvar" : "Criar obra pública"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
