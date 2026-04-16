const STORAGE_KEYS = {
  posts: "storyforge_posts",
  polls: "storyforge_polls"
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

function readStorage(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("storyforge:data-changed", { detail: { key } }));
}

export function normalizePost(post = {}) {
  return {
    id: post.id || createId("post"),
    content: "",
    visibility: "public",
    created_by: "",
    created_date: nowIso(),
    updated_date: nowIso(),
    ...post
  };
}

export function normalizePoll(poll = {}) {
  return {
    id: poll.id || createId("poll"),
    question: "",
    options: [],
    voter_ids: [],
    visibility: "public",
    created_by: "",
    created_date: nowIso(),
    updated_date: nowIso(),
    ...poll,
    options: Array.isArray(poll.options)
      ? poll.options
          .map((option, index) => ({
            id: option.id || `${poll.id || "poll"}_option_${index + 1}`,
            label: option.label || "",
            votes: Number(option.votes) || 0
          }))
          .filter((option) => option.label)
      : []
  };
}

function createSeedPosts() {
  const createdDate = nowIso();
  return [
    normalizePost({
      id: "post_demo_1",
      content: "Hoje organizei a vitrine da minha obra e publiquei um novo capítulo. Pequenos avanços também contam.",
      created_by: "demo@storyforge.app",
      created_date: createdDate,
      updated_date: createdDate
    }),
    normalizePost({
      id: "post_author_1",
      content: "Pergunta honesta para outros autores: vocês também reescrevem a primeira cena vinte vezes até ela finalmente respirar?",
      created_by: "autor@storyforge.app",
      created_date: createdDate,
      updated_date: createdDate
    })
  ];
}

function createSeedPolls() {
  const createdDate = nowIso();
  return [
    normalizePoll({
      id: "poll_demo_1",
      question: "Qual ritmo você prefere para capítulos semanais?",
      options: [
        { id: "poll_demo_1_fast", label: "Curtos e frequentes", votes: 7 },
        { id: "poll_demo_1_balanced", label: "Médios e consistentes", votes: 12 },
        { id: "poll_demo_1_long", label: "Longos e mais raros", votes: 4 }
      ],
      voter_ids: [],
      created_by: "demo@storyforge.app",
      created_date: createdDate,
      updated_date: createdDate
    })
  ];
}

export function ensureSocialContentSeed() {
  const posts = readStorage(STORAGE_KEYS.posts);
  const polls = readStorage(STORAGE_KEYS.polls);

  if (!posts.length) {
    writeStorage(STORAGE_KEYS.posts, createSeedPosts());
  }

  if (!polls.length) {
    writeStorage(STORAGE_KEYS.polls, createSeedPolls());
  }
}

export function listPosts() {
  ensureSocialContentSeed();
  return clone(readStorage(STORAGE_KEYS.posts).map((entry) => normalizePost(entry))).sort(
    (left, right) => new Date(right.created_date) - new Date(left.created_date)
  );
}

export function listPostsByAuthor(email) {
  return listPosts().filter((entry) => entry.created_by === email);
}

export function createPost(data, userEmail) {
  const current = listPosts();
  const timestamp = nowIso();
  const next = normalizePost({
    ...data,
    created_by: userEmail,
    created_date: timestamp,
    updated_date: timestamp
  });
  current.push(next);
  writeStorage(STORAGE_KEYS.posts, current);
  return clone(next);
}

export function listPolls() {
  ensureSocialContentSeed();
  return clone(readStorage(STORAGE_KEYS.polls).map((entry) => normalizePoll(entry))).sort(
    (left, right) => new Date(right.created_date) - new Date(left.created_date)
  );
}

export function listPollsByAuthor(email) {
  return listPolls().filter((entry) => entry.created_by === email);
}

export function createPoll(data, userEmail) {
  const current = listPolls();
  const timestamp = nowIso();
  const next = normalizePoll({
    ...data,
    created_by: userEmail,
    created_date: timestamp,
    updated_date: timestamp
  });
  current.push(next);
  writeStorage(STORAGE_KEYS.polls, current);
  return clone(next);
}

export function votePoll(pollId, optionId, voterId) {
  const polls = listPolls();
  const index = polls.findIndex((entry) => entry.id === pollId);
  if (index === -1) {
    throw new Error("Enquete não encontrada.");
  }

  const poll = normalizePoll(polls[index]);
  if ((poll.voter_ids || []).includes(voterId)) {
    return clone(poll);
  }

  const optionExists = poll.options.some((option) => option.id === optionId);
  if (!optionExists) {
    throw new Error("Opção de enquete não encontrada.");
  }

  poll.options = poll.options.map((option) =>
    option.id === optionId ? { ...option, votes: option.votes + 1 } : option
  );
  poll.voter_ids = [...(poll.voter_ids || []), voterId];
  poll.updated_date = nowIso();
  polls[index] = poll;
  writeStorage(STORAGE_KEYS.polls, polls);
  return clone(poll);
}
