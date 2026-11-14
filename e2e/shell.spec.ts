import { expect, test } from "@playwright/test";

const TAB_LABELS = ["Today", "Learn", "Practice", "Me"];

test("has an install manifest that opens full-screen", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const response = await request.get(href!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});

test("opens on Today and switches between all four tabs", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Today" })).toHaveAttribute("aria-current", "page");

  for (const label of TAB_LABELS) {
    await nav.getByRole("link", { name: label }).click();
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".eyebrow")).toHaveText(label);
  }
});

test("keeps the current tab after a reload", async ({ page }) => {
  await page.goto("/#/practice");
  await page.reload();
  await expect(page.locator(".eyebrow")).toHaveText("Practice");
});

test("never scrolls sideways at 360px wide", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const label of TAB_LABELS) {
    await page.goto(`/#/${label.toLowerCase()}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${label} screen is wider than the viewport`).toBeLessThanOrEqual(0);
  }
});
