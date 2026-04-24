const MODULE_ORDER = ["plot", "world", "base", "characters", "theme", "general"];

export const MANUSCRIPT_MODULES = [
  { id: "plot", label: "Plot" },
  { id: "world", label: "Mundo" },
  { id: "base", label: "Base" },
  { id: "characters", label: "Pessoas" },
  { id: "theme", label: "Tema" },
  { id: "general", label: "Geral" }
];

export const BLOCK_TYPE_OPTIONS = [
  { value: "text", label: "Texto" },
  { value: "list", label: "Lista" },
  { value: "event", label: "Evento" },
  { value: "chapter", label: "Capitulo" },
  { value: "reference", label: "Referencia" }
];

export const CHARACTER_CATEGORY_OPTIONS = [
  { value: "main", label: "Personagem principal" },
  { value: "support", label: "Personagens de suporte" },
  { value: "shadow", label: "Sombra do protagonista" },
  { value: "other", label: "Outros" }
];

export const LOCATION_TYPE_OPTIONS = [
  { value: "country", label: "Pais" },
  { value: "city", label: "Cidade/Vila" },
  { value: "base", label: "Base" }
];

export const MAP_NODE_TYPE_OPTIONS = [
  { value: "free", label: "Marcador livre", icon: "📍" },
  { value: "mountain", label: "Montanha", icon: "⛰️" },
  { value: "forest", label: "Floresta", icon: "🌲" },
  { value: "river", label: "Rio", icon: "🛶" },
  { value: "lake", label: "Lago", icon: "💧" },
  { value: "sea", label: "Mar", icon: "🌊" },
  { value: "structure", label: "Estrutura iconica", icon: "🏰" },
  { value: "road", label: "Estrada", icon: "🛤️" },
  { value: "boundary", label: "Linha de limite", icon: "〰️" },
  { value: "meeting", label: "Ponto de encontro", icon: "⭐" },
  { value: "park", label: "Parque", icon: "🌳" }
];

export const CHAPTER_STAGE_OPTIONS = [
  { value: "introduction", label: "Introducao" },
  { value: "development", label: "Desenvolvimento" },
  { value: "climax", label: "Climax" },
  { value: "ending", label: "Final" }
];

export const TIMELINE_PRECISION_OPTIONS = [
  { value: "day", label: "Dia" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Ano" },
  { value: "era", label: "Era personalizada" }
];

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function asArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function sanitizeTagList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createEmptyBlock(type = "text") {
  return {
    id: createId("block"),
    type,
    title: "",
    collapsed: false,
    text: "",
    items: [""],
    referenceLabel: "",
    referenceTarget: "",
    eventDate: "",
    linkedCharacterIds: [],
    linkedLocationIds: [],
    linkedEventIds: []
  };
}

export function createEmptyChapter() {
  return {
    id: createId("chapter"),
    title: "Novo capitulo",
    stage: "development",
    parentId: "",
    summary: "",
    content: "",
    notes: "",
    collapsed: false,
    linkedEventIds: [],
    linkedCharacterIds: []
  };
}

export function createEmptyLocation() {
  return {
    id: createId("location"),
    name: "Novo local",
    type: "city",
    description: "",
    importance: "",
    symbolism: "",
    tags: [],
    characterIds: [],
    image: "",
    manuscriptIds: []
  };
}

export function createEmptyCharacter() {
  return {
    id: createId("character"),
    name: "Novo personagem",
    category: "main",
    storyRole: "",
    narrativeFunction: "",
    protagonistConflict: "",
    gender: "",
    age: "",
    pronouns: "",
    nicknames: "",
    speechStyle: "",
    personality: "",
    appearance: "",
    objectives: "",
    obstacles: "",
    strengths: "",
    weaknesses: "",
    mentalStateStart: "",
    mentalStateMiddle: "",
    mentalStateEnd: "",
    personalLife: "",
    socialLife: "",
    workLife: "",
    backstory: "",
    empathyHooks: "",
    timelineNotes: "",
    relatedChapterIds: [],
    linkedLocationIds: [],
    tags: []
  };
}

export function createEmptyRelation() {
  return {
    id: createId("relation"),
    fromCharacterId: "",
    toCharacterId: "",
    label: "",
    weight: "neutral"
  };
}

export function createEmptyTimelineEvent() {
  return {
    id: createId("timeline"),
    title: "Novo evento",
    description: "",
    precision: "day",
    date: "",
    eraLabel: "",
    characterIds: [],
    locationId: "",
    chapterIds: [],
    tags: [],
    image: ""
  };
}

export function createEmptyMapNode() {
  return {
    id: createId("mapnode"),
    name: "Novo ponto",
    type: "free",
    x: 140,
    y: 120,
    locationId: ""
  };
}

export function createEmptyMapConnection() {
  return {
    id: createId("maplink"),
    fromNodeId: "",
    toNodeId: "",
    label: ""
  };
}

export function createDefaultManuscriptStructure(templateId = "blank") {
  return {
    version: 1,
    templateId,
    modules: {
      plot: {
        blocks: [createEmptyBlock("text")],
        chapters: [createEmptyChapter()]
      },
      world: {
        blocks: [createEmptyBlock("text")],
        map: {
          zoom: 1,
          nodes: [createEmptyMapNode()],
          connections: []
        }
      },
      base: {
        locations: [createEmptyLocation()]
      },
      characters: {
        items: [createEmptyCharacter()],
        relations: []
      },
      theme: {
        blocks: [createEmptyBlock("text")]
      },
      general: {
        synopsis: "",
        audience: "",
        notes: "",
        tags: [],
        references: [createEmptyBlock("reference")]
      }
    },
    timeline: [createEmptyTimelineEvent()]
  };
}

function normalizeBlock(block = {}) {
  const type = BLOCK_TYPE_OPTIONS.some((item) => item.value === block.type) ? block.type : "text";
  return {
    ...createEmptyBlock(type),
    ...block,
    type,
    title: asString(block.title),
    text: asString(block.text),
    items: asArray(block.items, [""]).map((item) => asString(item)),
    collapsed: Boolean(block.collapsed),
    linkedCharacterIds: asArray(block.linkedCharacterIds),
    linkedLocationIds: asArray(block.linkedLocationIds),
    linkedEventIds: asArray(block.linkedEventIds)
  };
}

function normalizeChapter(chapter = {}) {
  return {
    ...createEmptyChapter(),
    ...chapter,
    title: asString(chapter.title, "Novo capitulo"),
    stage: CHAPTER_STAGE_OPTIONS.some((item) => item.value === chapter.stage) ? chapter.stage : "development",
    parentId: asString(chapter.parentId),
    summary: asString(chapter.summary),
    content: asString(chapter.content),
    notes: asString(chapter.notes),
    linkedEventIds: asArray(chapter.linkedEventIds),
    linkedCharacterIds: asArray(chapter.linkedCharacterIds)
  };
}

function normalizeLocation(location = {}) {
  return {
    ...createEmptyLocation(),
    ...location,
    name: asString(location.name, "Novo local"),
    type: LOCATION_TYPE_OPTIONS.some((item) => item.value === location.type) ? location.type : "city",
    tags: sanitizeTagList(location.tags),
    characterIds: asArray(location.characterIds),
    manuscriptIds: asArray(location.manuscriptIds)
  };
}

function normalizeCharacter(character = {}) {
  return {
    ...createEmptyCharacter(),
    ...character,
    name: asString(character.name, "Novo personagem"),
    category: CHARACTER_CATEGORY_OPTIONS.some((item) => item.value === character.category) ? character.category : "other",
    relatedChapterIds: asArray(character.relatedChapterIds),
    linkedLocationIds: asArray(character.linkedLocationIds),
    tags: sanitizeTagList(character.tags)
  };
}

function normalizeRelation(relation = {}) {
  return {
    ...createEmptyRelation(),
    ...relation,
    fromCharacterId: asString(relation.fromCharacterId),
    toCharacterId: asString(relation.toCharacterId),
    label: asString(relation.label),
    weight: asString(relation.weight, "neutral")
  };
}

function normalizeTimelineEvent(event = {}) {
  return {
    ...createEmptyTimelineEvent(),
    ...event,
    title: asString(event.title, "Novo evento"),
    precision: TIMELINE_PRECISION_OPTIONS.some((item) => item.value === event.precision) ? event.precision : "day",
    characterIds: asArray(event.characterIds),
    locationId: asString(event.locationId),
    chapterIds: asArray(event.chapterIds),
    tags: sanitizeTagList(event.tags)
  };
}

function normalizeMapNode(node = {}) {
  return {
    ...createEmptyMapNode(),
    ...node,
    name: asString(node.name, "Novo ponto"),
    type: MAP_NODE_TYPE_OPTIONS.some((item) => item.value === node.type) ? node.type : "free",
    x: Number.isFinite(Number(node.x)) ? Number(node.x) : 140,
    y: Number.isFinite(Number(node.y)) ? Number(node.y) : 120,
    locationId: asString(node.locationId)
  };
}

function normalizeMapConnection(connection = {}) {
  return {
    ...createEmptyMapConnection(),
    ...connection,
    fromNodeId: asString(connection.fromNodeId),
    toNodeId: asString(connection.toNodeId),
    label: asString(connection.label)
  };
}

export function normalizeManuscriptStructure(rawValue, templateId = "blank") {
  const fallback = createDefaultManuscriptStructure(templateId);
  const raw = rawValue && typeof rawValue === "object" ? rawValue : {};
  const rawModules = raw.modules && typeof raw.modules === "object" ? raw.modules : {};

  const normalized = {
    version: Number.isFinite(Number(raw.version)) ? Number(raw.version) : 1,
    templateId: asString(raw.templateId, templateId),
    modules: {
      plot: {
        blocks: asArray(rawModules.plot?.blocks, fallback.modules.plot.blocks).map(normalizeBlock),
        chapters: asArray(rawModules.plot?.chapters, fallback.modules.plot.chapters).map(normalizeChapter)
      },
      world: {
        blocks: asArray(rawModules.world?.blocks, fallback.modules.world.blocks).map(normalizeBlock),
        map: {
          zoom: Number.isFinite(Number(rawModules.world?.map?.zoom)) ? Number(rawModules.world.map.zoom) : 1,
          nodes: asArray(rawModules.world?.map?.nodes, fallback.modules.world.map.nodes).map(normalizeMapNode),
          connections: asArray(rawModules.world?.map?.connections, fallback.modules.world.map.connections).map(normalizeMapConnection)
        }
      },
      base: {
        locations: asArray(rawModules.base?.locations, fallback.modules.base.locations).map(normalizeLocation)
      },
      characters: {
        items: asArray(rawModules.characters?.items, fallback.modules.characters.items).map(normalizeCharacter),
        relations: asArray(rawModules.characters?.relations, fallback.modules.characters.relations).map(normalizeRelation)
      },
      theme: {
        blocks: asArray(rawModules.theme?.blocks, fallback.modules.theme.blocks).map(normalizeBlock)
      },
      general: {
        synopsis: asString(rawModules.general?.synopsis),
        audience: asString(rawModules.general?.audience),
        notes: asString(rawModules.general?.notes),
        tags: sanitizeTagList(rawModules.general?.tags),
        references: asArray(rawModules.general?.references, fallback.modules.general.references).map(normalizeBlock)
      }
    },
    timeline: asArray(raw.timeline, fallback.timeline).map(normalizeTimelineEvent)
  };

  MODULE_ORDER.forEach((moduleId) => {
    if (!normalized.modules[moduleId]) {
      normalized.modules[moduleId] = fallback.modules[moduleId];
    }
  });

  return normalized;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBlockToHtml(block) {
  if (block.type === "list") {
    return `<section><h3>${escapeHtml(block.title || "Lista")}</h3><ul>${block.items
      .filter(Boolean)
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")}</ul></section>`;
  }

  if (block.type === "event") {
    const dateLabel = block.eventDate ? `<p><strong>Data:</strong> ${escapeHtml(block.eventDate)}</p>` : "";
    return `<section><h3>${escapeHtml(block.title || "Evento")}</h3>${dateLabel}<p>${escapeHtml(block.text)}</p></section>`;
  }

  if (block.type === "reference") {
    const target = block.referenceTarget ? `<p><strong>Vinculo:</strong> ${escapeHtml(block.referenceTarget)}</p>` : "";
    return `<section><h3>${escapeHtml(block.title || "Referencia")}</h3><p>${escapeHtml(block.referenceLabel || block.text)}</p>${target}</section>`;
  }

  if (block.type === "chapter") {
    return `<section><h3>${escapeHtml(block.title || "Capitulo")}</h3><p>${escapeHtml(block.text)}</p></section>`;
  }

  return `<section><h3>${escapeHtml(block.title || "Texto")}</h3><p>${escapeHtml(block.text)}</p></section>`;
}

export function buildStructurePreviewHtml(structure, currentContent = "") {
  const normalized = normalizeManuscriptStructure(structure);
  const chapterHtml = normalized.modules.plot.chapters
    .map((chapter) => {
      const stage = CHAPTER_STAGE_OPTIONS.find((item) => item.value === chapter.stage)?.label || chapter.stage;
      return `<section><h2>${escapeHtml(chapter.title)}</h2><p><strong>Etapa:</strong> ${escapeHtml(stage)}</p>${
        chapter.summary ? `<p>${escapeHtml(chapter.summary)}</p>` : ""
      }${chapter.content ? `<div>${escapeHtml(chapter.content).replace(/\n/g, "<br />")}</div>` : ""}</section>`;
    })
    .join("");

  const blockHtml = normalized.modules.plot.blocks.map(renderBlockToHtml).join("");
  if (!chapterHtml && !blockHtml) return currentContent || "";

  const generated = `<hr /><h1>Estrutura avancada do manuscrito</h1>${chapterHtml}${blockHtml}`;
  if (!currentContent) return generated;

  const sanitizedCurrent = String(currentContent).replace(/<hr \/><h1>Estrutura avancada do manuscrito<\/h1>[\s\S]*$/i, "");
  return `${sanitizedCurrent}${generated}`;
}

export function moveItem(items, fromIndex, toIndex) {
  const next = [...items];
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= next.length || toIndex >= next.length) return next;
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function sortTimelineEvents(events = []) {
  return [...events].sort((left, right) => {
    const leftValue = `${left.precision}:${left.eraLabel || left.date || ""}`;
    const rightValue = `${right.precision}:${right.eraLabel || right.date || ""}`;
    return leftValue.localeCompare(rightValue, "pt-BR");
  });
}

export function getMapNodeMeta(type) {
  return MAP_NODE_TYPE_OPTIONS.find((item) => item.value === type) || MAP_NODE_TYPE_OPTIONS[0];
}

