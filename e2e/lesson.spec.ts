import { expect, test, type Page } from "@playwright/test";

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true });

/** Press Next through reading steps until an exercise appears. */
async function readUntilExercise(page: Page) {
  for (let guard = 0; guard < 20; guard++) {
    await expect(page.locator(".player-step")).toBeVisible();
    if (await page.locator(".exercise").count()) return;
    await next(page).click();
  }
  throw new Error("no exercise found within 20 steps");
}

test("completes the first lesson, with progress shown afterwards", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start lesson" }).click();
  await expect(page.getByRole("heading", { name: "How to use this" })).toBeVisible();

  const rightAnswers = [
    "Read every changed line",
    "A wrong prediction shows you exactly what you misunderstood",
    "You learn what each error message means",
  ];
  for (const answer of rightAnswers) {
    await readUntilExercise(page);
    await expect(page.getByRole("button", { name: "Answer to continue" })).toBeDisabled();
    await page.getByRole("button", { name: answer }).click();
    await expect(page.locator(".feedback-verdict")).toContainText("Right.");
    const finish = page.getByRole("button", { name: "Finish lesson" });
    if (await finish.isVisible()) await finish.click();
    else await next(page).click();
  }

  await expect(page.getByText("Lesson complete")).toBeVisible();
  await expect(page.getByText("3 of 3 right first time.")).toBeVisible();

  // Progress survives a reload: Today now offers the second lesson.
  await page.goto("/#/today");
  await page.reload();
  await expect(page.locator(".continue-title")).toHaveText("Set up once, and pace");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Learn" }).click();
  await page.getByRole("link", { name: /^Start/ }).click();
  await expect(page.getByRole("link", { name: /How to use this.*Done/ })).toBeVisible();
});

test("a wrong answer says so plainly and shows the right one", async ({ page }) => {
  await page.goto("/#/learn/start/start-01");
  await readUntilExercise(page);
  await page.getByRole("button", { name: "Keep it, because the tests pass" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Not this one.");
  await expect(page.getByText("Correct answer")).toBeVisible();
  await expect(page.getByText("Your answer")).toBeVisible();
  await expect(next(page)).toBeEnabled();
});

test("resumes a lesson at the step where it was left", async ({ page }) => {
  await page.goto("/#/learn/start/start-01");
  await next(page).click();
  await next(page).click();
  await expect(page.getByText("Step 3 of 7")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Step 3 of 7")).toBeVisible();
});

test("predict and fill-the-gap exercises can be answered", async ({ page }) => {
  test.setTimeout(90_000); // runs real Python
  await page.goto("/#/learn/start/start-02");
  await readUntilExercise(page);
  await page.getByRole("button", { name: "Predict in my head instead" }).click();
  await page.getByRole("button", { name: "I have my prediction. Run it" }).click();
  await expect(page.getByLabel("Output")).toContainText("Python is working.", { timeout: 45_000 });
  await page.getByRole("button", { name: "Yes, it matched" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Right.");

  await page.goto("/#/learn/data/data-01");
  // Steps 1-6 hold reading, a predict, and two choices; answer each to reach the gap.
  await next(page).click();
  await page.getByRole("button", { name: "Predict in my head instead" }).click();
  await page.getByRole("button", { name: "I have my prediction. Run it" }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await next(page).click();
  await next(page).click();
  await page.getByRole("button", { name: '"123"' }).click();
  await next(page).click();
  await page.getByRole("button", { name: "48204820" }).click();
  await next(page).click();

  await expect(page.getByRole("button", { name: "Check" })).toBeDisabled();
  await page.getByRole("button", { name: "str" }).click();
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".feedback-verdict")).toContainText("Not this one.");
  await expect(page.getByText("The gap should be int.")).toBeVisible();
});

test("lesson screens never scroll sideways at 360px, even with long code", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of ["/#/learn", "/#/learn/data", "/#/learn/data/data-05"]) {
    await page.goto("about:blank"); // WebKit may skip a goto that only changes the hash
    await page.goto(path);
    if (path.endsWith("data-05")) {
      await next(page).click();
      await next(page).click(); // the step with the wide scene dictionary
      await expect(page.locator("pre.code")).toBeVisible();
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} is wider than the viewport`).toBeLessThanOrEqual(0);
  }
});
