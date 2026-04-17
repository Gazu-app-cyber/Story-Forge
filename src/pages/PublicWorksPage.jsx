import { useEffect, useMemo, useState } from "react";
import { BookOpen, Library, Loader2, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CreatePublicWorkDialog from "@/components/CreatePublicWorkDialog";
import PublicWorkCard from "@/components/PublicWorkCard";
import { Button } from "@/components/ui/button";
import { listPublicWorksByAuthor } from "@/lib/publicWorksStore";

export default function PublicWorksPage() {
  const [works, setWorks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editWork, setEditWork] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setWorks(listPublicWorksByAuthor(currentUser.email).map((work) => ({ ...work, author_username: currentUser.username || "" })));
    } catch (error) {
      console.error("Failed to load public works", error);
      setWorks([]);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    function handleRefresh() {
      loadData();
    }

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storyforge:data-changed", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storyforge:data-changed", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, []);

  const completedCount = useMemo(() => works.filter((work) => work.is_completed).length, [works]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-shell discover-shell mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-10">
      <section className="mb-8 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Library className="h-3.5 w-3.5" />
              Obras publicas
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerencie sua vitrine publica</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Aqui voce acompanha todas as obras publicas criadas, organiza capitulos importados e prepara o que vai para o feed e para a descoberta.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 self-stretch lg:self-auto">
            <Plus className="h-4 w-4" />
            Nova obra publica
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            <span className="block text-2xl font-semibold text-foreground">{works.length}</span>
            obras publicas
          </div>
          <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            <span className="block text-2xl font-semibold text-foreground">{completedCount}</span>
            concluidas
          </div>
          <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            <span className="block text-2xl font-semibold text-foreground">{works.reduce((total, work) => total + (work.chapter_entries?.length || 0), 0)}</span>
            capitulos publicados
          </div>
        </div>
      </section>

      {works.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {works.map((work) => (
            <div key={work.id} className="space-y-3">
              <PublicWorkCard work={work} />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditWork(work)}>
                  Editar obra
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold text-foreground">Nenhuma obra publica criada ainda</p>
          <p className="mt-2 text-sm text-muted-foreground">Crie sua primeira obra publica para aparecer no inicio, no feed e na descoberta.</p>
          <Button className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Criar obra publica
          </Button>
        </div>
      )}

      <CreatePublicWorkDialog
        open={showCreate || !!editWork}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setShowCreate(false);
            setEditWork(null);
          }
        }}
        editWork={editWork}
        onSuccess={loadData}
      />
    </div>
  );
}
