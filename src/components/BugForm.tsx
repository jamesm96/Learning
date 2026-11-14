import { useState } from "preact/hooks";
import type { BugEntry } from "../progress/progress";

export type BugDraft = Pick<BugEntry, "symptom" | "cause" | "howFound">;

interface BugFormProps {
  initial: BugDraft;
  saveLabel?: string;
  onSave: (draft: BugDraft) => void;
  onCancel?: () => void;
}

/** The three questions of a bug journal entry: what you saw, what was wrong, and how you found it. */
export function BugForm({ initial, saveLabel = "Save to the journal", onSave, onCancel }: BugFormProps) {
  const [draft, setDraft] = useState<BugDraft>(initial);
  const field = (key: keyof BugDraft, label: string, hint: string) => (
    <label class="field">
      <span class="field-label">{label}</span>
      <textarea
        class="text-input"
        rows={2}
        placeholder={hint}
        value={draft[key]}
        onInput={(event) => setDraft({ ...draft, [key]: event.currentTarget.value })}
      />
    </label>
  );

  return (
    <form
      class="bug-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      {field("symptom", "Symptom", "What did you see? For example: every price came out as 0.0")}
      {field("cause", "Cause", "What was really wrong?")}
      {field("howFound", "How I found it", "Read the traceback, printed a value, checked the diff...")}
      <div class="run-buttons">
        <button type="submit" class="button-run" disabled={!draft.symptom.trim() && !draft.cause.trim()}>
          {saveLabel}
        </button>
        {onCancel && (
          <button type="button" class="link-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
