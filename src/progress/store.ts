// One shared copy of progress for the whole app. Screens read it with useProgress()
// and change it with updateProgress(); every change is saved to the device.

import { useEffect, useState } from "preact/hooks";
import { emptyProgress, type Progress } from "./progress";
import { loadProgress, saveProgress } from "./storage";

let current: Progress = emptyProgress();
const listeners = new Set<(progress: Progress) => void>();

/** Load saved progress. Call once before the app first renders. */
export async function initProgress(): Promise<void> {
  current = await loadProgress();
}

/** Apply a change (one of the pure functions in progress.ts), tell every screen, and save. */
export function updateProgress(change: (progress: Progress) => Progress): void {
  current = change(current);
  for (const listener of listeners) listener(current);
  saveProgress(current).catch((error: unknown) => console.error("Could not save progress", error));
}

/** The current progress, for code outside components. */
export function getProgress(): Progress {
  return current;
}

/** Call `listener` after every change. Returns a function that stops listening. */
export function onProgressChange(listener: (progress: Progress) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Replace all progress, for example from a backup. */
export function replaceProgress(next: Progress): void {
  updateProgress(() => next);
}

/** The current progress. The component re-renders whenever it changes. */
export function useProgress(): Progress {
  const [progress, setProgress] = useState(current);
  useEffect(() => {
    listeners.add(setProgress);
    setProgress(current); // in case it changed between the first render and this effect
    return () => {
      listeners.delete(setProgress);
    };
  }, []);
  return progress;
}
