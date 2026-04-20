import { normalizePublicWork } from "@/lib/publicWorks";
import { dispatchStoryforgeDataChanged, safeReadJson, safeWriteJson } from "@/lib/safeBrowserStorage";

const STORAGE_KEY = "storyforge_public_works";

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStorage() {
  return safeReadJson(STORAGE_KEY, []);
}

function writeStorage(value, options = {}) {
  safeWriteJson(STORAGE_KEY, value);
  if (!options.silent) {
    dispatchStoryforgeDataChanged(STORAGE_KEY);
  }
}

function createDemoPublicWorks() {
  const createdDate = nowIso();
  return [
    normalizePublicWork({
      id: "public_work_demo",
      title: "As Crônicas do Vale",
      cover_image: "",
      short_description: "Fantasia brasileira com ruínas antigas, relíquias vivas e personagens tentando sobreviver ao próprio passado.",
      full_summary:
        "Quando o Vale volta a sussurrar nomes esquecidos, uma cartógrafa desacreditada precisa liderar um grupo improvável por ruínas que reescrevem memórias. Quanto mais avançam, mais o passado de cada um se mistura à magia que quer engolir a região.",
      genre: "Fantasia",
      chapter_mode: "open",
      planned_chapter_count: "",
      is_completed: false,
      age_rating: "14+",
      chapter_entries: [
        {
          id: "public_work_demo_chapter_1",
          manuscript_id: "manuscript_demo",
          title: "Capítulo 1",
          order: 1,
          published_at: createdDate
        }
      ],
      public_likes: 324,
      public_comments: 41,
      public_views: 4820,
      public_origin: "original",
      created_by: "demo@storyforge.app",
      created_date: createdDate,
      updated_date: createdDate
    })
  ];
}

export function ensurePublicWorksSeed() {
  const current = readStorage();
  if (current.length) return current.map((entry) => normalizePublicWork(entry));
  const seed = createDemoPublicWorks();
  writeStorage(seed, { silent: true });
  return seed;
}

export function listPublicWorks() {
  return clone(ensurePublicWorksSeed().map((entry) => normalizePublicWork(entry)));
}

export function listPublicWorksByAuthor(email) {
  return listPublicWorks()
    .filter((work) => !work.created_by || work.created_by === email)
    .sort((left, right) => new Date(right.updated_date) - new Date(left.updated_date));
}

export function listDiscoverPublicWorks(users = []) {
  return listPublicWorks()
    .sort((left, right) => new Date(right.updated_date) - new Date(left.updated_date))
    .map((work) => {
      const author = users.find((entry) => entry.email === work.created_by);
      return {
        ...clone(work),
        name: work.title,
        description: work.full_summary,
        public_summary: work.short_description,
        public_status: work.is_completed ? "Completa" : "Em andamento",
        public_genre: work.genre,
        public_tags: [],
        author_name: author?.display_name || author?.full_name || "Autor",
        author_username: author?.username || "",
        author_avatar: author?.profile_image || "",
        author_bio: author?.bio || "",
        chapter_count: getPublicWorkChapterCount(work),
        manuscript_count: getPublicWorkChapterCount(work)
      };
    });
}

export function getPublicWork(id) {
  return listPublicWorks().find((entry) => entry.id === id) || null;
}

export function createPublicWork(data, userEmail) {
  const current = listPublicWorks();
  const timestamp = nowIso();
  const next = normalizePublicWork({
    id: createId("public_work"),
    ...data,
    public_origin: data.public_origin || "original",
    created_by: userEmail,
    created_date: timestamp,
    updated_date: timestamp
  });
  current.push(next);
  writeStorage(current);
  return clone(next);
}

export function updatePublicWork(id, patch, userEmail) {
  const current = listPublicWorks();
  const index = current.findIndex((entry) => entry.id === id && entry.created_by === userEmail);
  if (index === -1) throw new Error("Obra pública não encontrada.");
  current[index] = normalizePublicWork({
    ...current[index],
    ...patch,
    updated_date: nowIso()
  });
  writeStorage(current);
  return clone(current[index]);
}

export function setPublicWorkCommentCount(workId, count) {
  const current = listPublicWorks();
  const index = current.findIndex((entry) => entry.id === workId);
  if (index === -1) return null;

  current[index] = normalizePublicWork({
    ...current[index],
    public_comments: Math.max(0, Number(count) || 0),
    updated_date: nowIso()
  });

  writeStorage(current);
  return clone(current[index]);
}

export function deletePublicWork(id, userEmail) {
  const current = listPublicWorks();
  const filtered = current.filter((entry) => !(entry.id === id && entry.created_by === userEmail));
  writeStorage(filtered);
}

export function addManuscriptsToPublicWork(publicWorkId, manuscripts, userEmail) {
  const work = getPublicWork(publicWorkId);
  if (!work || work.created_by !== userEmail) throw new Error("Obra pública não encontrada.");

  const currentIds = new Set(work.chapter_entries.map((entry) => entry.manuscript_id));
  const nextEntries = [...work.chapter_entries];
  let lastOrder = nextEntries.reduce((max, entry) => Math.max(max, entry.order), 0);

  for (const manuscript of manuscripts) {
    if (currentIds.has(manuscript.id)) continue;
    lastOrder += 1;
    nextEntries.push({
      id: createId("public_chapter"),
      manuscript_id: manuscript.id,
      title: manuscript.name,
      order: lastOrder,
      published_at: nowIso(),
      image: manuscript.image || ""
    });
  }

  return updatePublicWork(publicWorkId, { chapter_entries: nextEntries }, userEmail);
}

export function reorderPublicWorkChapter(publicWorkId, chapterId, direction, userEmail) {
  const work = getPublicWork(publicWorkId);
  if (!work || work.created_by !== userEmail) throw new Error("Obra pública não encontrada.");

  const entries = [...work.chapter_entries].sort((left, right) => left.order - right.order);
  const index = entries.findIndex((entry) => entry.id === chapterId);
  if (index === -1) return work;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= entries.length) return work;

  [entries[index], entries[targetIndex]] = [entries[targetIndex], entries[index]];
  const normalizedEntries = entries.map((entry, nextIndex) => ({
    ...entry,
    order: nextIndex + 1
  }));

  return updatePublicWork(publicWorkId, { chapter_entries: normalizedEntries }, userEmail);
}

export function removeChapterFromPublicWork(publicWorkId, chapterId, userEmail) {
  const work = getPublicWork(publicWorkId);
  if (!work || work.created_by !== userEmail) throw new Error("Obra pública não encontrada.");

  const normalizedEntries = work.chapter_entries
    .filter((entry) => entry.id !== chapterId)
    .map((entry, index) => ({
      ...entry,
      order: index + 1
    }));

  return updatePublicWork(publicWorkId, { chapter_entries: normalizedEntries }, userEmail);
}

export function deletePublicWorksByAuthor(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return;

  const filtered = listPublicWorks().filter((entry) => entry.created_by?.toLowerCase() !== normalizedEmail);
  writeStorage(filtered);
}
