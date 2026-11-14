import type { RunState } from "../python/useRun";

interface RunButtonsProps {
  state: RunState;
  onRun: () => void;
  runLabel?: string;
  onReset?: () => void;
  disabled?: boolean;
}

/** Run (or Stop while running), plus an optional Reset. */
export function RunButtons({ state, onRun, runLabel = "Run", onReset, disabled = false }: RunButtonsProps) {
  return (
    <div class="run-buttons">
      {state.running ? (
        <button type="button" class="button-secondary" onClick={state.stop}>
          Stop
        </button>
      ) : (
        <button type="button" class="button-run" onClick={onRun} disabled={disabled}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path d="M7 5l12 7-12 7z" />
          </svg>
          {runLabel}
        </button>
      )}
      {onReset && !state.running && (
        <button type="button" class="link-button" onClick={onReset}>
          Reset
        </button>
      )}
    </div>
  );
}
