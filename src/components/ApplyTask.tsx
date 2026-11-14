import { useState } from "preact/hooks";
import { updateApplyTask } from "../progress/progress";
import { updateProgress, useProgress } from "../progress/store";

interface ApplyTaskProps {
  id: string;
  tier: string;
  html: string;
}

/** Turn trusted content HTML into plain text, for copying. */
function plainText(html: string): string {
  return new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
}

/** An Apply task for the desk: tick it off, keep notes, and copy the task to take it elsewhere. */
export function ApplyTask({ id, tier, html }: ApplyTaskProps) {
  const progress = useProgress();
  const state = progress.apply[id] ?? { done: false, notes: "" };
  const [notesOpen, setNotesOpen] = useState(state.notes !== "");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${tier}: ${plainText(html)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <li class={`apply-task ${state.done ? "is-done" : ""}`}>
      <label class="check-row">
        <input
          type="checkbox"
          checked={state.done}
          onChange={(event) => updateProgress((p) => updateApplyTask(p, id, { done: event.currentTarget.checked }))}
        />
        <span>
          <span class="apply-tier">{tier}</span>
          <span class="apply-text" dangerouslySetInnerHTML={{ __html: html }} />
        </span>
      </label>
      <div class="apply-actions">
        <button type="button" class="link-button" onClick={() => setNotesOpen(!notesOpen)} aria-expanded={notesOpen}>
          {notesOpen ? "Hide notes" : state.notes ? "Notes" : "Add notes"}
        </button>
        <button type="button" class="link-button" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy task"}
        </button>
      </div>
      {notesOpen && (
        <textarea
          class="text-input"
          rows={3}
          aria-label={`Notes for: ${plainText(html)}`}
          value={state.notes}
          onInput={(event) => {
            const notes = event.currentTarget.value;
            updateProgress((p) => updateApplyTask(p, id, { notes }));
          }}
        />
      )}
    </li>
  );
}
