import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "A aplicação encontrou um erro inesperado ao iniciar."
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
          <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">Não foi possível carregar o StoryForge</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A aplicação encontrou um erro durante a inicialização. Atualize a página para tentar novamente. Se o problema persistir, os dados
              existentes continuam preservados.
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-background/70 px-4 py-3 text-left text-xs text-muted-foreground">
              {this.state.errorMessage}
            </div>
            <div className="mt-6">
              <Button type="button" onClick={this.handleReload} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

