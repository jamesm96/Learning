import type { ComponentChildren } from "preact";
import { highlightPython, type Token } from "../content/highlight";

interface CodeBlockProps {
  code?: string;
  label?: string;
  plain?: boolean; // true for program output: no syntax colours
  lineNumbers?: boolean; // useful when a traceback refers to line numbers
  children?: ComponentChildren; // used instead of code when parts need marking up, as in fill-the-gap
}

/** A block of code that scrolls sideways inside itself and never wraps. Focusable so it can scroll by keyboard. */
export function CodeBlock({ code, label = "Code", plain = false, lineNumbers = false, children }: CodeBlockProps) {
  let content: ComponentChildren = children;
  if (code !== undefined) {
    const tokens = plain ? [{ text: code, className: "" }] : highlightPython(code);
    content = lineNumbers ? <NumberedLines tokens={tokens} /> : <Tokens tokens={tokens} />;
  }
  return (
    <pre class={`code ${plain ? "is-output" : ""} ${lineNumbers ? "has-line-numbers" : ""}`} tabIndex={0} aria-label={label}>
      <code>{content}</code>
    </pre>
  );
}

/** Coloured tokens as spans. */
function Tokens({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, index) =>
        token.className ? (
          <span key={index} class={token.className}>
            {token.text}
          </span>
        ) : (
          token.text
        ),
      )}
    </>
  );
}

/** Tokens grouped into lines, each with its number in a gutter (drawn by CSS, so it is not copied with the code). */
function NumberedLines({ tokens }: { tokens: Token[] }) {
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1]!.push({ text: part, className: token.className });
    });
  }
  return (
    <>
      {lines.map((line, index) => (
        <span class="code-line" key={index}>
          <Tokens tokens={line} />
          {"\n"}
        </span>
      ))}
    </>
  );
}
