// Everything CodeMirror needs, in one file that is loaded only when an editor first appears.
// That keeps the editor (about 100 KB) out of the first page load.

import { defaultKeymap, history, historyKeymap, indentWithTab, undo } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { indentUnit, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { classHighlighter } from "@lezer/highlight";

export { undo };
export type { EditorView };

export interface EditorOptions {
  doc: string;
  label: string; // read by screen readers
  onChange: (code: string) => void;
  onFocusChange: (focused: boolean) => void;
  onRun?: () => void; // Ctrl/Cmd+Enter, for desk sessions
}

/** Create an editable Python editor inside `parent`. */
export function createEditor(parent: HTMLElement, options: EditorOptions): EditorView {
  const runKey = options.onRun
    ? [{ key: "Mod-Enter", run: () => (options.onRun?.(), true) }]
    : [];

  const state = EditorState.create({
    doc: options.doc,
    extensions: [
      lineNumbers(),
      history(),
      python(),
      indentUnit.of("    "),
      syntaxHighlighting(classHighlighter), // the same tok-* colour classes as read-only code
      keymap.of([...runKey, indentWithTab, ...defaultKeymap, ...historyKeymap]),
      // Phones: no autocorrect, capitals or spellcheck in code.
      EditorView.contentAttributes.of({
        autocorrect: "off",
        autocapitalize: "off",
        spellcheck: "false",
        "aria-label": options.label,
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) options.onChange(update.state.doc.toString());
        if (update.focusChanged) options.onFocusChange(update.view.hasFocus);
      }),
    ],
  });
  return new EditorView({ state, parent });
}

/** Type text at the cursor, replacing any selection. With `cursorBack`, step the cursor back inside a pair like "()". */
export function insertText(view: EditorView, text: string, cursorBack = 0): void {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length - cursorBack },
    scrollIntoView: true,
  });
  view.focus();
}
