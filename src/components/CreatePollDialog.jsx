import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function createInitialOptions() {
  return ["", ""];
}

export default function CreatePollDialog({ open, onOpenChange, onSuccess }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(createInitialOptions());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setQuestion("");
      setOptions(createInitialOptions());
    }
  }, [open]);

  const filledOptions = useMemo(() => options.map((option) => option.trim()).filter(Boolean), [options]);

  function updateOption(index, value) {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  }

  function addOption() {
    setOptions((current) => (current.length >= 6 ? current : [...current, ""]));
  }

  function removeOption(index) {
    setOptions((current) => (current.length <= 2 ? current : current.filter((_, optionIndex) => optionIndex !== index)));
  }

  async function handleSubmit() {
    if (!question.trim() || filledOptions.length < 2) return;
    setLoading(true);
    try {
      await base44.social.createPoll({
        question: question.trim(),
        options: filledOptions.map((label, index) => ({ id: `option_${index + 1}`, label, votes: 0 }))
      });
      toast.success("Enquete publicada!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error?.message || "Não foi possível publicar a enquete.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova enquete</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Pergunta</Label>
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="mt-1.5"
              placeholder="Ex.: Qual capa combina melhor com a história?"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Opções</Label>
              <Button type="button" size="sm" variant="outline" onClick={addOption} disabled={options.length >= 6} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar opção
              </Button>
            </div>
            {options.map((option, index) => (
              <div key={`poll-option-${index}`} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Opção ${index + 1}`}
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeOption(index)} disabled={options.length <= 2}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            As enquetes aparecem no perfil público do autor e já ficam prontas para futuras áreas de interação e descoberta.
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !question.trim() || filledOptions.length < 2}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publicar enquete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
