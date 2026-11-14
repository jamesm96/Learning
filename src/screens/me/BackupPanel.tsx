import { get, set } from "idb-keyval";
import { useState } from "preact/hooks";
import { backupFileName, makeBackup, readBackup } from "../../progress/backup";
import { backupDue, markBackedUp } from "../../progress/progress";
import { getProgress, replaceProgress, updateProgress, useProgress } from "../../progress/store";

const SCRATCHPAD_KEY = "scratchpad";

/** Export progress to a file, and import it again. The safety net for when a phone clears website storage. */
export function BackupPanel() {
  const progress = useProgress();
  const [message, setMessage] = useState<string | null>(null);

  const exportBackup = async () => {
    const now = new Date();
    const scratchpad = (await get<string>(SCRATCHPAD_KEY)) ?? null;
    const file = makeBackup(getProgress(), scratchpad, now);
    const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName(now);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    updateProgress((p) => markBackedUp(p, now));
    setMessage(`Saved ${link.download}. Keep it somewhere safe, such as iCloud Drive or Google Drive.`);
  };

  const importBackup = async (input: HTMLInputElement) => {
    const chosen = input.files?.[0];
    input.value = ""; // so choosing the same file again still works
    if (!chosen) return;
    const result = readBackup(await chosen.text());
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    const when = result.exportedAt ? new Date(result.exportedAt).toLocaleString() : "an unknown date";
    const sure = window.confirm(
      `Replace the progress on this device with the backup from ${when}? Your current progress is kept as a safety copy on this device.`,
    );
    if (!sure) return;
    // Never lose data silently: keep what was here before.
    await set(`progress-before-import-${new Date().toISOString()}`, getProgress());
    replaceProgress(result.progress);
    if (result.scratchpad !== null) await set(SCRATCHPAD_KEY, result.scratchpad);
    setMessage(`Loaded the backup from ${when}.`);
  };

  const due = backupDue(progress, new Date());

  return (
    <section class="panel" aria-labelledby="backup-heading">
      <h2 id="backup-heading">Backup</h2>
      <p class="muted">
        Your progress lives only on this device. Phones can clear a website's storage if it goes unused for a while, so save a backup now and then.
      </p>
      {due && (
        <p class="backup-reminder" role="status">
          {progress.lastBackupAt
            ? `Your last backup was on ${new Date(progress.lastBackupAt).toLocaleDateString()}. It might be worth saving a fresh one.`
            : "You have not saved a backup yet. It takes a few seconds."}
        </p>
      )}
      <div class="run-buttons">
        <button type="button" class="button-run" onClick={() => void exportBackup()}>
          Export progress
        </button>
        <label class="button-secondary file-button">
          Import progress
          <input type="file" accept="application/json,.json" onChange={(event) => void importBackup(event.currentTarget)} />
        </label>
      </div>
      {message && (
        <p class="run-note" role="status">
          {message}
        </p>
      )}
      {progress.lastBackupAt && !due && <p class="run-note">Last backup: {new Date(progress.lastBackupAt).toLocaleDateString()}.</p>}
    </section>
  );
}
