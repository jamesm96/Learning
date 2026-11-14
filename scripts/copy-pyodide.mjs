// Copy the Pyodide runtime into public/pyodide/ so the app serves Python from its own
// address: no third-party calls, and it can be cached for offline use.
// Runs automatically after `npm install` (see "postinstall" in package.json).
import { copyFileSync, mkdirSync } from "node:fs";

const files = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
mkdirSync("public/pyodide", { recursive: true });
for (const file of files) {
  copyFileSync(`node_modules/pyodide/${file}`, `public/pyodide/${file}`);
}
console.log(`Copied ${files.length} Pyodide files to public/pyodide/`);
