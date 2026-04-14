import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserNotRegisteredError() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">Acesso restrito</h1>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Sua conta ainda não está registrada para usar este aplicativo. Verifique se você entrou com o
          e-mail correto ou solicite acesso ao administrador.
        </p>
        <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">Se isso parece um erro:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>confirme que entrou com a conta certa</li>
            <li>tente sair e entrar novamente</li>
            <li>peça liberação para o administrador do app</li>
          </ul>
        </div>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  );
}
