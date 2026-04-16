export const chapterModeOptions = [
  { value: "oneshot", label: "Oneshot" },
  { value: "limited", label: "Quantidade definida de capítulos" },
  { value: "open", label: "Quantidade indefinida de capítulos" }
];

export const completionStatusOptions = [
  { value: "ongoing", label: "Em andamento" },
  { value: "completed", label: "Concluída" }
];

export const ageRatingOptions = [
  { value: "Livre", label: "Livre" },
  { value: "10+", label: "10+" },
  { value: "12+", label: "12+" },
  { value: "14+", label: "14+" },
  { value: "16+", label: "16+" },
  { value: "18+", label: "18+" },
  { value: "Conteúdo sensível", label: "Conteúdo sensível" }
];

export function normalizePublicWork(work = {}) {
  const source = work && typeof work === "object" ? work : {};
  const chapterEntries = Array.isArray(source.chapter_entries) ? source.chapter_entries : [];

  return {
    cover_image: "",
    short_description: "",
    full_summary: "",
    genre: "Geral",
    chapter_mode: "open",
    planned_chapter_count: "",
    is_completed: false,
    age_rating: "Livre",
    chapter_entries: chapterEntries
      .map((entry, index) => ({
        id: entry.id || `${entry.manuscript_id || "chapter"}_${index}`,
        manuscript_id: entry.manuscript_id || "",
        title: entry.title || `Capítulo ${index + 1}`,
        order: Number(entry.order) || index + 1,
        published_at: entry.published_at || "",
        image: entry.image || ""
      }))
      .sort((left, right) => left.order - right.order),
    visibility: "public",
    public_likes: 0,
    public_comments: 0,
    public_views: 0,
    public_origin: "original",
    ...source
  };
}

export function getPublicWorkStatusLabel(work) {
  return work?.is_completed ? "Concluída" : "Em andamento";
}

export function getPublicWorkChapterCount(work) {
  const normalized = normalizePublicWork(work);
  if (normalized.chapter_mode === "oneshot") return 1;
  if (normalized.chapter_mode === "limited" && normalized.planned_chapter_count) {
    return Number(normalized.planned_chapter_count) || normalized.chapter_entries.length;
  }
  return normalized.chapter_entries.length;
}

export function getAvailableManuscriptOptions(manuscripts = [], publicWork) {
  const currentIds = new Set((normalizePublicWork(publicWork).chapter_entries || []).map((entry) => entry.manuscript_id));
  return manuscripts
    .filter((manuscript) => !currentIds.has(manuscript.id))
    .map((manuscript) => ({
      value: manuscript.id,
      label: manuscript.name
    }));
}
