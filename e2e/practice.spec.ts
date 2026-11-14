// Phase 5: drills and the bug hunt on the Practice tab.
import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("a drill runs five random exercises from one topic", async ({ page }) => {
  await page.goto("/#/practice");
  await page.getByRole("link", { name: /Data shapes/ }).click();
  await expect(page.getByText("Drill: Data shapes · 1 of 5")).toBeVisible();
  await expect(page.getByText(/^Drill · /)).toBeVisible(); // each card says where it came from
  await expect(page.getByRole("button", { name: "Answer to continue" })).toBeDisabled();
  await page.getByRole("link", { name: "Stop the drill, back to Practice" }).click();
  await expect(page.getByRole("heading", { name: "Run anything, any time." })).toBeVisible();
});

test("the bug hunt lists snippets by level, and opens one to fix", async ({ page }) => {
  await page.goto("/#/practice");
  const easy = page.locator("details.apply-group", { hasText: "Easy" });
  await expect(easy).toContainText("0 of 7 solved");
  await easy.locator("summary").click();
  await easy.locator(".lesson-link").first().click();

  await expect(page.getByText("Bug hunt · 1 of 1")).toBeVisible();
  await expect(page.locator(".exercise-tag")).toHaveText("Fix the bug");
  const run = page.getByRole("button", { name: "Run", exact: true });
  await run.click();
  await expect(page.locator(".task-verdict")).toBeVisible({ timeout: 45_000 });
  await run.click();
  await page.getByRole("button", { name: "Show the solution" }).click();
  await page.locator(".cause-question .option").first().click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: /of 1 right/ })).toBeVisible();

  await page.getByRole("link", { name: "Done", exact: true }).click();
  await expect(page.locator("details.apply-group", { hasText: "Easy" })).toContainText("Tried");
});
