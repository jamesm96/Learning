// Render public/icons/icon.svg to the PNG sizes the manifest and iOS need.
// Run with: npm run icons   (uses Playwright's Chromium, already a dev dependency)
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";

const svg = await readFile("public/icons/icon.svg", "utf-8");
const outputs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

const browser = await chromium.launch();
for (const { file, size } of outputs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const html = `<body style="margin:0">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`;
  await page.setContent(html);
  await page.screenshot({ path: `public/icons/${file}` });
  await page.close();
  console.log(`wrote public/icons/${file}`);
}
await browser.close();
