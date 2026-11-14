// Counting practice time for the streak and the daily goal.
// Every 15 seconds, if the app is on screen, you are in a lesson, review or the Scratchpad,
// and you have touched it in the last minute, 15 seconds are added to today.

import { isPracticeRoute } from "../routes";
import { dayKey } from "./dates";
import { addActivity } from "./progress";
import { updateProgress } from "./store";

const TICK_SECONDS = 15;
const IDLE_AFTER_MS = 60_000;

let lastInteraction = 0;

/** Start counting practice time. Call once, when the app starts. */
export function startActivityTracking(): void {
  const touched = () => {
    lastInteraction = Date.now();
  };
  for (const event of ["pointerdown", "keydown", "scroll", "input"]) {
    window.addEventListener(event, touched, { passive: true, capture: true });
  }
  setInterval(() => {
    const visible = document.visibilityState === "visible";
    const recent = Date.now() - lastInteraction < IDLE_AFTER_MS;
    if (visible && recent && isPracticeRoute(window.location.hash)) {
      updateProgress((progress) => addActivity(progress, dayKey(new Date()), TICK_SECONDS));
    }
  }, TICK_SECONDS * 1000);
}
