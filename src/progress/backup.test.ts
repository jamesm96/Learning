import { describe, expect, it } from "vitest";
import { backupFileName, makeBackup, readBackup } from "./backup";
import { addBug, backupDue, completeLesson, emptyProgress, markBackedUp } from "./progress";

const now = new Date("2026-11-14T10:00:00Z");

describe("backups", () => {
  it("round-trips progress and the scratchpad through a file", () => {
    const progress = completeLesson(emptyProgress(), "data-01", now);
    const text = JSON.stringify(makeBackup(progress, "print('hi')", now));
    expect(readBackup(text)).toEqual({ ok: true, progress, scratchpad: "print('hi')", exportedAt: now.toISOString() });
  });

  it("upgrades a backup made by an older version of the app", () => {
    const old = { app: "code-literacy", exportedAt: now.toISOString(), progress: { version: 1, lessons: { "data-01": { step: 2 } }, answers: {} } };
    const result = readBackup(JSON.stringify(old));
    expect(result.ok && result.progress.version).toBe(3);
    expect(result.ok && result.progress.lessons).toEqual({ "data-01": { step: 2 } });
  });

  it("refuses files that are not backups", () => {
    expect(readBackup("not json")).toMatchObject({ ok: false, error: expect.stringContaining("not valid JSON") });
    expect(readBackup('{"hello": 1}')).toMatchObject({ ok: false, error: expect.stringContaining("not a Code Literacy backup") });
  });

  it("refuses a backup from a newer app, rather than guessing", () => {
    const newer = { app: "code-literacy", progress: { version: 99 } };
    expect(readBackup(JSON.stringify(newer))).toMatchObject({ ok: false, error: expect.stringContaining("Update the app") });
  });

  it("names the file after the day", () => {
    expect(backupFileName(now)).toBe("code-literacy-backup-2026-11-14.json");
  });
});

describe("backupDue", () => {
  it("is not due with nothing to lose", () => {
    expect(backupDue(emptyProgress(), now)).toBe(false);
  });

  it("is due when there is progress and no backup yet", () => {
    expect(backupDue(completeLesson(emptyProgress(), "data-01", now), now)).toBe(true);
  });

  it("is due again 30 days after the last backup", () => {
    const progress = markBackedUp(addBug(emptyProgress(), { id: "b", symptom: "", cause: "", howFound: "", createdAt: "" }), now);
    expect(backupDue(progress, new Date("2026-12-10T10:00:00Z"))).toBe(false);
    expect(backupDue(progress, new Date("2026-12-15T10:00:00Z"))).toBe(true);
  });
});
