// Phase 4: Today, review, streaks, settings, the bug journal, Apply tasks and backups.
import { expect, test, type Page } from "@playwright/test";

test.setTimeout(90_000);

/** A calendar day relative to today, as the app writes it (local time). */
function day(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Save raw progress (any version) the way the app stores it, then open a page. */
async function seed(page: Page, progress: unknown, path: string) {
  await page.goto("/");
  await page.evaluate(
    (data) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("keyval-store");
        open.onupgradeneeded = () => open.result.createObjectStore("keyval");
        open.onsuccess = () => {
          const tx = open.result.transaction("keyval", "readwrite");
          tx.objectStore("keyval").put(data, "progress");
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    progress,
  );
  await page.goto("about:blank"); // WebKit may skip a goto that only changes the hash
  await page.goto(path);
}

const v3 = (extra: Record<string, unknown>) => ({
  version: 3,
  lessons: {},
  answers: {},
  explanations: {},
  review: {},
  activity: {},
  bugs: [],
  apply: {},
  selfTest: {},
  settings: { theme: "system", haptics: true },
  lastBackupAt: null,
  ...extra,
});

test("a fresh start: no streak yet, an empty goal ring, nothing due", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: "0 of 15 minutes practised today" })).toBeVisible();
  await expect(page.getByText("Five minutes of practice starts a streak.")).toBeVisible();
  await expect(page.getByText(/Nothing due today/)).toBeVisible();
});

test("exercises answered before this version come up for review, and a review moves them on", async ({ page }) => {
  const answered = { attempts: 1, firstTryCorrect: false, lastCorrect: false, lastAnsweredAt: new Date().toISOString() };
  await seed(page, { version: 2, lessons: {}, answers: { "data-01-join-strings": answered }, explanations: {} }, "/#/today");

  await expect(page.getByText("1 card is due.")).toBeVisible();
  await page.getByRole("link", { name: "5-minute review" }).click();
  await expect(page.getByText("Card 1 of 1")).toBeVisible();
  await page.getByRole("button", { name: '"123"' }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Right.");
  await page.getByRole("button", { name: "Finish review" }).click();
  await expect(page.getByRole("heading", { name: "1 of 1 right" })).toBeVisible();

  await page.getByRole("link", { name: "Back to Today" }).click();
  await expect(page.getByText(/Nothing due today/)).toBeVisible();
});

test("a recall card asks for the lesson from memory, then shows the recap", async ({ page }) => {
  await seed(page, v3({ review: { "recall:data-04": { box: 2, due: day(-1) } } }), "/#/today/review");
  await expect(page.getByRole("heading", { name: "Dictionaries: things by name" })).toBeVisible();
  await page.getByRole("button", { name: "Show the model answer" }).click();
  await expect(page.locator(".model-answer")).toContainText("dictionary");
  await page.getByRole("button", { name: "Not yet" }).click();
  await page.getByRole("button", { name: "Finish review" }).click();
  await expect(page.getByRole("heading", { name: "0 of 1 right" })).toBeVisible();
});

test("the streak counts days with five minutes, forgiving one missed day", async ({ page }) => {
  const activity = { [day(-3)]: 400, [day(-1)]: 600, [day(0)]: 360 };
  await seed(page, v3({ activity }), "/#/today");
  await expect(page.getByText("3 days")).toBeVisible();
  await expect(page.getByText("Today counts.")).toBeVisible();
  await expect(page.getByText("One missed day this week, forgiven.")).toBeVisible();
  await expect(page.getByRole("img", { name: "6 of 15 minutes practised today" })).toBeVisible();
});

test("theme setting overrides the phone, and is remembered", async ({ page }) => {
  await page.goto("/#/me");
  await page.getByRole("radio", { name: "Dark" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.waitForTimeout(300); // let the save reach storage
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("radio", { name: "Same as the phone" }).check();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
});

test("the bug journal keeps entries, and Fix the bug can log one prefilled", async ({ page }) => {
  await seed(page, v3({ lessons: { "debugging-03": { step: 5 } } }), "/#/learn/debugging/debugging-03");
  await expect(page.getByText(/^Step 6 of \d+$/)).toBeVisible();
  const run = page.getByRole("button", { name: "Run", exact: true });
  await run.click();
  await expect(page.locator(".task-verdict")).toBeVisible({ timeout: 45_000 });
  await run.click();
  await page.getByRole("button", { name: "Show the solution" }).click();
  await page.locator(".cause-question .option").first().click();
  await page.getByRole("button", { name: "Log this bug" }).click();
  await expect(page.getByLabel("Cause")).not.toHaveValue("");
  await page.getByLabel("How I found it").fill("Showed the solution and compared.");
  await page.getByRole("button", { name: "Save to the journal" }).click();
  await expect(page.getByText("Saved to your bug journal")).toBeVisible();

  await page.evaluate(() => (window.location.hash = "#/me")); // move within the app, as a tap would
  await expect(page.locator(".bug-entry")).toContainText("Showed the solution and compared.");
});

test("Apply tasks can be ticked and noted, on the module page and the Me tab", async ({ page }) => {
  await page.goto("/#/learn/data");
  const task = page.locator(".apply-task").first();
  await task.getByRole("checkbox").check();
  await task.getByRole("button", { name: "Add notes" }).click();
  await task.getByRole("textbox").fill("Used the harbour scene.");

  await page.evaluate(() => (window.location.hash = "#/me")); // move within the app, as a tap would
  await expect(page.getByText(/^Desk work, three tiers per module\. 1 of \d+ done\.$/)).toBeVisible();
});

test("export a backup, then import it into a fresh app", async ({ page }) => {
  await seed(page, v3({ lessons: { "data-01": { step: 0, completedAt: new Date().toISOString() } } }), "/#/me");
  await expect(page.getByText("You have not saved a backup yet.")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^code-literacy-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();

  // Start again with empty progress, then import.
  await seed(page, v3({}), "/#/me");
  const moduleOne = page.locator(".progress-list li", { hasText: "Module 1: Data" });
  await expect(moduleOne).toContainText("0 of 6 lessons");
  page.once("dialog", (dialog) => void dialog.accept());
  await page.locator('input[type="file"]').setInputFiles(path!);
  await expect(page.getByText(/Loaded the backup from/)).toBeVisible();
  await expect(moduleOne).toContainText("1 of 6 lessons");
});

test("a file that is not a backup is refused", async ({ page }) => {
  await page.goto("/#/me");
  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/not-a-backup.json");
  await expect(page.getByText("That file is not a Code Literacy backup.")).toBeVisible();
});
