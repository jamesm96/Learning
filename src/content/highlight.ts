// Syntax colouring for Python, using the same parser and token names as the CodeMirror editor.
// Pure: code in, coloured pieces out. The build uses it for code in lesson text; the app uses it for exercise code.

import { classHighlighter, highlightCode } from "@lezer/highlight";
import { parser } from "@lezer/python";

/** A run of text, and the CSS class for its colour ("" for plain text). */
export interface Token {
  text: string;
  className: string;
}

/** Split Python code into coloured tokens. Line breaks are kept as "\n" tokens. */
export function highlightPython(code: string): Token[] {
  const tokens: Token[] = [];
  highlightCode(
    code,
    parser.parse(code),
    classHighlighter,
    (text, className) => tokens.push({ text, className }),
    () => tokens.push({ text: "\n", className: "" }),
  );
  return tokens;
}

/** Highlighted code as an HTML string, with every character escaped. */
export function highlightPythonToHtml(code: string): string {
  return highlightPython(code)
    .map(({ text, className }) => {
      const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return className ? `<span class="${className}">${escaped}</span>` : escaped;
    })
    .join("");
}
