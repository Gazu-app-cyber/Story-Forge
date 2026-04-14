import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateFolderDialog({ open, onOpenChange, editFolder, onSuccess }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(editFolder?.name || "");
  }, [editFolder, open]);

  async function handleSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (editFolder) {
        await base44.entities.Folder.update(editFolder.id, { name: name.trim() });
      } else {
        await base44.entities.Folder.create({ name: name.trim() });
      }
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editFolder ? "Renomear Pasta" : "Nova Pasta"}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label>Nome da Pasta</Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
            placeholder="Nome da pasta..."
            className="mt-1.5"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editFolder ? "Renomear" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
