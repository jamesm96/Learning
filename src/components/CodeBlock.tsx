import type { ComponentChildren } from "preact";

interface CodeBlockProps {
  code?: string;
  label?: string;
  children?: ComponentChildren; // used instead of code when parts need marking up, as in fill-the-gap
}

/** A block of code that scrolls sideways inside itself and never wraps. Focusable so it can scroll by keyboard. */
export function CodeBlock({ code, label = "Code", children }: CodeBlockProps) {
  return (
    <pre class="code" tabIndex={0} aria-label={label}>
      <code>{children ?? code}</code>
    </pre>
  );
}
