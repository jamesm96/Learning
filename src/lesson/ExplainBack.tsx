import { useState } from "preact/hooks";
import { Html } from "../components/Html";
import { saveExplanation } from "../progress/progress";
import { updateProgress, useProgress } from "../progress/store";

interface ExplainBackProps {
  lessonId: string;
  modelHtml: string;
}

/** The last step of every lesson: explain the idea in two sentences, then compare with a model. Saved, never graded. */
export function ExplainBack({ lessonId, modelHtml }: ExplainBackProps) {
  const progress = useProgress();
  const [text, setText] = useState(progress.explanations[lessonId]?.text ?? "");
  const [compared, setCompared] = useState(false);

  const change = (next: string) => {
    setText(next);
    updateProgress((p) => saveExplanation(p, lessonId, next, new Date()));
  };

  return (
    <div class="exercise">
      <p class="exercise-tag">Explain it back</p>
      <label class="field">
        <span class="exercise-question">Explain this lesson in two sentences, as if to a colleague.</span>
        <textarea class="text-input" rows={4} value={text} onInput={(event) => change(event.currentTarget.value)} />
      </label>
      <p class="run-note">Saved as you type. Nobody marks it.</p>
      {!compared ? (
        <button type="button" class="button-secondary" onClick={() => setCompared(true)}>
          Compare with a model answer
        </button>
      ) : (
        <div class="model-answer">
          <p class="field-label">One way to say it</p>
          <Html html={modelHtml} />
          <p class="run-note">If yours missed something important, it is worth a second read of the lesson.</p>
        </div>
      )}
    </div>
  );
}
