import { useState } from "preact/hooks";
import { BugForm } from "../../components/BugForm";
import { addBug, deleteBug, updateBug } from "../../progress/progress";
import { updateProgress, useProgress } from "../../progress/store";

/** The bug journal: what you saw, what was wrong, and how you found it. Patterns show up over time. */
export function BugJournal() {
  const progress = useProgress();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <section class="panel" aria-labelledby="journal-heading">
      <h2 id="journal-heading">Bug journal</h2>
      <p class="muted">Every bug you log, from the course or your own tools. After a few weeks, read it back: the same causes keep turning up.</p>

      {adding ? (
        <BugForm
          initial={{ symptom: "", cause: "", howFound: "" }}
          onCancel={() => setAdding(false)}
          onSave={(draft) => {
            updateProgress((p) => addBug(p, { id: `bug-${Date.now().toString(36)}`, ...draft, createdAt: new Date().toISOString() }));
            setAdding(false);
          }}
        />
      ) : (
        <button type="button" class="button-secondary" onClick={() => setAdding(true)}>
          Log a bug
        </button>
      )}

      {progress.bugs.length === 0 && !adding && <p class="run-note">No bugs logged yet. "Log this bug" appears after every Fix the bug exercise.</p>}

      <ul class="bug-list">
        {progress.bugs.map((bug) =>
          editing === bug.id ? (
            <li key={bug.id}>
              <BugForm
                initial={bug}
                saveLabel="Save changes"
                onCancel={() => setEditing(null)}
                onSave={(draft) => {
                  updateProgress((p) => updateBug(p, bug.id, draft));
                  setEditing(null);
                }}
              />
            </li>
          ) : (
            <li key={bug.id} class="bug-entry">
              <p class="run-note">{new Date(bug.createdAt).toLocaleDateString()}</p>
              <dl>
                <dt>Symptom</dt>
                <dd>{bug.symptom || "–"}</dd>
                <dt>Cause</dt>
                <dd>{bug.cause || "–"}</dd>
                <dt>How I found it</dt>
                <dd>{bug.howFound || "–"}</dd>
              </dl>
              <div class="apply-actions">
                <button type="button" class="link-button" onClick={() => setEditing(bug.id)}>
                  Edit
                </button>
                <button
                  type="button"
                  class="link-button"
                  onClick={() => {
                    if (window.confirm("Delete this journal entry? This cannot be undone.")) updateProgress((p) => deleteBug(p, bug.id));
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
