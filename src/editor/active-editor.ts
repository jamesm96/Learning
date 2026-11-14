// Which editor has focus, so the coding keyboard bar knows where to type and what Run should do.
// The editor registers plain functions, so the bar never has to load CodeMirror itself.

import { useEffect, useState } from "preact/hooks";

export interface ActiveEditor {
  insert: (text: string, cursorBack?: number) => void;
  undo: () => void;
  run?: () => void;
}

let active: ActiveEditor | null = null;
const listeners = new Set<(editor: ActiveEditor | null) => void>();

/** Called by an editor when it gains or loses focus. */
export function setActiveEditor(editor: ActiveEditor | null): void {
  active = editor;
  // While typing, hide the bottom bars so the keyboard bar has the space (see lesson.css).
  document.body.classList.toggle("is-editing", editor !== null);
  for (const listener of listeners) listener(active);
}

/** The editor that has focus, or null. The component re-renders when it changes. */
export function useActiveEditor(): ActiveEditor | null {
  const [current, setCurrent] = useState(active);
  useEffect(() => {
    listeners.add(setCurrent);
    setCurrent(active);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);
  return current;
}
