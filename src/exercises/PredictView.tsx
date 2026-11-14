import { useState } from "preact/hooks";
import type { PredictExercise } from "../content/schema";
import { CodeBlock } from "../components/CodeBlock";
import { Feedback } from "../components/Feedback";

interface PredictViewProps {
  exercise: PredictExercise;
  onAnswer: (correct: boolean) => void;
}

/**
 * Predict the output. For now: predict in your head, reveal the real output, then say honestly whether you matched.
 * Phase 2 adds typing the prediction and running the code in real Python.
 */
export function PredictView({ exercise, onAnswer }: PredictViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [matched, setMatched] = useState<boolean | null>(null);

  const assess = (didMatch: boolean) => {
    setMatched(didMatch);
    onAnswer(didMatch);
  };

  return (
    <div class="exercise">
      <p class="exercise-tag">Predict the output</p>
      <CodeBlock code={exercise.code} />

      {!revealed && (
        <>
          <p class="exercise-question">Decide exactly what this prints, line by line. Then reveal it.</p>
          <button type="button" class="button-secondary" onClick={() => setRevealed(true)}>
            Reveal output
          </button>
        </>
      )}

      {revealed && (
        <>
          <CodeBlock code={exercise.output} label="Output" />
          {matched === null && (
            <fieldset class="self-assess">
              <legend>Did your prediction match, every line?</legend>
              <div class="chips">
                <button type="button" class="chip" onClick={() => assess(true)}>
                  Yes, it matched
                </button>
                <button type="button" class="chip" onClick={() => assess(false)}>
                  No
                </button>
              </div>
            </fieldset>
          )}
          {matched !== null && (
            <Feedback
              correct={matched}
              verdict={matched ? "Right." : "Not this time. Find the line you missed."}
              explainHtml={exercise.explainHtml}
            >
              {exercise.hintHtml && (
                <p class="feedback-hint">
                  At your desk: <span dangerouslySetInnerHTML={{ __html: exercise.hintHtml }} />
                </p>
              )}
            </Feedback>
          )}
        </>
      )}
    </div>
  );
}
