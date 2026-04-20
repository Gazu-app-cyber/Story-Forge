import { dispatchStoryforgeDataChanged, safeReadJson, safeWriteJson } from "@/lib/safeBrowserStorage";

const STORAGE_KEY = "storyforge_public_chapter_comments";

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildParagraphAnchorKey(text, occurrence = 0) {
  const base = slugify(text) || "paragrafo";
  return `${base}__${Math.max(0, Number(occurrence) || 0)}`;
}

function normalizeComment(comment = {}) {
  return {
    id: comment.id || createId("chapter_comment"),
    work_id: String(comment.work_id || ""),
    chapter_entry_id: String(comment.chapter_entry_id || ""),
    manuscript_id: String(comment.manuscript_id || ""),
    scope: comment.scope === "paragraph" ? "paragraph" : "chapter",
    paragraph_anchor: comment.scope === "paragraph" ? String(comment.paragraph_anchor || "") : "",
    paragraph_excerpt: comment.scope === "paragraph" ? normalizeText(comment.paragraph_excerpt || "") : "",
    author_id: String(comment.author_id || ""),
    author_email: String(comment.author_email || "").trim().toLowerCase(),
    author_name: normalizeText(comment.author_name || "Leitor"),
    author_username: String(comment.author_username || ""),
    author_avatar: String(comment.author_avatar || ""),
    parent_id: String(comment.parent_id || ""),
    content: normalizeText(comment.content || ""),
    created_date: comment.created_date || nowIso(),
    updated_date: comment.updated_date || comment.created_date || nowIso()
  };
}

function createSeedComments() {
  const timestamp = nowIso();

  return [
    normalizeComment({
      id: "chapter_comment_demo_1",
      work_id: "public_work_demo",
      chapter_entry_id: "public_work_demo_chapter_1",
      manuscript_id: "manuscript_demo",
      scope: "paragraph",
      paragraph_anchor: buildParagraphAnchorKey("Era uma vez uma escritora tentando transformar seu app em uma casa para autores brasileiros.", 0),
      paragraph_excerpt: "Era uma vez uma escritora tentando transformar seu app em uma casa para autores brasileiros.",
      author_id: "reader_demo_1",
      author_email: "leitor1@storyforge.app",
      author_name: "Leitora beta",
      author_username: "leitora_beta",
      content: "Gostei do tom logo na primeira frase. Dá vontade de continuar."
    }),
    normalizeComment({
      id: "chapter_comment_demo_2",
      work_id: "public_work_demo",
      chapter_entry_id: "public_work_demo_chapter_1",
      manuscript_id: "manuscript_demo",
      scope: "chapter",
      author_id: "reader_demo_2",
      author_email: "leitor2@storyforge.app",
      author_name: "Carlos",
      author_username: "carlosle",
      content: "Capítulo curto, mas abre bem a proposta do universo."
    }),
    normalizeComment({
      id: "chapter_comment_demo_3",
      work_id: "project_author_public",
      chapter_entry_id: "project_chapter_manuscript_author_public",
      manuscript_id: "manuscript_author_public",
      scope: "paragraph",
      paragraph_anchor: buildParagraphAnchorKey("Na noite em que a cidade ganhou um segundo céu, Elisa jurou que nunca mais pisaria no viaduto da Lagoinha. Três dias depois, ela estava de volta.", 0),
      paragraph_excerpt: "Na noite em que a cidade ganhou um segundo céu, Elisa jurou que nunca mais pisaria no viaduto da Lagoinha. Três dias depois, ela estava de volta.",
      author_id: "reader_demo_3",
      author_email: "leitor3@storyforge.app",
      author_name: "Dani",
      author_username: "dani_reads",
      content: "Esse gancho final ficou muito forte."
    })
  ];
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

export function ensurePublicChapterCommentsSeed() {
  const current = readStorage();
  if (current.length) {
    return current.map((entry) => normalizeComment(entry));
  }

  const seed = createSeedComments();
  writeStorage(seed, { silent: true });
  return seed;
}

export function listPublicChapterComments() {
  return clone(ensurePublicChapterCommentsSeed().map((entry) => normalizeComment(entry)));
}

export function listCommentsForChapter(workId, chapterEntryId) {
  return listPublicChapterComments()
    .filter((entry) => entry.work_id === workId && entry.chapter_entry_id === chapterEntryId)
    .sort((left, right) => new Date(left.created_date) - new Date(right.created_date));
}

export function getCommentCountsByWork() {
  return listPublicChapterComments().reduce((accumulator, comment) => {
    accumulator[comment.work_id] = (accumulator[comment.work_id] || 0) + 1;
    return accumulator;
  }, {});
}

export function getCommentCountForWork(workId) {
  return getCommentCountsByWork()[workId] || 0;
}

export function createPublicChapterComment(payload) {
  const content = normalizeText(payload.content || "");
  if (!content) {
    throw new Error("Escreva um comentário antes de enviar.");
  }

  const nextComment = normalizeComment({
    ...payload,
    content
  });

  const comments = listPublicChapterComments();
  comments.push(nextComment);
  writeStorage(comments);
  return clone(nextComment);
}

export function deleteChapterCommentsByAuthor(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return;

  const filtered = listPublicChapterComments().filter((entry) => entry.author_email !== normalizedEmail);
  writeStorage(filtered);
}
