import { expect, test, type Page } from "@playwright/test";

// These tests really load Python (Pyodide) in the browser, so they allow extra time.
test.setTimeout(90_000);
const PYTHON = { timeout: 45_000 };

/** Open a lesson at a given step (0-based) by saving that step as progress, the way the app does. */
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
  await expect(page.getByText(`Step ${step + 1} of`)).toBeVisible();
}

/** Select all text in the editor. CodeMirror uses Cmd+A on Apple devices and Ctrl+A elsewhere, so press both. */
async function selectAll(page: Page) {
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Meta+a");
}

test("predict: a typed prediction is compared with what Python really prints", async ({ page }) => {
  await openAtStep(page, "data", "data-01", 1);
  await expect(page.getByRole("button", { name: "Run it" })).toBeDisabled(); // predict first

  await page.getByLabel("What will it print? Every line.").fill(
    "<class 'str'> <class 'int'> <class 'float'>\n9640\nrock_large_01rock_large_01",
  );
  await page.getByRole("button", { name: "Run it" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Right.", PYTHON);
});

test("predict: a wrong line is pointed out", async ({ page }) => {
  await openAtStep(page, "data", "data-01", 1);
  await page.getByLabel("What will it print? Every line.").fill("<class 'str'> <class 'int'> <class 'float'>\n9640\n9640");
  await page.getByRole("button", { name: "Run it" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Not this one.", PYTHON);
  await expect(page.locator(".diff-yours")).toContainText("You: 9640");
});

test("edit and run: hidden checks say what is wrong, and the solution can be shown", async ({ page }) => {
  await openAtStep(page, "structure", "structure-01", 5);
  const run = page.getByRole("button", { name: "Run", exact: true });
  await run.click();
  await expect(page.locator(".task-verdict")).toContainText("Not yet.", PYTHON);
  await run.click();
  await page.getByRole("button", { name: "Show the solution" }).click();
  await expect(page.getByLabel("Solution")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
});

test("read the traceback: tap the failing frame, then choose the cause", async ({ page }) => {
  await openAtStep(page, "debugging", "debugging-01", 5);
  const frames = page.locator(".tb-frame");
  await expect(frames.first()).toBeVisible();
  await frames.last().click();
  await expect(page.locator(".task-verdict")).toContainText("Right.");
  await page.locator(".cause-question .option").first().click();
  await expect(page.locator(".feedback-verdict")).toBeVisible();
});

test("scratchpad: runs code, stops a runaway loop, then runs again", async ({ page }) => {
  await page.goto("/#/practice");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByLabel("Output")).toContainText("rock_01: 4,820 triangles", PYTHON);

  // Replace the code with a loop that never ends.
  const editor = page.locator(".cm-content");
  await editor.click();
  await selectAll(page);
  await page.keyboard.type("while True:\n    pass");
  await page.getByRole("button", { name: "Run", exact: true }).first().click();
  await expect(page.getByText("Stopped. The code ran for more than 5 seconds")).toBeVisible({ timeout: 20_000 });

  // A fresh Python starts on the next run.
  await editor.click();
  await selectAll(page);
  await page.keyboard.type('print("back")');
  await page.locator(".run-buttons .button-run").click();
  await expect(page.getByLabel("Output")).toContainText("back", PYTHON);
});

test("the coding keyboard bar appears while the editor has focus", async ({ page }) => {
  await page.goto("/#/practice");
  await expect(page.locator(".cm-content")).toBeVisible();
  await expect(page.getByRole("toolbar", { name: "Coding keys" })).toHaveCount(0);

  await page.locator(".cm-content").click();
  const bar = page.getByRole("toolbar", { name: "Coding keys" });
  await expect(bar).toBeVisible();
  await page.keyboard.press("ControlOrMeta+End");
  await bar.getByRole("button", { name: "Brackets", exact: true }).click();
  await expect(page.locator(".cm-content")).toContainText("()");
  await expect(page.locator(".tabbar")).toBeHidden(); // makes way for the bar
});

test("works offline after the first visit, including Python once it has run", async ({ page, context }) => {
  await page.goto("/#/practice");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the service worker
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByLabel("Output")).toContainText("triangles", PYTHON);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Run anything, any time." })).toBeVisible();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByLabel("Output")).toContainText("triangles", PYTHON);
});
