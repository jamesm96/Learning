// Save and load progress on the device, in IndexedDB (via idb-keyval).

import { get, set } from "idb-keyval";
import { emptyProgress, migrate, UnreadableProgressError, type Progress } from "./progress";

const KEY = "progress";

/** Load saved progress, upgrading old versions. Unreadable data is set aside under another key, never deleted. */
export async function loadProgress(): Promise<Progress> {
  const stored: unknown = await get(KEY);
  try {
    return migrate(stored);
  } catch (error) {
    if (!(error instanceof UnreadableProgressError)) throw error;
    const backupKey = `progress-unreadable-${new Date().toISOString()}`;
    await set(backupKey, stored);
    console.warn(`${error.message}. Kept a copy under "${backupKey}" and started fresh.`);
    return emptyProgress();
  }
}

/** Save progress. */
export async function saveProgress(progress: Progress): Promise<void> {
  await set(KEY, progress);
}

let persistenceRequested = false;

/** Ask the browser not to clear our storage when space runs low. Called once, on the first answer. */
export function requestPersistentStorage(): void {
  if (persistenceRequested) return;
  persistenceRequested = true;
  void navigator.storage?.persist?.();
}
