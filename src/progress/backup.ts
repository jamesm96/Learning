// Backups: your progress as a JSON file you can keep, and later load back in.
// iOS may clear a website's storage if it goes unused for a while, so this is the safety net.

import { migrate, UnreadableProgressError, type Progress } from "./progress";

const APP = "code-literacy";

export interface BackupFile {
  app: typeof APP;
  exportedAt: string; // ISO date
  progress: Progress;
  scratchpad: string | null;
}

/** Everything worth keeping, as a backup file's contents. */
export function makeBackup(progress: Progress, scratchpad: string | null, now: Date): BackupFile {
  return { app: APP, exportedAt: now.toISOString(), progress, scratchpad };
}

/** The file name for a backup made on a given day, for example code-literacy-backup-2026-11-14.json. */
export function backupFileName(now: Date): string {
  return `code-literacy-backup-${now.toISOString().slice(0, 10)}.json`;
}

export type ReadBackupResult =
  | { ok: true; progress: Progress; scratchpad: string | null; exportedAt: string }
  | { ok: false; error: string };

/** Read a backup file's text, checking it really is one and bringing old versions up to date. */
export function readBackup(text: string): ReadBackupResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not a backup: it is not valid JSON." };
  }
  if (typeof data !== "object" || data === null || (data as { app?: unknown }).app !== APP) {
    return { ok: false, error: "That file is not a Code Literacy backup." };
  }
  const file = data as Partial<BackupFile>;
  try {
    return {
      ok: true,
      progress: migrate(file.progress),
      scratchpad: typeof file.scratchpad === "string" ? file.scratchpad : null,
      exportedAt: typeof file.exportedAt === "string" ? file.exportedAt : "",
    };
  } catch (error) {
    if (error instanceof UnreadableProgressError) {
      return { ok: false, error: `This backup cannot be read: ${error.message}. Update the app and try again.` };
    }
    throw error;
  }
}
