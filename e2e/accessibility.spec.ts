// Accessibility and layout checks on every screen and every exercise type:
// every control has a name, every input has a label, there is one main heading,
// and nothing makes the page scroll sideways at 360px wide.
import { expect, test, type Page } from "@playwright/test";

test.setTimeout(120_000);

/** Open a lesson at a step by saving progress, as the app would. */
async function openAtStep(page: Page, path: string, lessonId: string, step: number) {
  await page.goto("/");
  await page.evaluate(
    ({ lessonId, step }) =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open("keyval-store");
        open.onupgradeneeded = () => open.result.createObjectStore("keyval");
        open.onsuccess = () => {
          const tx = open.result.transaction("keyval", "readwrite");
          tx.objectStore("keyval").put({ version: 1, lessons: { [lessonId]: { step } }, answers: {} }, "progress");
          tx.oncomplete = () => resolve();
        };
      }),
    { lessonId, step },
  );
  await page.goto("about:blank");
  await page.goto(path);
  await expect(page.getByText(new RegExp(`^Step ${step + 1} of \\d+$`))).toBeVisible();
}

/** Problems on the current screen. Each is a sentence naming the element. */
async function audit(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const visible = (el: Element) => {
      const box = (el as HTMLElement).getBoundingClientRect();
      return box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== "hidden";
    };
    const describe = (el: Element) => `<${el.tagName.toLowerCase()} class="${el.getAttribute("class") ?? ""}">`;

    for (const el of document.querySelectorAll("button, a[href], [role='button']")) {
      if (!visible(el)) continue;
      const name = el.getAttribute("aria-label") || el.textContent?.trim() || el.getAttribute("title");
      if (!name) problems.push(`${describe(el)} has no accessible name`);
    }
    for (const el of document.querySelectorAll("input, textarea, select")) {
      if ((el as HTMLInputElement).type === "file" || !visible(el)) continue;
      const labelled = el.getAttribute("aria-label") || el.closest("label") || (el.id && document.querySelector(`label[for="${el.id}"]`));
      if (!labelled) problems.push(`${describe(el)} has no label`);
    }
    const cmEditors = document.querySelectorAll(".cm-content");
    for (const el of cmEditors) if (!el.getAttribute("aria-label")) problems.push("a code editor has no label");

    const h1s = [...document.querySelectorAll("h1")].filter(visible);
    if (h1s.length > 1) problems.push(`${h1s.length} main headings (h1)`);
    if (!document.documentElement.lang) problems.push("the page has no lang attribute");

    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (overflow > 0) problems.push(`the page scrolls sideways by ${overflow}px`);
    return problems;
  });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
});

test("main screens", async ({ page }) => {
  for (const path of ["/#/today", "/#/learn", "/#/learn/data", "/#/learn/git", "/#/learn/io", "/#/practice", "/#/me", "/#/today/review"]) {
    await page.goto("about:blank");
    await page.goto(path);
    await expect(page.locator(".screen")).toBeVisible();
    await page.waitForTimeout(200);
    expect(await audit(page), path).toEqual([]);
  }
});

const EXERCISES: [string, string, number, string][] = [
  ["/#/learn/data/data-01", "data-01", 1, "predict"],
  ["/#/learn/data/data-01", "data-01", 3, "choice"],
  ["/#/learn/data/data-01", "data-01", 5, "cloze"],
  ["/#/learn/structure/structure-01", "structure-01", 5, "edit"],
  ["/#/learn/debugging/debugging-03", "debugging-03", 5, "fix"],
  ["/#/learn/debugging/debugging-01", "debugging-01", 5, "traceback"],
  ["/#/learn/data/data-05", "data-05", 7, "shape"],
  ["/#/learn/structure/structure-01", "structure-01", 8, "parsons"],
  ["/#/learn/structure/structure-03", "structure-03", 4, "split"],
  ["/#/learn/git/git-03", "git-03", 1, "diff"],
  ["/#/learn/git/git-01", "git-01", 4, "git"],
  ["/#/learn/start/start-01", "start-01", 8, "explain it back"],
];

for (const [path, lessonId, step, type] of EXERCISES) {
  test(`exercise: ${type}`, async ({ page }) => {
    await openAtStep(page, path, lessonId, step);
    await page.waitForTimeout(300); // let the editor load where there is one
    expect(await audit(page), type).toEqual([]);
  });
}
