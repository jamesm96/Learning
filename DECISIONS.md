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

## 8. Node-only files are not type-checked by `tsc`
- **What:** `tsconfig.json` includes `src` and `e2e` only. The files that touch the disk or Node (`vite.config.ts`, `content-plugin.ts`, `python-node.ts`, `scripts/`) sit outside `src`.
- **Why:** checking them would need `@types/node`, another dependency. Vite and Node run them and fail loudly if they break, and the logic they call lives in `src`, where it is checked and tested.
- **Rejected:** `@types/node` for a handful of glue files.

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

## 14. Predict first, then run for real
- **What:** Run stays locked until you type a prediction, or choose to predict in your head. Then the code runs in Pyodide and your typed prediction is compared line by line, ignoring trailing spaces.
- **Why:** "predict before you run" is the habit the course trains. If Python cannot load (offline before first use), the output stored with the lesson is shown instead, and says so.

## 15. Lessons hide the tab bar
- **What:** a lesson fills the screen, with a close button at the top and Back/Next at the bottom.
- **Why:** more room for code on a small screen, and the main action stays in the thumb zone. Closing returns to the module page, and your step is saved.

## 16. Pyodide is hosted on our own site, and cached on first Run
- **What:** `scripts/copy-pyodide.mjs` copies Pyodide's files from `node_modules` into `public/pyodide/` after every install. The service worker caches them the first time Python loads.
- **Why:** no third-party calls at runtime, and it works offline after the first Run. It is not part of install, so the app itself stays small.
- **Version:** `pyodide@314.0.7`, which is Python 3.14. Pyodide now numbers versions after the Python they ship.

## 17. One Python harness for the phone and the build
- **What:** `src/python/harness.py` runs code in a fresh namespace, then any hidden check in the same namespace, and formats errors as Python does, minus its own frames. The Web Worker and the build both load it.
- **Why:** tracebacks and results are identical on the phone and in CI, so what the build verified is exactly what you see.
- **Note:** modules Python has already imported (for example `logging`'s settings) persist between runs in one session, as in a long-running tool. Lessons that depend on that reset it explicitly.

## 18. Every runnable piece of content is proved at build time
- **What:** `src/content/python-checks.ts` runs during the build: predict outputs must match, edit and fix exercises must fail before and pass after, traceback exercises must really raise. Traceback blocks in lesson text are run and replaced by their real traceback. Any problem stops the build. `npm run check:content` runs the same checks on their own.
- **Rejected:** tracebacks typed by hand (they go stale when Python changes); a separate CI-only step (the build already loads Pyodide).

## 19. Python runs in a Web Worker with a 5-second limit
- **What:** `runner.ts` starts the worker on first Run. The clock starts when the code starts, so loading Python never counts. On timeout or Stop the worker is ended; the next run starts a fresh one from cache.
- **Why:** a stuck loop must never freeze the app.

## 20. The editor loads on demand; read-only code does not need it
- **What:** CodeMirror (about 87 KB compressed) loads the first time an editor appears. Read-only code is coloured with the same Python parser and colour classes, without an editor.
- **Why:** first load stays fast, and code looks the same whether you are reading or editing it.

## 21. The coding keyboard bar
- **What:** while an editor has focus, a row of keys (Tab, brackets, quotes, `:`, `=`, `_`, `.`, `#`, Undo, Run) sits just above the phone keyboard, placed with the `visualViewport` API. Its buttons act on pointer-down and cancel the default, so the editor keeps focus and the keyboard stays up.
- **Why:** these keys are two or three taps deep on a phone keyboard.

## 22. Edit and fix exercises can show the solution
- **What:** after two failed runs, "Show the solution" appears. Showing it unlocks Next but does not count as right. For fix exercises, naming the cause correctly is part of getting it right.
- **Why:** you should never be stuck behind an exercise, and the record stays honest.

## 23. Modules 2 and 3 were drafted by helper agents
- **What:** two Claude sub-agents wrote the Module 2 and 3 lessons in parallel from the course page, to the same format and rules, while the app code was built. Every exercise passes the build-time Python checks, and the lessons were reviewed afterwards.
- **Why:** it halved the time for the longest part of the phase. The format and the checks make it safe to split the work.
