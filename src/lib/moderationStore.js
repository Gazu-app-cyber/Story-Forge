import { dispatchStoryforgeDataChanged, safeReadJson, safeWriteJson } from "@/lib/safeBrowserStorage";

const STORAGE_KEYS = {
  reports: "storyforge_content_reports",
  blockedUsers: "storyforge_user_blocks"
};

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function readReports() {
  return safeReadJson(STORAGE_KEYS.reports, []);
}

function writeReports(reports) {
  safeWriteJson(STORAGE_KEYS.reports, reports);
  dispatchStoryforgeDataChanged(STORAGE_KEYS.reports);
}

function readBlocks() {
  return safeReadJson(STORAGE_KEYS.blockedUsers, []);
}

function writeBlocks(blocks) {
  safeWriteJson(STORAGE_KEYS.blockedUsers, blocks);
  dispatchStoryforgeDataChanged(STORAGE_KEYS.blockedUsers);
}

export function normalizeContentReport(report = {}) {
  return {
    id: report.id || createId("report"),
    content_type: report.content_type || "unknown",
    content_id: report.content_id || "",
    content_title: report.content_title || "",
    reported_by: normalizeEmail(report.reported_by),
    reported_author: normalizeEmail(report.reported_author),
    reason: report.reason || "other",
    details: String(report.details || "").trim(),
    status: report.status || "pending",
    created_date: report.created_date || nowIso(),
    updated_date: report.updated_date || report.created_date || nowIso()
  };
}

export function normalizeUserBlock(block = {}) {
  return {
    id: block.id || createId("block"),
    blocker_email: normalizeEmail(block.blocker_email),
    blocked_email: normalizeEmail(block.blocked_email),
    created_date: block.created_date || nowIso(),
    updated_date: block.updated_date || block.created_date || nowIso()
  };
}

export function listContentReports() {
  return readReports().map(normalizeContentReport);
}

export function listReportsByReporter(email) {
  const normalizedEmail = normalizeEmail(email);
  return listContentReports().filter((report) => report.reported_by === normalizedEmail);
}

export function createContentReport(reportData) {
  const report = normalizeContentReport(reportData);

  if (!report.reported_by) {
    throw new Error("Voce precisa estar autenticado para denunciar conteudo.");
  }

  if (!report.content_id || !report.content_type) {
    throw new Error("Nao foi possivel identificar o conteudo denunciado.");
  }

  const reports = listContentReports();
  const duplicate = reports.find(
    (entry) =>
      entry.reported_by === report.reported_by &&
      entry.content_type === report.content_type &&
      entry.content_id === report.content_id &&
      entry.reason === report.reason &&
      entry.status === "pending"
  );

  if (duplicate) {
    throw new Error("Voce ja enviou uma denuncia pendente com esse motivo para este conteudo.");
  }

  const nextReports = [report, ...reports];
  writeReports(nextReports);
  return report;
}

export function listUserBlocks() {
  return readBlocks().map(normalizeUserBlock);
}

export function listBlockedUsersByBlocker(email) {
  const normalizedEmail = normalizeEmail(email);
  return listUserBlocks().filter((block) => block.blocker_email === normalizedEmail);
}

export function isUserBlocked(blockerEmail, blockedEmail) {
  const blocker = normalizeEmail(blockerEmail);
  const blocked = normalizeEmail(blockedEmail);
  if (!blocker || !blocked) return false;
  return listUserBlocks().some((block) => block.blocker_email === blocker && block.blocked_email === blocked);
}

export function isEitherDirectionBlocked(leftEmail, rightEmail) {
  const left = normalizeEmail(leftEmail);
  const right = normalizeEmail(rightEmail);
  if (!left || !right) return false;
  return isUserBlocked(left, right) || isUserBlocked(right, left);
}

export function blockUser(blockerEmail, blockedEmail) {
  const blocker = normalizeEmail(blockerEmail);
  const blocked = normalizeEmail(blockedEmail);

  if (!blocker || !blocked) {
    throw new Error("Nao foi possivel registrar esse bloqueio.");
  }

  if (blocker === blocked) {
    throw new Error("Voce nao pode bloquear a propria conta.");
  }

  if (isUserBlocked(blocker, blocked)) {
    throw new Error("Esse usuario ja esta bloqueado.");
  }

  const nextBlock = normalizeUserBlock({
    blocker_email: blocker,
    blocked_email: blocked
  });

  writeBlocks([nextBlock, ...listUserBlocks()]);
  return nextBlock;
}

export function unblockUser(blockerEmail, blockedEmail) {
  const blocker = normalizeEmail(blockerEmail);
  const blocked = normalizeEmail(blockedEmail);
  const blocks = listUserBlocks();
  const exists = blocks.some((block) => block.blocker_email === blocker && block.blocked_email === blocked);

  if (!exists) {
    throw new Error("Esse usuario nao esta bloqueado.");
  }

  const nextBlocks = blocks.filter((block) => !(block.blocker_email === blocker && block.blocked_email === blocked));
  writeBlocks(nextBlocks);
  return true;
}

export function deleteModerationDataByUser(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  const nextReports = listContentReports().filter(
    (report) => report.reported_by !== normalizedEmail && report.reported_author !== normalizedEmail
  );
  const nextBlocks = listUserBlocks().filter(
    (block) => block.blocker_email !== normalizedEmail && block.blocked_email !== normalizedEmail
  );

  writeReports(nextReports);
  writeBlocks(nextBlocks);
}
