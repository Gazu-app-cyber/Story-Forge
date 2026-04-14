import { Home, SearchX } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function PageNotFound() {
  const location = useLocation();

  return (
    <div className="page-shell flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <SearchX className="h-7 w-7 text-primary" />
        </div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Erro 404</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">Página não encontrada</h1>
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          O caminho <span className="font-medium text-foreground">{location.pathname}</span> não existe nesta versão do Escritório.
        </p>
        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
