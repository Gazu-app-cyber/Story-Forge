import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePostDialog({ open, onOpenChange, onSuccess }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setContent("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await base44.social.createPost({ content: content.trim() });
      toast.success("Post publicado!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error?.message || "Não foi possível publicar o post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="mt-1.5 min-h-40"
              rows={6}
              placeholder="Compartilhe uma atualização, bastidores da escrita, aviso de capítulo novo ou uma pergunta para seus leitores."
            />
            <div className="mt-2 text-right text-xs text-muted-foreground">{content.trim().length} caracteres</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Seu post será exibido no seu perfil público de autor e fica preparado para futuras áreas de feed social.
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publicar post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
