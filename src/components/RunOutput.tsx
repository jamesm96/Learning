import { usePythonStatus, TIME_LIMIT_MS } from "../python/runner";
import type { RunState } from "../python/useRun";
import { CodeBlock } from "./CodeBlock";

interface RunOutputProps {
  state: RunState;
  showError?: boolean; // false when the caller explains errors itself
}

/** What a run printed, any error, and the loading or stopped messages. */
export function RunOutput({ state, showError = true }: RunOutputProps) {
  const status = usePythonStatus();
  const { result } = state;

  if (state.running && status === "loading") {
    return (
      <div class="python-loading" role="status">
        <p>Loading Python, about 10 MB, once only.</p>
        <div class="progress-track is-indeterminate" aria-hidden="true">
          <div class="progress-fill" />
        </div>
      </div>
    );
  }
  if (state.loadFailed) {
    return (
      <p class="run-note" role="status">
        Python could not load. It needs a connection the first time; after that it works offline.
      </p>
    );
  }
  if (!result) return null;

  if (result.timedOut) {
    return (
      <p class="run-note" role="status">
        Stopped. The code ran for more than {TIME_LIMIT_MS / 1000} seconds, or Stop was pressed. Check for a loop that never ends.
      </p>
    );
  }

  const printed = result.stdout.replace(/\n+$/, "");
  const error = showError ? result.error : null;
  return (
    <div class="run-output" role="status">
      {printed && <CodeBlock code={printed} label="Output" plain />}
      {error && <CodeBlock code={error.traceback.replace(/\n+$/, "")} label="Error" plain />}
      {!printed && !error && <p class="run-note">Ran with no output.</p>}
    </div>
  );
}
