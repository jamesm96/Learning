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

## 7. Self-hosted fonts, Latin subset only
- **What:** Space Grotesk, Inter and JetBrains Mono from `@fontsource` packages, imported in `src/styles/fonts.css`. Approved in phase 1.
- **Why:** the brief forbids third-party calls at runtime, so fonts ship inside the app and are precached for offline use. Only the Latin subset and the weights in use are imported, about 150 KB, downloaded once.
- **Rejected:** Google Fonts links (a runtime call to Google); system fonts only (generic look).

## 8. Config files are not type-checked by `tsc`
- **What:** `tsconfig.json` includes `src` and `e2e` only.
- **Why:** `vite.config.ts` and `playwright.config.ts` read `process.env`, which would need `@types/node` (another dependency). Vite and Playwright load and check those files themselves.
- **Rejected:** adding `@types/node` just for two config files. Revisit in phase 2, when the Node-side content validator will need it anyway.

## 9. Icons rendered from one SVG with Playwright
- **What:** `scripts/make-icons.mjs` screenshots `public/icons/icon.svg` at 192, 512, 512 maskable and 180 (Apple). The PNGs are committed.
- **Why:** reuses a tool already installed for testing.
- **Rejected:** `@vite-pwa/assets-generator` (another dependency for four images).

## 10. Content is built into the app by a Vite plugin
- **What:** `content-plugin.ts` reads `content/` at build time, validates it with Zod, renders Markdown to HTML with `marked`, and hands the app plain data through `import course from "virtual:course"`.
- **Why:** content mistakes stop the build instead of breaking on the phone. Zod, YAML and `marked` run only at build time, so none of them ship to the phone.
- **Rejected:** parsing Markdown in the browser (bigger download, errors found late); a script that writes a generated JSON file (one more file to keep in sync).

## 11. Content loading is pure; files are passed in
- **What:** `loadCourse(read)` takes a function that reads a file, rather than reading the disk itself. The plugin passes real files; tests pass an in-memory folder.
- **Why:** the same "keep the host at the edge" idea Module 2 teaches. It also keeps `node:fs` out of `src/`, so `@types/node` is still not needed.

## 12. Build-time files import with `.ts` extensions
- **What:** files the Vite config loads (`content-plugin.ts`, `src/content/*`) write `import ... from "./schema.ts"`. `tsconfig.json` allows this with `allowImportingTsExtensions`.
- **Why:** Vite 8 warns that its upcoming native config loader needs real file extensions. App code is bundled by Vite and keeps the shorter form.

## 13. Exercise answers are stored by id, and the first try is kept
- **What:** progress records each exercise by its id: attempts, whether the first try was right, and the last result. Lesson progress stores the step to resume at.
- **Why:** ids survive reordering and shuffled options. The first-try result is the honest score, and spaced review in phase 4 will need it.
- **Safety:** progress carries a version number. Unreadable or newer-version data is copied to a backup key, never silently deleted.

## 14. Predict exercises are self-assessed until phase 2
- **What:** for now you predict in your head, reveal the real output, and say whether you matched. Phase 2 adds typing a prediction and running the code in Pyodide.
- **Why:** the "predict first" habit matters from lesson one. The content format already stores the expected output, so phase 2 only changes the component, not the lessons.

## 15. Lessons hide the tab bar
- **What:** a lesson fills the screen, with a close button at the top and Back/Next at the bottom.
- **Why:** more room for code on a small screen, and the main action stays in the thumb zone. Closing returns to the module page, and your step is saved.
