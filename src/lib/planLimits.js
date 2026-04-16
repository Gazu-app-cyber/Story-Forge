export const PLAN_DEFINITIONS = {
  free: {
    label: "Free",
    projectLimit: 10,
    wordLimitPerManuscript: 20000,
    collaboratorLimit: 0
  },
  premium: {
    label: "Premium",
    projectLimit: Infinity,
    wordLimitPerManuscript: Infinity,
    collaboratorLimit: 5
  },
  pro: {
    label: "Pro",
    projectLimit: Infinity,
    wordLimitPerManuscript: Infinity,
    collaboratorLimit: Infinity
  }
};

export const PLAN_FEATURES = {
  export: ["premium", "pro"],
  stats: ["premium", "pro"],
  collaboration: ["premium", "pro"],
  bookMode: ["pro"],
  templates: ["pro"]
};

export function normalizePlan(plan) {
  return PLAN_DEFINITIONS[plan] ? plan : "free";
}

export function getPlanDefinition(user) {
  return PLAN_DEFINITIONS[normalizePlan(user?.plan)];
}

export function checkFeatureAccess(feature, user) {
  const plan = normalizePlan(user?.plan);
  const allowedPlans = PLAN_FEATURES[feature] || [];
  return allowedPlans.includes(plan);
}

export function countWordsFromHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

export function getWritingStats(html = "") {
  const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(" ").filter(Boolean).length : 0;
  const characters = plainText.replace(/\s/g, "").length;
  const pages = Math.max(1, Math.ceil(words / 500));
  return { words, characters, pages };
}

export function checkProjectLimit(user, projectCount) {
  const plan = getPlanDefinition(user);
  const limit = plan.projectLimit;
  const allowed = limit === Infinity || projectCount < limit;
  return {
    allowed,
    limit,
    remaining: limit === Infinity ? Infinity : Math.max(limit - projectCount, 0),
    message: allowed ? "" : "Você atingiu o limite do plano gratuito. Faça upgrade para continuar."
  };
}

export function checkWordLimit(contentOrWordCount, user) {
  const plan = getPlanDefinition(user);
  const words = typeof contentOrWordCount === "number" ? contentOrWordCount : countWordsFromHtml(contentOrWordCount);
  const limit = plan.wordLimitPerManuscript;
  const allowed = limit === Infinity || words <= limit;
  return {
    allowed,
    limit,
    words,
    remaining: limit === Infinity ? Infinity : Math.max(limit - words, 0),
    message: allowed ? "" : "Você atingiu o limite do plano gratuito. Faça upgrade para continuar."
  };
}

export function checkCollaborationLimit(user, collaboratorCount) {
  const plan = getPlanDefinition(user);
  const limit = plan.collaboratorLimit;
  const hasAccess = limit > 0;
  const allowed = hasAccess && (limit === Infinity || collaboratorCount < limit);

  return {
    hasAccess,
    allowed,
    limit,
    remaining: limit === Infinity ? Infinity : Math.max(limit - collaboratorCount, 0),
    message: hasAccess ? "Você atingiu o limite de colaboradores do seu plano." : "Colaboração não está disponível no plano gratuito."
  };
}
