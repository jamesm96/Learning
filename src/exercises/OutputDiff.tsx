import type { OutputComparison } from "../grading/compare-output";

interface OutputDiffProps {
  comparison: OutputComparison;
}

/** Real output beside the prediction, line by line. Differences are marked with words and an underline, not colour alone. */
export function OutputDiff({ comparison }: OutputDiffProps) {
  return (
    <div class="output-diff">
      <p class="field-label">Real output, and your prediction</p>
      <ol class="diff-lines">
        {comparison.lines.map((line, index) => (
          <li key={index} class={line.same ? "is-same" : "is-different"}>
            <code class="diff-real">{line.expected || " "}</code>
            {!line.same && (
              <span class="diff-yours">
                <span class="diff-label">You: </span>
                <code>
                  {line.predicted.slice(0, line.firstDifference)}
                  <mark>{line.predicted.slice(line.firstDifference) || "(missing)"}</mark>
                </code>
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
