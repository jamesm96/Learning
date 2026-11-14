# Code Literacy

A phone-first app for learning to read, judge and debug the code that AI writes.
Python first, with bridges to C# and C++.

It is a Progressive Web App: a website that installs to your home screen, opens
full-screen like an app, and works offline. There are no accounts and no server.
Your progress stays on your device.

**Status:** phase 3. The whole course is playable: Start, Modules 1 to 5 and What next, with all twelve exercise types, a Git simulator, real files for Module 5, and "explain it back" at the end of every lesson.

## Install it on your phone

Open the site link on your phone, then:

- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap the menu, then **Install app**.

It then opens from its own icon, full-screen, with no browser bar.
The version shown at the bottom of the **Me** tab tells you which build you have.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer (this repo pins 26 in `.nvmrc`).

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).
To try it on your phone over Wi-Fi, run `npm run dev -- --host` and open the
network address it prints. Installing to the home screen only works over HTTPS,
so use the deployed site for that.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start a local server that reloads as you edit |
| `npm run build` | Type-check, then build the static site into `dist/` |
| `npm run preview` | Serve the built `dist/` folder locally |
| `npm test` | Run the unit tests (Vitest) |
| `npm run e2e` | Run the end-to-end tests on emulated iPhone and Pixel (Playwright) |
| `npm run check:content` | Check every lesson, and run every runnable exercise in real Python |
| `npm run icons` | Regenerate the PNG icons from `public/icons/icon.svg` |

The first time you run `npm run e2e`, install the test browsers with
`npx playwright install chromium webkit`.

## Writing lessons

See [content/README.md](content/README.md): the lesson format, every exercise type,
the sample files and the Git scenario format. `npm run check:content` checks it all.

## How it is deployed

Every push to `main` runs `.github/workflows/deploy.yml`, which installs, tests,
builds and publishes to GitHub Pages. One-time setup on github.com:
**Settings → Pages → Source: GitHub Actions**.

## Where things are

```
content/            the course: course.yaml, then one folder per module
  modules/01-data/  module.yaml plus one Markdown file per lesson
content-plugin.ts   turns content/ into data for the app at build time, checking it in Python
python-node.ts      runs Python (Pyodide) in Node for those checks
src/
  main.tsx          entry point: loads progress, registers the service worker, renders the app
  app.tsx           the shell: current screen plus the tab bar
  tabs.ts, routes.ts  where you are in the app, read from the URL (pure, tested)
  content/          content schema, lesson parser and course loader (pure, tested)
  progress/         what you have done, and saving it on the device
  grading/          marking answers, comparing output, reading tracebacks (pure, tested)
  python/           running Python: the harness, the Web Worker and the page-side runner
  editor/           the code editor and the coding keyboard bar
  git/              the Git simulator (pure, tested)
  lesson/           the lesson player
  exercises/        one component per exercise type
  screens/          one file per screen
  components/       small shared pieces (tab bar, icons)
  styles/           design tokens (colours, fonts) and layout
e2e/                end-to-end tests on emulated phones
public/icons/       app icons
```

Why things are built this way: see [DECISIONS.md](DECISIONS.md).
