import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import { DEFAULT_DOCUMENT_LAYOUT } from "@/lib/documentLayout";
import { manuscriptTypes } from "@/lib/manuscriptTypes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateManuscriptDialog({ open, onOpenChange, projectId, editManuscript, onSuccess }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Capítulo");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(editManuscript?.name || "");
    setType(editManuscript?.type || "Capítulo");
    setImage(editManuscript?.image || "");
  }, [editManuscript, open]);

  const typeOptions = useMemo(() => manuscriptTypes.map((item) => ({ value: item, label: item })), []);

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
      layout: editManuscript?.layout || DEFAULT_DOCUMENT_LAYOUT,
      project_id: projectId
    };

    try {
      if (editManuscript) {
        await base44.entities.Manuscript.update(editManuscript.id, data);
      } else {
        await base44.entities.Manuscript.create(data);
      }
      toast.success(editManuscript ? "Manuscrito atualizado!" : "Manuscrito criado!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save manuscript", error);
      toast.error(error?.message || "Não foi possível salvar o manuscrito.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editManuscript ? "Editar Manuscrito" : "Novo Manuscrito"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editManuscript ? "Salvar" : "Criar Manuscrito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
