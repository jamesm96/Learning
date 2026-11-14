// Check WCAG contrast for every text-on-background colour pair in both themes. Run: node scripts/check-contrast.mjs
import { readFileSync } from "node:fs";
const css = readFileSync("src/styles/tokens.css", "utf-8");
const block = (start) => { const i = css.indexOf(start); return css.slice(i, css.indexOf("}", i)); };
const vars = (text) => Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const light = vars(block(":root {"));
const dark = { ...light, ...vars(block(':root[data-theme="dark"]')) };
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [["ink","bg"],["ink","surface"],["muted","bg"],["muted","surface"],["muted","code-bg"],["accent","bg"],["accent","surface"],["accent","code-bg"],["accent-ink","accent"],["good","bg"],["bad","bg"],["good","surface"],["bad","surface"],["ink","code-bg"],["tok-keyword","code-bg"],["tok-string","code-bg"],["tok-comment","code-bg"],["tok-number","code-bg"],["tok-definition","code-bg"],["ink","mark-bg"]];
let fails = 0, min = 99;
for (const [name, theme] of [["light", light], ["dark", dark]]) for (const [fg, bg] of pairs) { const r = ratio(theme[fg], theme[bg]); min = Math.min(min, r); if (r < 4.5) { fails++; console.log("BELOW", name, fg, bg, r.toFixed(2)); } }
console.log(`${pairs.length * 2} pairs checked; lowest ${min.toFixed(2)}:1; ${fails} below 4.5:1`);
if (fails > 0) process.exit(1);
