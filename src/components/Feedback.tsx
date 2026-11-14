import type { ComponentChildren } from "preact";
import { Html } from "./Html";

interface FeedbackProps {
  correct: boolean;
  verdict?: string; // overrides the default "Right." or "Not this one."
  explainHtml: string;
  children?: ComponentChildren;
}

/** The result of an answer: a plain verdict, then the explanation. Announced to screen readers. */
export function Feedback({ correct, verdict, explainHtml, children }: FeedbackProps) {
  return (
    <div class={`feedback ${correct ? "is-correct" : "is-wrong"}`} role="status">
      <p class="feedback-verdict">
        <span class="feedback-mark" aria-hidden="true">
          {correct ? "✓" : "✗"}
        </span>
        {verdict ?? (correct ? "Right." : "Not this one.")}
      </p>
      {children}
      <Html html={explainHtml} />
    </div>
  );
}
