# Decisions

One short entry per significant choice: what, why, and what was rejected.

## 1. Installable web app (PWA), not a native app
- **What:** a static website with a web manifest and service worker, built with `vite-plugin-pwa`.
- **Why:** one build for iPhone, Android and desktop; installs from a link; no app store or developer account; free to host.
- **Rejected:** native, React Native, Flutter (all need app stores and more tooling).

## 2. Hosting on GitHub Pages from a public repo
- **What:** a GitHub Actions workflow builds and deploys on every push to `main`.
- **Why:** free on a public repo, and the repo doubles as a portfolio piece. The owner chose this in phase 0.
- **Rejected:** Cloudflare Pages and Netlify (only needed if the repo had to be private on a free plan).

## 3. Preact 10, not Preact 11
- **What:** pinned `preact@10.29.8` with `@preact/preset-vite`.
- **Why:** 10.x is the long-standing stable line that the Vite preset and most examples target. Preact 11 came out in late September 2026 and is only weeks old.
- **Rejected:** Preact 11 for now; revisit once it has settled. React (larger, no benefit here).

## 4. Tabs live in the URL hash (`#/learn`)
- **What:** the current tab is read from `location.hash`; tabs are plain `<a href="#/learn">` links.
- **Why:** reload and Back work, links are accessible by default, and GitHub Pages needs no server-side rewrites for hash URLs.
- **Rejected:** a router library (a dependency for four screens); path URLs like `/learn` (need a 404.html redirect hack on Pages).

## 5. Base path set at build time
- **What:** `vite.config.ts` reads `BASE_PATH`; the workflow sets it to `/<repo-name>/`. Locally it is `/`.
- **Why:** Pages serves project sites from a sub-folder. Taking it from the repo name means renaming the repo needs no code change.

## 6. Pinned exact versions, slightly behind latest
- **What:** every dependency is pinned exactly (`--save-exact`), chosen from releases at least about two weeks old (for example Vite 8.3.5, not 8.3.8 from three days earlier).
- **Why:** reproducible builds; brand-new releases occasionally ship regressions.
- **Also:** TypeScript 6.0.3 rather than 7.x, because some tooling still assumes the 6.x compiler API.

## 7. System fonts until web fonts are approved
- **What:** the font stacks name Space Grotesk, Inter and JetBrains Mono (from the source course) but fall back to system fonts, which is what you see today.
- **Why:** the brief forbids third-party calls at runtime, so the fonts must be self-hosted, which means adding font files or `@fontsource` packages. That is a new dependency, so it waits for approval.

## 8. Config files are not type-checked by `tsc`
- **What:** `tsconfig.json` includes `src` and `e2e` only.
- **Why:** `vite.config.ts` and `playwright.config.ts` read `process.env`, which would need `@types/node` (another dependency). Vite and Playwright load and check those files themselves.
- **Rejected:** adding `@types/node` just for two config files. Revisit in phase 2, when the Node-side content validator will need it anyway.

## 9. Icons rendered from one SVG with Playwright
- **What:** `scripts/make-icons.mjs` screenshots `public/icons/icon.svg` at 192, 512, 512 maskable and 180 (Apple). The PNGs are committed.
- **Why:** reuses a tool already installed for testing.
- **Rejected:** `@vite-pwa/assets-generator` (another dependency for four images).
