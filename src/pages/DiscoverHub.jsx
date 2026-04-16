import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import PublicWorkCard from "@/components/PublicWorkCard";
import { discoverOriginOptions, discoverSortOptions, discoverStatusOptions, filterAndSortDiscoverWorks, getDiscoverGenres } from "@/lib/discoverFeed";
import { listDiscoverPublicWorks } from "@/lib/publicWorksStore";
import { Input } from "@/components/ui/input";

export default function DiscoverHub() {
  const [works, setWorks] = useState([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [status, setStatus] = useState("all");
  const [origin, setOrigin] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    async function loadWorks() {
      try {
        const users = await base44.auth.listUsers().catch(() => []);
        setWorks(listDiscoverPublicWorks(users));
      } catch {
        setWorks([]);
      }
    }

    loadWorks();
  }, []);

  const genreOptions = useMemo(() => getDiscoverGenres(works), [works]);
  const visibleWorks = useMemo(() => filterAndSortDiscoverWorks(works, { query, genre, status, origin, sortBy }), [works, query, genre, status, origin, sortBy]);

  return (
    <div className="page-shell discover-shell mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-10">
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Descoberta literária
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Explore autores, histórias e obras públicas em um só lugar</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A home continua com o feed principal, e aqui você ganha uma navegação dedicada para descobrir obras,
              filtrar por gênero, status e encontrar novos autores para acompanhar.
            </p>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/60 px-4 py-3"><span className="block text-xl font-semibold text-foreground">{works.length}</span> obras públicas</div>
            <div className="rounded-2xl bg-muted/60 px-4 py-3"><span className="block text-xl font-semibold text-foreground">{Math.max(genreOptions.length - 1, 0)}</span> gêneros</div>
            <div className="rounded-2xl bg-muted/60 px-4 py-3"><span className="block text-xl font-semibold text-foreground">{new Set(works.map((item) => item.author_username)).size}</span> autores</div>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-[1.75rem] border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, autor, gênero ou tag..." className="pl-9" />
          </div>
          <AdaptiveSelect value={genre} onValueChange={setGenre} options={genreOptions} placeholder="Gênero" title="Filtrar por gênero" />
          <AdaptiveSelect value={status} onValueChange={setStatus} options={discoverStatusOptions} placeholder="Status" title="Filtrar por status" />
          <AdaptiveSelect value={origin} onValueChange={setOrigin} options={discoverOriginOptions} placeholder="Origem" title="Filtrar por origem" />
          <AdaptiveSelect value={sortBy} onValueChange={setSortBy} options={discoverSortOptions} placeholder="Ordenar" title="Ordenar obras" />
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-card px-3 py-1.5">{visibleWorks.length} resultados</span>
        {query ? <span className="rounded-full border border-border bg-card px-3 py-1.5">Busca: {query}</span> : null}
        {genre !== "all" ? <span className="rounded-full border border-border bg-card px-3 py-1.5">{genre}</span> : null}
        {status !== "all" ? <span className="rounded-full border border-border bg-card px-3 py-1.5">{status}</span> : null}
        {origin !== "all" ? <span className="rounded-full border border-border bg-card px-3 py-1.5">{origin === "fanfic" ? "Fanfic" : "Original"}</span> : null}
      </div>

      {visibleWorks.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleWorks.map((work) => (
            <PublicWorkCard key={work.id} work={work} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-20 text-center">
          <p className="text-lg font-semibold text-foreground">Nenhuma obra combina com os filtros atuais</p>
          <p className="mt-2 text-sm text-muted-foreground">Experimente outro gênero, status ou uma busca mais ampla para descobrir novas histórias.</p>
        </div>
      )}
    </div>
  );
}
