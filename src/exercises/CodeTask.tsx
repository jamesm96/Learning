import { useState } from "preact/hooks";
import { describeCheck, type CheckVerdict } from "../grading/check-result";
import { useRun } from "../python/useRun";
import { CodeEditor } from "../editor/CodeEditor";
import { CodeBlock } from "../components/CodeBlock";
import { RunButtons } from "../components/RunButtons";
import { RunOutput } from "../components/RunOutput";

/** How the task ended: solved (and whether on the first run), or the solution was shown. */
export interface TaskOutcome {
  solved: boolean;
  firstRun: boolean;
}

interface CodeTaskProps {
  code: string;
  check: string;
  solution: string;
  onDone: (outcome: TaskOutcome) => void;
}

const RUNS_BEFORE_SOLUTION = 2; // failed runs before "Show the solution" appears

/** Edit code until its hidden check passes. After two failed runs the solution can be shown. */
export function CodeTask({ code, check, solution, onDone }: CodeTaskProps) {
  const [current, setCurrent] = useState(code);
  const [resets, setResets] = useState(0);
  const [runs, setRuns] = useState(0);
  const [verdict, setVerdict] = useState<CheckVerdict | null>(null);
  const [finished, setFinished] = useState<"solved" | "shown" | null>(null);
  const state = useRun();

  const run = async () => {
    if (finished) return;
    const result = await state.run(current, check);
    if (!result) return; // Python could not load; RunOutput explains
    const next = describeCheck(result);
    setVerdict(next);
    setRuns(runs + 1);
    if (next.passed) {
      setFinished("solved");
      onDone({ solved: true, firstRun: runs === 0 });
    }
  };

  const showSolution = () => {
    setFinished("shown");
    onDone({ solved: false, firstRun: false });
  };

  const reset = () => {
    setCurrent(code);
    setResets(resets + 1);
    setVerdict(null);
    state.clear();
  };

  return (
    <div class="code-task">
      {finished !== "shown" && (
        <CodeEditor key={resets} value={code} onChange={setCurrent} onRun={run} label="Code to change" />
      )}
      {!finished && <RunButtons state={state} onRun={run} onReset={reset} />}

      {state.running || state.loadFailed ? <RunOutput state={state} /> : null}
      {!state.running && state.result && (
        <>
          {state.result.stdout && <CodeBlock code={state.result.stdout.replace(/\n+$/, "")} label="Output" plain />}
          {verdict?.showTraceback && state.result.error && (
            <CodeBlock code={state.result.error.traceback.replace(/\n+$/, "")} label="Error" plain />
          )}
        </>
      )}

      {verdict && !finished && (
        <p class="task-verdict" role="status">
          <span class="feedback-mark is-wrong-mark" aria-hidden="true">
            ✗
          </span>
          {verdict.message}
        </p>
      )}

      {!finished && runs >= RUNS_BEFORE_SOLUTION && (
        <button type="button" class="link-button" onClick={showSolution}>
          Show the solution
        </button>
      )}

      {finished === "shown" && (
        <>
          <p class="field-label">One solution</p>
          <CodeBlock code={solution} label="Solution" />
        </>
      )}
    </div>
  );
}
