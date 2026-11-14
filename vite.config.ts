import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";
import { contentPlugin } from "./content-plugin.ts";

// GitHub Pages serves the site from /<repo-name>/, so the deploy workflow
// sets BASE_PATH. Locally it is "/".
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  define: {
    // Shown on the Me screen, so you can tell which build is on your phone.
    __APP_VERSION__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? "dev"),
  },
  plugins: [
    preact(),
    contentPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Code Literacy",
        short_name: "Code Literacy",
        description: "Learn to read, judge and debug the code AI writes.",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#11161D",
        theme_color: "#11161D",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache the whole app shell so it opens offline after the first visit.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
        // Python (about 10 MB) is not part of install. It is cached the first time you press Run.
        globIgnores: ["pyodide/**"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/pyodide/"),
            handler: "CacheFirst",
            options: {
              cacheName: "pyodide",
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
