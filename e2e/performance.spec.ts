// First load must be under 3 seconds on a mid-range phone over 4G, not counting Python.
// Throttled like Lighthouse's mobile default: 150 ms round trips, 1.6 Mbps down, CPU 4x slower.
// Chromium only: the throttling uses Chrome DevTools controls.
import { expect, test } from "@playwright/test";

const BUDGET_MS = 3000;

test("first load fits the 3-second budget on throttled 4G", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "network and CPU throttling need Chromium");

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const start = Date.now();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Start lesson" })).toBeVisible({ timeout: 15_000 });
  const elapsed = Date.now() - start;

  const transferred = await page.evaluate(() =>
    performance.getEntriesByType("resource").reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).transferSize, 0),
  );
  test.info().annotations.push({ type: "first load", description: `${elapsed} ms, ${Math.round(transferred / 1024)} KB transferred` });
  console.log(`First load: ${elapsed} ms, ${Math.round(transferred / 1024)} KB transferred`);
  expect(elapsed).toBeLessThan(BUDGET_MS);
});
