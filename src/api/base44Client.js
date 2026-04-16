import { applyWordsToStreak, getBrazilDateKey, normalizeStreakUser, reconcileStreakState } from "@/lib/streak";

const STORAGE_KEYS = {
  users: "storyforge_users",
  session: "storyforge_session",
  Project: "storyforge_projects",
  Folder: "storyforge_folders",
  Manuscript: "storyforge_manuscripts"
};

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDefaultSocialLinks() {
  return {
    instagram: "",
    twitter: "",
    tiktok: "",
    youtube: "",
    website: "",
    wattpad: ""
  };
}

function normalizeSocialLinks(links = {}) {
  return {
    ...createDefaultSocialLinks(),
    ...links
  };
}

function normalizeUserProfile(user = {}) {
  return {
    profile_banner: "",
    social_links: createDefaultSocialLinks(),
    public_profile: true,
    follower_ids: [],
    following_ids: [],
    ...user,
    social_links: normalizeSocialLinks(user.social_links)
  };
}

function normalizePublicProject(project = {}) {
  return {
    public_genre: "Geral",
    public_tags: [],
    public_origin: "original",
    public_status: "Em andamento",
    public_likes: 0,
    public_comments: 0,
    public_views: 0,
    ...project,
    public_tags: Array.isArray(project.public_tags) ? project.public_tags : []
  };
}

function createAppError(message, extra = {}) {
  const error = new Error(message);
  Object.assign(error, extra);
  return error;
}

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeedData() {
  const users = readStorage(STORAGE_KEYS.users, null);
  if (users?.length) {
    ensureDiscoverySeedData();
    return;
  }

  const createdDate = nowIso();
  const demoUser = {
    id: "user_demo",
    email: "demo@storyforge.app",
    password: "storyforge",
    full_name: "Demo StoryForge",
    display_name: "Demo StoryForge",
    username: "demo",
    bio: "Escritora de fantasia brasileira, obcecada por mapas, personagens intensos e jornadas de redenção.",
    profile_image: "",
    profile_banner: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1600&q=80",
    social_links: {
      instagram: "https://instagram.com/storyforge.app",
      twitter: "",
      tiktok: "",
      youtube: "https://youtube.com/@storyforge",
      website: "https://story-forge-gazu.vercel.app",
      wattpad: "https://www.wattpad.com/"
    },
    public_profile: true,
    follower_ids: [],
    following_ids: [],
    color_preset: "indigo",
    custom_primary: "",
    font_family: "'Crimson Pro', serif",
    font_size: 18,
    plan: "free",
    project_view_mode: "grid",
    theme_mode: "system",
    dark_mode: false,
    reduced_motion: false,
    streakCount: 0,
    lastStreakDate: "",
    wordsWrittenToday: 0,
    wordsTrackingDate: getBrazilDateKey(),
    reminderSentDate: "",
    created_date: createdDate,
    updated_date: createdDate
  };

  const collaboratorUser = {
    id: "user_writer",
    email: "writer@storyforge.app",
    password: "storyforge",
    full_name: "Colaborador StoryForge",
    display_name: "Colaborador",
    username: "writer",
    bio: "Perfil secundário para testes de colaboração local e descoberta de autores.",
    profile_image: "",
    profile_banner: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=80",
    social_links: {
      instagram: "",
      twitter: "https://x.com/",
      tiktok: "",
      youtube: "",
      website: "",
      wattpad: "https://www.wattpad.com/"
    },
    public_profile: true,
    follower_ids: [demoUser.id],
    following_ids: [],
    color_preset: "sky",
    custom_primary: "",
    font_family: "'Inter', sans-serif",
    font_size: 18,
    plan: "free",
    project_view_mode: "grid",
    theme_mode: "system",
    dark_mode: false,
    reduced_motion: false,
    streakCount: 0,
    lastStreakDate: "",
    wordsWrittenToday: 0,
    wordsTrackingDate: getBrazilDateKey(),
    reminderSentDate: "",
    created_date: createdDate,
    updated_date: createdDate
  };

  const publicAuthor = {
    id: "user_author_public",
    email: "autor@storyforge.app",
    password: "storyforge",
    full_name: "Lia Monteiro",
    display_name: "Lia Monteiro",
    username: "liamonteiro",
    bio: "Autora de fantasia urbana e romances especulativos com foco em protagonistas brasileiras.",
    profile_image: "",
    profile_banner: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1600&q=80",
    social_links: {
      instagram: "https://instagram.com/",
      twitter: "https://x.com/",
      tiktok: "",
      youtube: "",
      website: "",
      wattpad: "https://www.wattpad.com/"
    },
    public_profile: true,
    follower_ids: [],
    following_ids: [],
    color_preset: "rose",
    custom_primary: "",
    font_family: "'Literata', serif",
    font_size: 18,
    plan: "premium",
    project_view_mode: "grid",
    theme_mode: "system",
    dark_mode: false,
    reduced_motion: false,
    streakCount: 0,
    lastStreakDate: "",
    wordsWrittenToday: 0,
    wordsTrackingDate: getBrazilDateKey(),
    reminderSentDate: "",
    created_date: createdDate,
    updated_date: createdDate
  };

  const demoFolder = {
    id: "folder_demo",
    name: "Universo principal",
    created_by: demoUser.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  const demoProject = {
    id: "project_demo",
    name: "As crônicas do Vale",
    description: "Projeto de exemplo para mostrar a estrutura do StoryForge sem depender de serviços externos.",
    folder_id: demoFolder.id,
    cover_image: "",
    is_public: true,
    public_summary: "Uma fantasia brasileira sobre ruínas antigas, memórias perigosas e personagens tentando sobreviver ao próprio passado.",
    public_status: "Em andamento",
    public_genre: "Fantasia",
    public_tags: ["magia", "ruínas", "jornada"],
    public_origin: "original",
    public_likes: 324,
    public_comments: 41,
    public_views: 4820,
    is_favorite: true,
    collaborators: [],
    created_by: demoUser.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  const demoManuscript = {
    id: "manuscript_demo",
    name: "Capítulo 1",
    project_id: demoProject.id,
    image: "",
    type: "Capítulo",
    content: "<h1>Capítulo 1</h1><p>Era uma vez uma escritora tentando transformar seu app em uma casa para autores brasileiros.</p>",
    layout: {
      margin: "normal",
      orientation: "portrait",
      pageSize: "A4",
      columns: 1
    },
    is_favorite: true,
    created_by: demoUser.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  const collaboratorProject = {
    id: "project_writer_public",
    name: "Entre Sinais e Silêncios",
    description: "Drama contemporâneo com romance slow burn em uma cidade universitária.",
    folder_id: "",
    cover_image: "",
    is_public: true,
    public_summary: "Uma história sobre amizades tensionadas, luto e afeto surgindo no tempo errado.",
    public_status: "Completa",
    public_genre: "Drama",
    public_tags: ["slow burn", "universidade", "luto"],
    public_origin: "original",
    public_likes: 207,
    public_comments: 29,
    public_views: 2910,
    is_favorite: false,
    collaborators: [],
    created_by: collaboratorUser.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  const publicAuthorProject = {
    id: "project_author_public",
    name: "Neon sob a Chuva",
    description: "Fantasia urbana com investigação sobrenatural em Belo Horizonte.",
    folder_id: "",
    cover_image: "",
    is_public: true,
    public_summary: "Quando símbolos impossíveis começam a surgir pela cidade, uma ilustradora precisa desvendar quem está abrindo portais no centro histórico.",
    public_status: "Em andamento",
    public_genre: "Fantasia urbana",
    public_tags: ["sobrenatural", "cidade", "investigação"],
    public_origin: "original",
    public_likes: 418,
    public_comments: 67,
    public_views: 6120,
    is_favorite: false,
    collaborators: [],
    created_by: publicAuthor.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  const collaboratorManuscript = {
    id: "manuscript_writer_public",
    name: "Capítulo 1",
    project_id: collaboratorProject.id,
    image: "",
    type: "Capítulo",
    content: "<h1>Capítulo 1</h1><p>Marina voltou para a cidade apenas para passar três dias. Bastaram quinze minutos para entender que nada ali tinha ficado realmente para trás.</p>",
    layout: { margin: "normal", orientation: "portrait", pageSize: "A4", columns: 1 },
    is_favorite: false,
    created_by: collaboratorUser.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  const publicAuthorManuscript = {
    id: "manuscript_author_public",
    name: "Capítulo 1",
    project_id: publicAuthorProject.id,
    image: "",
    type: "Capítulo",
    content: "<h1>Capítulo 1</h1><p>Na noite em que a cidade ganhou um segundo céu, Elisa jurou que nunca mais pisaria no viaduto da Lagoinha. Três dias depois, ela estava de volta.</p>",
    layout: { margin: "normal", orientation: "portrait", pageSize: "A4", columns: 1 },
    is_favorite: false,
    created_by: publicAuthor.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  writeStorage(STORAGE_KEYS.users, [demoUser, collaboratorUser, publicAuthor]);
  writeStorage(STORAGE_KEYS.Folder, [demoFolder]);
  writeStorage(STORAGE_KEYS.Project, [demoProject, collaboratorProject, publicAuthorProject]);
  writeStorage(STORAGE_KEYS.Manuscript, [demoManuscript, collaboratorManuscript, publicAuthorManuscript]);
}

function ensureDiscoverySeedData() {
  const users = readStorage(STORAGE_KEYS.users, []);
  const projects = readStorage(STORAGE_KEYS.Project, []);
  const manuscripts = readStorage(STORAGE_KEYS.Manuscript, []);
  let changed = false;

  const requiredUser = users.find((entry) => entry.id === "user_author_public");
  if (!requiredUser) {
    users.push(
      normalizeUserProfile({
        id: "user_author_public",
        email: "autor@storyforge.app",
        password: "storyforge",
        full_name: "Lia Monteiro",
        display_name: "Lia Monteiro",
        username: "liamonteiro",
        bio: "Autora de fantasia urbana e romances especulativos com foco em protagonistas brasileiras.",
        profile_image: "",
        profile_banner: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1600&q=80",
        social_links: {
          instagram: "https://instagram.com/",
          twitter: "https://x.com/",
          tiktok: "",
          youtube: "",
          website: "",
          wattpad: "https://www.wattpad.com/"
        },
        public_profile: true,
        follower_ids: [],
        following_ids: [],
        plan: "premium",
        created_date: nowIso(),
        updated_date: nowIso()
      })
    );
    changed = true;
  }

  const projectSeeds = [
    {
      id: "project_writer_public",
      name: "Entre Sinais e Silêncios",
      description: "Drama contemporâneo com romance slow burn em uma cidade universitária.",
      public_summary: "Uma história sobre amizades tensionadas, luto e afeto surgindo no tempo errado.",
      public_status: "Completa",
      public_genre: "Drama",
      public_tags: ["slow burn", "universidade", "luto"],
      public_origin: "original",
      public_likes: 207,
      public_comments: 29,
      public_views: 2910,
      created_by: "writer@storyforge.app"
    },
    {
      id: "project_author_public",
      name: "Neon sob a Chuva",
      description: "Fantasia urbana com investigação sobrenatural em Belo Horizonte.",
      public_summary: "Quando símbolos impossíveis começam a surgir pela cidade, uma ilustradora precisa desvendar quem está abrindo portais no centro histórico.",
      public_status: "Em andamento",
      public_genre: "Fantasia urbana",
      public_tags: ["sobrenatural", "cidade", "investigação"],
      public_origin: "original",
      public_likes: 418,
      public_comments: 67,
      public_views: 6120,
      created_by: "autor@storyforge.app"
    }
  ];

  for (const seed of projectSeeds) {
    const existing = projects.find((entry) => entry.id === seed.id);
    if (!existing) {
      projects.push(
        normalizePublicProject({
          id: seed.id,
          name: seed.name,
          description: seed.description,
          folder_id: "",
          cover_image: "",
          is_public: true,
          is_favorite: false,
          collaborators: [],
          created_by: seed.created_by,
          created_date: nowIso(),
          updated_date: nowIso(),
          ...seed
        })
      );
      changed = true;
      continue;
    }
    const normalized = normalizePublicProject(existing);
    if (JSON.stringify(existing) !== JSON.stringify(normalized)) {
      Object.assign(existing, normalized);
      changed = true;
    }
  }

  if (!manuscripts.find((entry) => entry.id === "manuscript_writer_public")) {
    manuscripts.push({
      id: "manuscript_writer_public",
      name: "Capítulo 1",
      project_id: "project_writer_public",
      image: "",
      type: "Capítulo",
      content: "<h1>Capítulo 1</h1><p>Marina voltou para a cidade apenas para passar três dias. Bastaram quinze minutos para entender que nada ali tinha ficado realmente para trás.</p>",
      layout: { margin: "normal", orientation: "portrait", pageSize: "A4", columns: 1 },
      is_favorite: false,
      created_by: "writer@storyforge.app",
      created_date: nowIso(),
      updated_date: nowIso()
    });
    changed = true;
  }

  if (!manuscripts.find((entry) => entry.id === "manuscript_author_public")) {
    manuscripts.push({
      id: "manuscript_author_public",
      name: "Capítulo 1",
      project_id: "project_author_public",
      image: "",
      type: "Capítulo",
      content: "<h1>Capítulo 1</h1><p>Na noite em que a cidade ganhou um segundo céu, Elisa jurou que nunca mais pisaria no viaduto da Lagoinha. Três dias depois, ela estava de volta.</p>",
      layout: { margin: "normal", orientation: "portrait", pageSize: "A4", columns: 1 },
      is_favorite: false,
      created_by: "autor@storyforge.app",
      created_date: nowIso(),
      updated_date: nowIso()
    });
    changed = true;
  }

  if (changed) {
    saveUsers(users);
    saveCollection("Project", projects);
    saveCollection("Manuscript", manuscripts);
  }
}

function getUsers() {
  ensureSeedData();
  return readStorage(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  writeStorage(STORAGE_KEYS.users, users);
}

function getSession() {
  ensureSeedData();
  return readStorage(STORAGE_KEYS.session, null);
}

function setSession(userId) {
  writeStorage(STORAGE_KEYS.session, userId);
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.session);
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return clone({ ...normalizeUserProfile(safeUser), ...normalizeStreakUser(safeUser) });
}

function hydrateUserRecord(user) {
  return {
    ...normalizeUserProfile(user),
    ...normalizeStreakUser(user),
    ...user,
    social_links: normalizeSocialLinks(user.social_links)
  };
}

function updateStoredUser(userId, updater) {
  const users = getUsers();
  const index = users.findIndex((entry) => entry.id === userId);
  if (index === -1) {
    throw createAppError("User not found", { status: 404 });
  }
  const current = hydrateUserRecord(users[index]);
  const patch = updater(current) || {};
  users[index] = {
    ...current,
    ...patch,
    social_links: normalizeSocialLinks((patch.social_links || current.social_links) ?? {}),
    updated_date: nowIso()
  };
  saveUsers(users);
  return users[index];
}

function syncCurrentUserRecord() {
  const user = requireCurrentUser();
  return updateStoredUser(user.id, (current) => reconcileStreakState(current));
}

function getCurrentUserRecord() {
  const sessionUserId = getSession();
  if (!sessionUserId) return null;
  return getUsers().find((user) => user.id === sessionUserId) || null;
}

function requireCurrentUser() {
  const user = getCurrentUserRecord();
  if (!user) {
    throw createAppError("Authentication required", { status: 401, type: "auth_required" });
  }
  return user;
}

function getCollection(entityName) {
  ensureSeedData();
  return readStorage(STORAGE_KEYS[entityName], []);
}

function saveCollection(entityName, records) {
  writeStorage(STORAGE_KEYS[entityName], records);
}

function sortRecords(records, order) {
  if (!order) return records;
  const descending = order.startsWith("-");
  const field = descending ? order.slice(1) : order;
  return [...records].sort((left, right) => {
    const a = left[field] ?? "";
    const b = right[field] ?? "";
    if (field.includes("date")) {
      return descending ? new Date(b) - new Date(a) : new Date(a) - new Date(b);
    }
    return descending ? String(b).localeCompare(String(a)) : String(a).localeCompare(String(b));
  });
}

function filterRecords(records, criteria) {
  if (!criteria || !Object.keys(criteria).length) return records;
  return records.filter((record) =>
    Object.entries(criteria).every(([key, value]) => {
      if (value === "") return !record[key];
      return record[key] === value;
    })
  );
}

function withUserScope(records, email) {
  return records.filter((record) => record.created_by === email);
}

function createEntityApi(entityName) {
  const prefix = entityName.toLowerCase();

  return {
    async list(order = "-updated_date", limit = 100) {
      const user = requireCurrentUser();
      const records = withUserScope(getCollection(entityName), user.email).map((record) => (entityName === "Project" ? normalizePublicProject(record) : record));
      return clone(sortRecords(records, order).slice(0, limit));
    },
    async filter(criteria = {}, order = "-updated_date", limit = 100) {
      const user = requireCurrentUser();
      const records = withUserScope(getCollection(entityName), user.email).map((record) => (entityName === "Project" ? normalizePublicProject(record) : record));
      return clone(sortRecords(filterRecords(records, criteria), order).slice(0, limit));
    },
    async create(data) {
      const user = requireCurrentUser();
      const records = getCollection(entityName);
      const timestamp = nowIso();
      const nextRecord = {
        id: createId(prefix),
        ...data,
        collaborators: entityName === "Project" ? data.collaborators || [] : data.collaborators,
        is_public: entityName === "Project" ? Boolean(data.is_public) : data.is_public,
        public_summary: entityName === "Project" ? data.public_summary || data.description || "" : data.public_summary,
        public_status: entityName === "Project" ? data.public_status || "Em andamento" : data.public_status,
        created_by: user.email,
        created_date: timestamp,
        updated_date: timestamp
      };
      records.push(entityName === "Project" ? normalizePublicProject(nextRecord) : nextRecord);
      saveCollection(entityName, records);
      return clone(entityName === "Project" ? normalizePublicProject(nextRecord) : nextRecord);
    },
    async update(id, patch) {
      const user = requireCurrentUser();
      const records = getCollection(entityName);
      const index = records.findIndex((record) => record.id === id && record.created_by === user.email);
      if (index === -1) {
        throw createAppError(`${entityName} not found`, { status: 404 });
      }
      records[index] = {
        ...records[index],
        ...patch,
        updated_date: nowIso()
      };
      if (entityName === "Project") {
        records[index] = normalizePublicProject(records[index]);
      }
      saveCollection(entityName, records);
      return clone(records[index]);
    },
    async delete(id) {
      const user = requireCurrentUser();
      const records = getCollection(entityName);
      const filtered = records.filter((record) => !(record.id === id && record.created_by === user.email));
      if (filtered.length === records.length) {
        throw createAppError(`${entityName} not found`, { status: 404 });
      }
      saveCollection(entityName, filtered);
      return true;
    }
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(createAppError("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

ensureSeedData();

export const base44 = {
  auth: {
    async me() {
      return sanitizeUser(syncCurrentUserRecord());
    },
    async login({ email, password }) {
      const normalizedEmail = email.trim().toLowerCase();
      const user = getUsers().find((entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === password);
      if (!user) {
        throw createAppError("Email ou senha inválidos.", { status: 401, type: "auth_required" });
      }
      setSession(user.id);
      return sanitizeUser(syncCurrentUserRecord());
    },
    async register({ email, password, display_name }) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        throw createAppError("Email e senha são obrigatórios.", { status: 400 });
      }
      const users = getUsers();
      if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        throw createAppError("Já existe uma conta com esse email.", { status: 409 });
      }
      const timestamp = nowIso();
      const nextUser = {
        id: createId("user"),
        email: normalizedEmail,
        password,
        full_name: display_name?.trim() || normalizedEmail.split("@")[0],
        display_name: display_name?.trim() || normalizedEmail.split("@")[0],
        username: normalizedEmail.split("@")[0],
        bio: "",
        profile_image: "",
        profile_banner: "",
        social_links: createDefaultSocialLinks(),
        public_profile: true,
        follower_ids: [],
        following_ids: [],
        color_preset: "indigo",
        custom_primary: "",
        font_family: "'Crimson Pro', serif",
        font_size: 18,
        plan: "free",
        project_view_mode: "grid",
        theme_mode: "system",
        dark_mode: false,
        reduced_motion: false,
        streakCount: 0,
        lastStreakDate: "",
        wordsWrittenToday: 0,
        wordsTrackingDate: getBrazilDateKey(),
        reminderSentDate: "",
        created_date: timestamp,
        updated_date: timestamp
      };
      users.push(nextUser);
      saveUsers(users);
      setSession(nextUser.id);
      return sanitizeUser(syncCurrentUserRecord());
    },
    async updateMe(patch) {
      const user = requireCurrentUser();
      return sanitizeUser(updateStoredUser(user.id, () => patch));
    },
    async logout() {
      clearSession();
      return true;
    },
    async listUsers() {
      requireCurrentUser();
      return getUsers().map((entry) => sanitizeUser(entry));
    },
    async findByEmail(email) {
      requireCurrentUser();
      return sanitizeUser(getUsers().find((entry) => entry.email.toLowerCase() === String(email || "").trim().toLowerCase()) || null);
    },
    async syncStreak() {
      return sanitizeUser(syncCurrentUserRecord());
    },
    async recordWords(wordDelta) {
      const user = requireCurrentUser();
      return sanitizeUser(
        updateStoredUser(user.id, (current) => {
          const reconciled = { ...current, ...reconcileStreakState(current) };
          return applyWordsToStreak(reconciled, Math.max(0, Number(wordDelta) || 0));
        })
      );
    },
    async markReminderSent(dateKey = getBrazilDateKey()) {
      const user = requireCurrentUser();
      return sanitizeUser(updateStoredUser(user.id, () => ({ reminderSentDate: dateKey })));
    },
    redirectToLogin() {
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", "/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    },
    async deleteMe() {
      const user = requireCurrentUser();
      saveUsers(getUsers().filter((entry) => entry.id !== user.id));
      saveCollection("Folder", withUserScope(getCollection("Folder"), user.email).length ? getCollection("Folder").filter((entry) => entry.created_by !== user.email) : getCollection("Folder"));
      saveCollection("Project", withUserScope(getCollection("Project"), user.email).length ? getCollection("Project").filter((entry) => entry.created_by !== user.email) : getCollection("Project"));
      saveCollection("Manuscript", withUserScope(getCollection("Manuscript"), user.email).length ? getCollection("Manuscript").filter((entry) => entry.created_by !== user.email) : getCollection("Manuscript"));
      clearSession();
      return true;
    }
  },
  entities: {
    Folder: createEntityApi("Folder"),
    Project: createEntityApi("Project"),
    Manuscript: createEntityApi("Manuscript")
  },
  social: {
    async listFeed() {
      const currentUser = getCurrentUserRecord();
      const publicUsers = getUsers()
        .map((entry) => sanitizeUser(entry))
        .filter((entry) => entry.public_profile);
      const publicProjects = getCollection("Project")
        .map((project) => normalizePublicProject(project))
        .filter((project) => project.is_public)
        .sort((left, right) => new Date(right.updated_date) - new Date(left.updated_date));

      const featuredAuthors = publicUsers
        .map((author) => ({
          ...author,
          followers_count: (author.follower_ids || []).length,
          following_count: (author.following_ids || []).length,
          projects_count: publicProjects.filter((project) => project.created_by === author.email).length,
          is_following: currentUser ? (currentUser.following_ids || []).includes(author.id) : false
        }))
        .sort((left, right) => right.followers_count - left.followers_count || left.display_name.localeCompare(right.display_name, "pt-BR"))
        .slice(0, 6);

      const featuredWorks = publicProjects.slice(0, 8).map((project) => {
        const author = publicUsers.find((user) => user.email === project.created_by);
        return {
          ...clone(project),
          author_name: author?.display_name || author?.full_name || "Autor",
          author_username: author?.username || "",
          author_avatar: author?.profile_image || "",
          manuscript_count: getCollection("Manuscript").filter((item) => item.project_id === project.id).length
        };
      });

      const feedItems = featuredWorks.slice(0, 5).map((work) => ({
        id: `feed_${work.id}`,
        type: "work_spotlight",
        created_date: work.updated_date,
        title: `Vitrine de ${work.author_name}`,
        body: work.public_summary || work.description || "Uma obra em destaque para a comunidade.",
        work
      }));

      return {
        featuredAuthors,
        featuredWorks,
        feedItems
      };
    },
    async listDiscoverWorks() {
      const publicUsers = getUsers().map((entry) => sanitizeUser(entry));
      const publicProjects = getCollection("Project")
        .map((project) => normalizePublicProject(project))
        .filter((project) => project.is_public)
        .sort((left, right) => new Date(right.updated_date) - new Date(left.updated_date));

      return publicProjects.map((project) => {
        const author = publicUsers.find((user) => user.email === project.created_by);
        return {
          ...clone(project),
          author_name: author?.display_name || author?.full_name || "Autor",
          author_username: author?.username || "",
          author_avatar: author?.profile_image || "",
          author_bio: author?.bio || "",
          manuscript_count: getCollection("Manuscript").filter((item) => item.project_id === project.id).length
        };
      });
    },
    async getPublicAuthorByUsername(username) {
      const publicUsers = getUsers().map((entry) => sanitizeUser(entry));
      const author = publicUsers.find((entry) => entry.public_profile && entry.username === username);
      if (!author) {
        throw createAppError("Autor não encontrado", { status: 404 });
      }

      const publicProjects = getCollection("Project")
        .map((project) => normalizePublicProject(project))
        .filter((project) => project.created_by === author.email && project.is_public)
        .sort((left, right) => new Date(right.updated_date) - new Date(left.updated_date))
        .map((project) => ({
          ...clone(project),
          manuscript_count: getCollection("Manuscript").filter((item) => item.project_id === project.id).length
        }));

      const currentUser = getCurrentUserRecord();
      return {
        author: {
          ...author,
          followers_count: (author.follower_ids || []).length,
          following_count: (author.following_ids || []).length,
          is_following: currentUser ? (currentUser.following_ids || []).includes(author.id) : false
        },
        works: publicProjects
      };
    },
    async toggleFollow(authorId) {
      const currentUser = requireCurrentUser();
      if (currentUser.id === authorId) {
        throw createAppError("Você não pode seguir o próprio perfil.", { status: 400 });
      }

      const currentRecord = updateStoredUser(currentUser.id, (record) => {
        const following = new Set(record.following_ids || []);
        if (following.has(authorId)) following.delete(authorId);
        else following.add(authorId);
        return { following_ids: [...following] };
      });

      const isFollowing = (currentRecord.following_ids || []).includes(authorId);
      updateStoredUser(authorId, (record) => {
        const followers = new Set(record.follower_ids || []);
        if (isFollowing) followers.add(currentUser.id);
        else followers.delete(currentUser.id);
        return { follower_ids: [...followers] };
      });

      return sanitizeUser(currentRecord);
    }
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const file_url = await fileToDataUrl(file);
        return { file_url };
      }
    }
  }
};
