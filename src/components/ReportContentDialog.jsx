import { useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const reportReasonOptions = [
  { value: "conteudo_improprio", label: "Conteudo improprio" },
  { value: "nudez", label: "Nudez" },
  { value: "violencia", label: "Violencia" },
  { value: "assedio", label: "Assedio" },
  { value: "spam", label: "Spam" },
  { value: "direitos_autorais", label: "Violacao de direitos" },
  { value: "other", label: "Outro" }
];

const EMPTY_FORM = {
  reason: "",
  details: ""
};

export default function ReportContentDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
  contentAuthorEmail,
  triggerLabel = "Denunciar",
  onSuccess
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const reasonLabel = useMemo(
    () => reportReasonOptions.find((option) => option.value === form.reason)?.label || "",
    [form.reason]
  );

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.reason) {
      toast.error("Escolha um motivo para enviar a denuncia.");
      return;
    }

    setSubmitting(true);
    try {
      await base44.moderation.reportContent({
        content_type: contentType,
        content_id: contentId,
        content_title: contentTitle,
        reported_author: contentAuthorEmail,
        reason: form.reason,
        details: form.details
      });
      toast.success("Denuncia enviada com sucesso.");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error?.message || "Nao foi possivel enviar a denuncia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            {triggerLabel}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Voce esta denunciando: <span className="font-medium text-foreground">{contentTitle || "Conteudo publico"}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Motivo da denuncia</label>
            <AdaptiveSelect
              value={form.reason}
              onValueChange={(value) => setForm((current) => ({ ...current, reason: value }))}
              options={reportReasonOptions}
              placeholder="Selecione um motivo"
              title="Selecionar motivo"
              description="Escolha o motivo que melhor representa o problema identificado."
            />
            {reasonLabel ? <p className="text-xs text-muted-foreground">Motivo selecionado: {reasonLabel}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Detalhes adicionais (opcional)</label>
            <Textarea
              value={form.details}
              onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
              placeholder="Explique o contexto da denuncia, se necessario."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar denuncia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
