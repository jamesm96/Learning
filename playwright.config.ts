import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build, on emulated phones.
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:4173" },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 15"] } },
    { name: "pixel", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
