import { useEffect, useState } from "preact/hooks";
import { useActiveEditor } from "./active-editor";

/** The keys that are slow to reach on a phone keyboard. `back` steps the cursor back inside a pair. */
const KEYS: readonly { label: string; text: string; back?: number; name: string }[] = [
  { label: "Tab", text: "    ", name: "Indent" },
  { label: "( )", text: "()", back: 1, name: "Brackets" },
  { label: "[ ]", text: "[]", back: 1, name: "Square brackets" },
  { label: "{ }", text: "{}", back: 1, name: "Braces" },
  { label: ":", text: ":", name: "Colon" },
  { label: '"', text: '"', name: "Double quote" },
  { label: "'", text: "'", name: "Single quote" },
  { label: "=", text: "=", name: "Equals" },
  { label: "_", text: "_", name: "Underscore" },
  { label: ".", text: ".", name: "Dot" },
  { label: "#", text: "#", name: "Hash" },
];

/** Distance from the bottom of the window to the top of the on-screen keyboard, in pixels. */
function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setOffset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return offset;
}

/**
 * A row of coding keys that sits just above the phone keyboard while an editor has focus.
 * Buttons act on pointer-down and cancel the default, so the editor keeps focus and the keyboard stays open.
 */
export function KeyboardBar() {
  const editor = useActiveEditor();
  const offset = useKeyboardOffset();
  if (!editor) return null;

  const press = (event: Event, action: () => void) => {
    event.preventDefault();
    action();
  };

  return (
    <div class="keyboard-bar" role="toolbar" aria-label="Coding keys" style={{ bottom: `${offset}px` }}>
      <div class="keyboard-keys">
        {KEYS.map((key) => (
          <button
            type="button"
            key={key.label}
            class="kb-key"
            aria-label={key.name}
            onPointerDown={(event) => press(event, () => editor.insert(key.text, key.back))}
            onClick={(event) => event.preventDefault()}
          >
            {key.label}
          </button>
        ))}
        <button
          type="button"
          class="kb-key"
          onPointerDown={(event) => press(event, editor.undo)}
          onClick={(event) => event.preventDefault()}
        >
          Undo
        </button>
      </div>
      {editor.run && (
        <button
          type="button"
          class="kb-key kb-run"
          onPointerDown={(event) => press(event, () => editor.run?.())}
          onClick={(event) => event.preventDefault()}
        >
          Run
        </button>
      )}
    </div>
  );
}
