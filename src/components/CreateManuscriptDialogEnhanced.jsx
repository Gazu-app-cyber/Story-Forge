import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_DOCUMENT_LAYOUT } from "@/lib/documentLayout";
import { createDefaultManuscriptStructure } from "@/lib/manuscriptStructure";
import { manuscriptTypes } from "@/lib/manuscriptTypes";
import { useIsMobile } from "@/hooks/use-mobile";
import { checkFeatureAccess } from "@/lib/planLimits";
import { getStoryTemplateById, STORY_TEMPLATES } from "@/lib/storyTemplates";
import { cn } from "@/lib/utils";

export default function CreateManuscriptDialogEnhanced({ open, onOpenChange, projectId, editManuscript, onSuccess }) {
  const [name, setName] = useState("");
  const [type, setType] = useState(manuscriptTypes[0] || "Capitulo");
  const [image, setImage] = useState("");
  const [templateId, setTemplateId] = useState("blank");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setName(editManuscript?.name || "");
    setType(editManuscript?.type || manuscriptTypes[0] || "Capitulo");
    setImage(editManuscript?.image || "");
    setTemplateId(editManuscript?.template_id || "blank");
  }, [editManuscript, open]);

  useEffect(() => {
    if (!open) return;
    base44.auth.me().then(setUser).catch(() => {});
  }, [open]);

  const typeOptions = useMemo(() => manuscriptTypes.map((item) => ({ value: item, label: item })), []);
  const templateOptions = useMemo(
    () =>
      STORY_TEMPLATES.map((template) => ({
        value: template.id,
        label: `${template.name} • ${template.category}`
      })),
    []
  );
  const canUseTemplates = checkFeatureAccess("templates", user);
  const selectedTemplate = useMemo(() => getStoryTemplateById(templateId), [templateId]);

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImage(file_url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    const data = {
      name: name.trim(),
      type,
      image,
      content: editManuscript?.content || (canUseTemplates ? selectedTemplate.content : ""),
      layout: editManuscript?.layout || (canUseTemplates ? selectedTemplate.layout : DEFAULT_DOCUMENT_LAYOUT),
      template_id: editManuscript?.template_id || (canUseTemplates ? selectedTemplate.id : "blank"),
      structure_json: editManuscript?.structure_json || createDefaultManuscriptStructure(canUseTemplates ? selectedTemplate.id : "blank"),
      project_id: projectId
    };

    try {
      if (editManuscript) await base44.entities.Manuscript.update(editManuscript.id, data);
      else await base44.entities.Manuscript.create(data);
      toast.success(editManuscript ? "Manuscrito atualizado!" : "Manuscrito criado!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error?.message || "Nao foi possivel salvar o manuscrito.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editManuscript ? "Editar Manuscrito" : "Novo Manuscrito"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[72dvh] space-y-4 overflow-y-auto overscroll-contain py-4 pr-1 [-webkit-overflow-scrolling:touch]">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do manuscrito..." className="mt-1.5" />
          </div>

          <div>
            <Label>Tipo / Categoria</Label>
            <div className="mt-1.5">
              <AdaptiveSelect value={type} onValueChange={setType} options={typeOptions} placeholder="Selecione um tipo" title="Selecionar categoria" />
            </div>
          </div>

          {canUseTemplates && !editManuscript ? (
            <div className="space-y-3">
              <div>
                <Label>Template da historia</Label>
                <p className="mt-1 text-xs text-muted-foreground">Escolha um ponto de partida rico para abrir o manuscrito com estrutura, perguntas e dicas praticas do genero.</p>
              </div>

              {isMobile ? (
                <AdaptiveSelect
                  value={templateId}
                  onValueChange={setTemplateId}
                  options={templateOptions}
                  placeholder="Escolha um template"
                  title="Templates de manuscrito"
                  description="Selecione o modelo de historia sem precisar rolar uma grade longa dentro do dialog."
                />
              ) : (
                <div className="grid max-h-72 gap-2 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch] sm:grid-cols-2">
                  {STORY_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setTemplateId(template.id)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-all",
                        template.id === templateId ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{template.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{template.category}</p>
                        </div>
                        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{template.detailLevel}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{template.description}</p>
                      <p className="mt-2 text-[11px] font-medium text-primary">{template.format}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedTemplate.id !== "blank" ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{selectedTemplate.name}</p>
                    <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{selectedTemplate.category}</span>
                    <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{selectedTemplate.detailLevel}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estrutura sugerida</p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {selectedTemplate.structure.slice(0, 3).map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Perguntas-guia</p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {selectedTemplate.guideQuestions.slice(0, 3).map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <Label>Imagem (opcional)</Label>
            <div className="mt-1.5">
              {image ? (
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <Button type="button" variant="destructive" size="sm" className="absolute right-2 top-2" onClick={() => setImage("")}>
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/40">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImagePlus className="mb-2 h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Escolher imagem</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editManuscript ? "Salvar" : "Criar Manuscrito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
