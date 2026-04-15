export const BRAZIL_TIME_ZONE = "America/Sao_Paulo";
export const DAILY_STREAK_GOAL = 100;
export const REMINDER_HOUR_BRT = 21;

function getFormatter(options) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIME_ZONE,
    ...options
  });
}

export function getBrazilDateKey(date = new Date()) {
  const parts = getFormatter({ year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function getBrazilHour(date = new Date()) {
  const hour = getFormatter({ hour: "2-digit", hourCycle: "h23" }).format(date);
  return Number(hour);
}

export function shiftDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return utcDate.toISOString().slice(0, 10);
}

export function normalizeStreakUser(user) {
  return {
    streakCount: Number(user?.streakCount || 0),
    lastStreakDate: user?.lastStreakDate || "",
    wordsWrittenToday: Number(user?.wordsWrittenToday || 0),
    wordsTrackingDate: user?.wordsTrackingDate || "",
    reminderSentDate: user?.reminderSentDate || ""
  };
}

export function reconcileStreakState(user, now = new Date()) {
  const streak = normalizeStreakUser(user);
  const today = getBrazilDateKey(now);
  const yesterday = shiftDateKey(today, -1);
  const patch = {};

  if (!streak.wordsTrackingDate) {
    patch.wordsTrackingDate = today;
    patch.wordsWrittenToday = streak.wordsWrittenToday || 0;
  } else if (streak.wordsTrackingDate !== today) {
    const completedTrackedDay = streak.lastStreakDate === streak.wordsTrackingDate && streak.wordsWrittenToday >= DAILY_STREAK_GOAL;
    if (!completedTrackedDay) {
      patch.streakCount = 0;
    }
    patch.wordsTrackingDate = today;
    patch.wordsWrittenToday = 0;
    patch.reminderSentDate = "";
  }

  if (streak.lastStreakDate && streak.lastStreakDate !== today && streak.lastStreakDate !== yesterday && streak.streakCount !== 0) {
    patch.streakCount = 0;
  }

  return patch;
}

export function applyWordsToStreak(user, wordDelta, now = new Date()) {
  const streak = normalizeStreakUser(user);
  const today = getBrazilDateKey(now);
  const yesterday = shiftDateKey(today, -1);
  const nextWords = Math.max(streak.wordsWrittenToday + Math.max(0, Number(wordDelta) || 0), 0);
  const patch = {
    wordsTrackingDate: today,
    wordsWrittenToday: nextWords
  };

  if (nextWords >= DAILY_STREAK_GOAL && streak.lastStreakDate !== today) {
    patch.streakCount = streak.lastStreakDate === yesterday ? streak.streakCount + 1 : 1;
    patch.lastStreakDate = today;
  }

  return patch;
}

export function getStreakProgress(user) {
  const streak = normalizeStreakUser(user);
  const words = streak.wordsWrittenToday;
  return {
    goal: DAILY_STREAK_GOAL,
    completedToday: words >= DAILY_STREAK_GOAL,
    words,
    remaining: Math.max(DAILY_STREAK_GOAL - words, 0)
  };
}

export function shouldSendReminder(user, now = new Date()) {
  const streak = normalizeStreakUser(user);
  const today = getBrazilDateKey(now);
  const hour = getBrazilHour(now);
  const progress = getStreakProgress(streak);

  return hour >= REMINDER_HOUR_BRT && streak.wordsTrackingDate === today && !progress.completedToday && streak.reminderSentDate !== today;
}
