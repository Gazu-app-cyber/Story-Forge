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

export default function CreateProjectDialog({ open, onOpenChange, folders, editProject, initialFolderId = "", onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState("none");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(editProject?.name || "");
    setDescription(editProject?.description || "");
    setFolderId(editProject?.folder_id || initialFolderId || "none");
    setCoverImage(editProject?.cover_image || "");
  }, [editProject, initialFolderId, open]);

  const folderOptions = useMemo(
    () => [{ value: "none", label: "Sem pasta" }, ...(folders || []).map((folder) => ({ value: folder.id, label: folder.name }))],
    [folders]
  );

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
    if (!name.trim()) return;
    setLoading(true);
    const data = {
      name: name.trim(),
      description: description.trim(),
      cover_image: coverImage,
      folder_id: folderId === "none" ? "" : folderId
    };

    try {
      if (editProject) {
        await base44.entities.Project.update(editProject.id, data);
      } else {
        await base44.entities.Project.create(data);
      }
      toast.success(editProject ? "Projeto atualizado!" : "Projeto criado!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save project", error);
      toast.error(error?.message || "Não foi possível salvar o projeto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Nome do Projeto</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Minha história incrível..." className="mt-1.5" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Sobre o que é este projeto..."
              className="mt-1.5"
              rows={3}
            />
          </div>
          <div>
            <Label>Pasta</Label>
            <div className="mt-1.5">
              <AdaptiveSelect value={folderId} onValueChange={setFolderId} options={folderOptions} placeholder="Sem pasta" title="Selecionar pasta" />
            </div>
          </div>
          <div>
            <Label>Capa do Projeto</Label>
            <div className="mt-1.5">
              {coverImage ? (
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <img src={coverImage} alt="" className="h-full w-full object-cover" />
                  <Button type="button" variant="destructive" size="sm" className="absolute right-2 top-2" onClick={() => setCoverImage("")}>
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
            {editProject ? "Salvar" : "Criar Projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
