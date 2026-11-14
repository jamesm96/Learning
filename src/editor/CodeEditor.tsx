import { useEffect, useRef, useState } from "preact/hooks";
import { setActiveEditor } from "./active-editor";
import type { EditorView } from "./codemirror";

interface CodeEditorProps {
  value: string; // the starting code. To reset the editor, give the component a new `key`.
  onChange: (code: string) => void;
  label?: string;
  onRun?: () => void;
}

/** An editable Python editor. CodeMirror is loaded the first time one appears. */
export function CodeEditor({ value, onChange, label = "Code editor", onRun }: CodeEditorProps) {
  const parent = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Keep the latest callbacks without recreating the editor on every render.
  const latest = useRef({ onChange, onRun });
  latest.current = { onChange, onRun };

  useEffect(() => {
    let cancelled = false;
    void import("./codemirror").then(({ createEditor, insertText, undo }) => {
      if (cancelled || !parent.current) return;
      const editor = createEditor(parent.current, {
        doc: value,
        label,
        onChange: (code) => latest.current.onChange(code),
        onRun: () => latest.current.onRun?.(),
        onFocusChange: (focused) => {
          if (!focused) {
            setActiveEditor(null);
            return;
          }
          setActiveEditor({
            insert: (text, cursorBack) => insertText(editor, text, cursorBack),
            undo: () => {
              undo(editor);
              editor.focus();
            },
            run: latest.current.onRun ? () => latest.current.onRun?.() : undefined,
          });
        },
      });
      view.current = editor;
      setLoaded(true);
    });
    return () => {
      cancelled = true;
      if (view.current?.hasFocus) setActiveEditor(null);
      view.current?.destroy();
      view.current = null;
    };
  }, []);

  return (
    <div class="editor" ref={parent}>
      {!loaded && (
        <pre class="code" aria-busy="true">
          <code>{value}</code>
        </pre>
      )}
    </div>
  );
}
