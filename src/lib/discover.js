export const discoverSortOptions = [
  { value: "recent", label: "Mais recentes" },
  { value: "popular", label: "Mais populares" },
  { value: "liked", label: "Mais curtidas" },
  { value: "commented", label: "Mais comentadas" },
  { value: "viewed", label: "Mais visualizadas" },
  { value: "title", label: "Título (A - Z)" }
];

export const discoverStatusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "Em andamento", label: "Em andamento" },
  { value: "Completa", label: "Completa" }
];

export const discoverOriginOptions = [
  { value: "all", label: "Todas as origens" },
  { value: "original", label: "Original" },
  { value: "fanfic", label: "Fanfic" }
];

export function getDiscoverGenres(works) {
  const genres = Array.from(new Set(works.map((work) => work.public_genre).filter(Boolean)));
  return [{ value: "all", label: "Todos os gêneros" }, ...genres.sort((a, b) => a.localeCompare(b, "pt-BR")).map((genre) => ({ value: genre, label: genre }))];
}

export function filterAndSortDiscoverWorks(works, filters) {
  const query = String(filters.query || "").trim().toLowerCase();
  const genre = filters.genre || "all";
  const status = filters.status || "all";
  const origin = filters.origin || "all";
  const sortBy = filters.sortBy || "recent";

  const filtered = works.filter((work) => {
    const haystack = [work.name, work.author_name, work.public_genre, ...(work.public_tags || [])].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesGenre = genre === "all" || work.public_genre === genre;
    const matchesStatus = status === "all" || work.public_status === status;
    const matchesOrigin = origin === "all" || work.public_origin === origin;
    return matchesQuery && matchesGenre && matchesStatus && matchesOrigin;
  });

  return [...filtered].sort((left, right) => {
    switch (sortBy) {
      case "popular":
        return (right.public_likes + right.public_views) - (left.public_likes + left.public_views);
      case "liked":
        return right.public_likes - left.public_likes;
      case "commented":
        return right.public_comments - left.public_comments;
      case "viewed":
        return right.public_views - left.public_views;
      case "title":
        return left.name.localeCompare(right.name, "pt-BR");
      default:
        return new Date(right.updated_date || 0) - new Date(left.updated_date || 0);
    }
  });
}
