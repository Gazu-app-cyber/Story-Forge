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
  if (users?.length) return;

  const createdDate = nowIso();
  const demoUser = {
    id: "user_demo",
    email: "demo@storyforge.app",
    password: "storyforge",
    full_name: "Demo StoryForge",
    display_name: "Demo StoryForge",
    username: "demo",
    bio: "Conta de exemplo local do StoryForge.",
    profile_image: "",
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
    bio: "Conta secundaria para testes de colaboracao local.",
    profile_image: "",
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

  const demoFolder = {
    id: "folder_demo",
    name: "Universo principal",
    created_by: demoUser.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  const demoProject = {
    id: "project_demo",
    name: "As cronicas do Vale",
    description: "Projeto de exemplo para mostrar a estrutura do StoryForge sem depender de servicos externos.",
    folder_id: demoFolder.id,
    cover_image: "",
    is_favorite: true,
    collaborators: [],
    created_by: demoUser.email,
    created_date: createdDate,
    updated_date: createdDate
  };

  const demoManuscript = {
    id: "manuscript_demo",
    name: "Capitulo 1",
    project_id: demoProject.id,
    image: "",
    type: "Capítulo",
    content: "<h1>Capitulo 1</h1><p>Era uma vez um escritor tentando libertar seu app de um backend externo.</p>",
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

  writeStorage(STORAGE_KEYS.users, [demoUser, collaboratorUser]);
  writeStorage(STORAGE_KEYS.Folder, [demoFolder]);
  writeStorage(STORAGE_KEYS.Project, [demoProject]);
  writeStorage(STORAGE_KEYS.Manuscript, [demoManuscript]);
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
  return clone({ ...safeUser, ...normalizeStreakUser(safeUser) });
}

function hydrateUserRecord(user) {
  return { ...normalizeStreakUser(user), ...user };
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
      const records = withUserScope(getCollection(entityName), user.email);
      return clone(sortRecords(records, order).slice(0, limit));
    },
    async filter(criteria = {}, order = "-updated_date", limit = 100) {
      const user = requireCurrentUser();
      const records = withUserScope(getCollection(entityName), user.email);
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
        created_by: user.email,
        created_date: timestamp,
        updated_date: timestamp
      };
      records.push(nextRecord);
      saveCollection(entityName, records);
      return clone(nextRecord);
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
    reader.onerror = () => reject(createAppError("Nao foi possivel ler o arquivo."));
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
        throw createAppError("Email ou senha invalidos.", { status: 401, type: "auth_required" });
      }
      setSession(user.id);
      return sanitizeUser(syncCurrentUserRecord());
    },
    async register({ email, password, display_name }) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        throw createAppError("Email e senha sao obrigatorios.", { status: 400 });
      }
      const users = getUsers();
      if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        throw createAppError("Ja existe uma conta com esse email.", { status: 409 });
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
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const file_url = await fileToDataUrl(file);
        return { file_url };
      }
    }
  }
};
