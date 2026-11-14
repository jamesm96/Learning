// Phase 3: shape it, reorder lines, review the diff, the Git simulator, files, explain it back and prompts.
import { expect, test, type Page } from "@playwright/test";

test.setTimeout(90_000);
const PYTHON = { timeout: 45_000 };

/** Open a lesson at a given step (0-based) by saving version 1 progress, which the app must migrate. */
async function openAtStep(page: Page, moduleId: string, lessonId: string, step: number) {
  await page.goto("/");
  await page.evaluate(
    ({ lessonId, step }) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("keyval-store");
        open.onupgradeneeded = () => open.result.createObjectStore("keyval");
        open.onsuccess = () => {
          const tx = open.result.transaction("keyval", "readwrite");
          tx.objectStore("keyval").put({ version: 1, lessons: { [lessonId]: { step } }, answers: {} }, "progress");
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    { lessonId, step },
  );
  await page.goto("about:blank"); // WebKit may skip a goto that only changes the hash
  await page.goto(`/#/learn/${moduleId}/${lessonId}`);
  await expect(page.getByText(new RegExp(`^Step ${step + 1} of \\d+$`))).toBeVisible();
}

test("shape it: tapping through the data builds the path", async ({ page }) => {
  await openAtStep(page, "data", "data-05", 7);
  const row = (text: string) => page.locator(".tree-row", { hasText: text }).last();
  await row('"joints"').click();
  await row("[1]").click();
  await row('"limits"').click();
  await row('"max"').click();
  await expect(page.locator(".path-display code")).toHaveText('robot["joints"][1]["limits"]["max"]');
  await page.getByRole("button", { name: "Check this path" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Right.");
});

test("shape it: a typed path is read and checked too", async ({ page }) => {
  await openAtStep(page, "data", "data-05", 7);
  await page.getByRole("button", { name: "Type the path instead" }).click();
  await page.getByLabel("Type the path").fill('robot["joints"][0]["limits"]["max"]');
  await page.getByRole("button", { name: "Check this path" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Not this one.");
  await expect(page.locator(".feedback")).toContainText('robot["joints"][1]["limits"]["max"]');
});

test("reorder lines: lines move and indent, and the result is run", async ({ page }) => {
  await openAtStep(page, "structure", "structure-01", 8);
  const lines = page.locator(".parsons-line");
  const firstText = await lines.first().innerText();
  await lines.first().click();
  await page.getByRole("button", { name: "Move down" }).click();
  await expect(lines.nth(1)).toContainText(firstText.trim());
  await page.getByRole("button", { name: "Indent more" }).click();
  await expect(lines.nth(1).locator(".parsons-indent")).toHaveText("    ");

  const check = page.getByRole("button", { name: "Run to check" });
  await check.click();
  await expect(page.locator(".task-verdict")).toContainText("Not yet.", PYTHON);
  await check.click();
  await page.getByRole("button", { name: "Show the solution" }).click();
  await expect(page.getByLabel("Solution")).toContainText("def low_stock");
});

test("review the diff: flagging nothing is right when every change belongs", async ({ page }) => {
  await openAtStep(page, "git", "git-03", 6);
  await page.getByRole("button", { name: "Nothing beyond the task" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Right.");
});

test("review the diff: a missed change is pointed out", async ({ page }) => {
  await openAtStep(page, "git", "git-03", 1);
  await page.getByRole("button", { name: "Nothing beyond the task" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("missed");
  await expect(page.getByText("Missed: this goes beyond the task").first()).toBeVisible();
});

test("git: commit only the budget change", async ({ page }) => {
  await openAtStep(page, "git", "git-01", 4);
  const commands = page.getByRole("group", { name: "Git commands" });
  await commands.getByRole("button", { name: "status", exact: true }).click();
  await expect(page.getByRole("log", { name: "Terminal" })).toContainText("modified:   budget.py");

  await commands.getByRole("button", { name: "add…" }).click();
  await page.locator(".git-ask").getByRole("button", { name: "budget.py" }).click();
  await commands.getByRole("button", { name: "commit…" }).click();
  await page.getByLabel("Commit message").fill("Raise the triangle budget");
  await page.getByRole("button", { name: "Commit", exact: true }).click();

  await expect(page.locator(".feedback-verdict")).toContainText("Done.");
  await expect(page.locator(".git-history")).toContainText("Raise the triangle budget");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
});

test("files: lesson code reads the sample files", async ({ page }) => {
  await openAtStep(page, "io", "io-02", 1);
  await page.getByRole("button", { name: "Predict in my head instead" }).click();
  await page.getByRole("button", { name: "I have my prediction. Run it" }).click();
  await expect(page.getByLabel("Output")).toContainText("Harbour level notes", PYTHON);
});

test("explain it back: text is saved, and survives a reload", async ({ page }) => {
  await openAtStep(page, "start", "start-01", 8);
  await page.getByRole("textbox").fill("Judge code by predicting and reading changes.");
  await page.getByRole("button", { name: "Compare with a model answer" }).click();
  await expect(page.locator(".model-answer")).toContainText("One way to say it");

  // Wait until the text has reached the device's storage, then reload.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<string>((resolve) => {
            const open = indexedDB.open("keyval-store");
            open.onsuccess = () => {
              const get = open.result.transaction("keyval").objectStore("keyval").get("progress");
              get.onsuccess = () => resolve(get.result?.explanations?.["start-01"]?.text ?? "");
            };
          }),
      ),
    )
    .toBe("Judge code by predicting and reading changes.");
  await page.reload();
  await expect(page.getByRole("textbox")).toHaveValue("Judge code by predicting and reading changes.");
});

test("module pages offer prompts for Claude", async ({ page }) => {
  await page.goto("/#/learn/data");
  await expect(page.getByRole("heading", { name: "Prompts for Claude" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy prompt" }).first()).toBeVisible();
});

test("the whole course is on the map, with nothing marked as unwritten", async ({ page }) => {
  await page.goto("/#/learn");
  for (const title of ["Data", "Structure", "Debugging", "Git", "Data in and out", "Capstone and beyond"]) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Not written yet")).toHaveCount(0);
});
