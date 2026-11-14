// Settings that act on the page: the colour theme, and a short vibration after an answer.

import type { Settings } from "./progress";
import { getProgress, onProgressChange } from "./store";

/** Apply the theme: "system" follows the phone; "light" and "dark" override it (see tokens.css). */
export function applyTheme(theme: Settings["theme"]): void {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

/** Keep the theme in step with settings, from now on. Call once, when the app starts. */
export function startSettingsEffects(): void {
  applyTheme(getProgress().settings.theme);
  onProgressChange((progress) => applyTheme(progress.settings.theme));
}

/** A light vibration after an answer, where the phone supports it and haptics are on. Right is one tap; wrong is two. */
export function buzz(correct: boolean): void {
  if (!getProgress().settings.haptics || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(correct ? 12 : [12, 60, 12]);
}
