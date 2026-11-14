# Code Literacy

A phone-first app for learning to read, judge and debug the code that AI writes.
Python first, with bridges to C# and C++.

It is a Progressive Web App: a website that installs to your home screen, opens
full-screen like an app, and works offline. There are no accounts and no server.
Your progress stays on your device.

**Status:** phase 0. The four-tab shell installs and runs; lessons arrive in phase 1.

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
| `npm run icons` | Regenerate the PNG icons from `public/icons/icon.svg` |

The first time you run `npm run e2e`, install the test browsers with
`npx playwright install chromium webkit`.

## How it is deployed

Every push to `main` runs `.github/workflows/deploy.yml`, which installs, tests,
builds and publishes to GitHub Pages. One-time setup on github.com:
**Settings → Pages → Source: GitHub Actions**.

## Where things are

```
src/
  main.tsx          entry point: registers the service worker, renders the app
  app.tsx           the shell: current screen plus the tab bar
  tabs.ts           the four tabs and how they map to the URL (pure, tested)
  screens/          one file per tab
  components/       small shared pieces (tab bar, icons)
  styles/           design tokens (colours, fonts) and layout
e2e/                end-to-end tests on emulated phones
public/icons/       app icons
```

Why things are built this way: see [DECISIONS.md](DECISIONS.md).
