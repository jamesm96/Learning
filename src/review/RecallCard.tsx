import { useState } from "preact/hooks";
import type { Lesson } from "../content/schema";
import { Html } from "../components/Html";

interface RecallCardProps {
  lesson: Lesson;
  moduleLabel: string;
  onAnswer: (correct: boolean) => void;
}

/** A recall card: explain a lesson from memory, then compare with its recap and say honestly whether you had it. */
export function RecallCard({ lesson, moduleLabel, onAnswer }: RecallCardProps) {
  const [shown, setShown] = useState(false);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const recap = lesson.steps.find((step) => step.kind === "explain");

  const decide = (hadIt: boolean) => {
    setVerdict(hadIt);
    onAnswer(hadIt);
  };

  return (
    <div class="exercise">
      <p class="review-source">{moduleLabel}</p>
      <p class="exercise-tag">Recall</p>
      <h2 class="recall-title">{lesson.title}</h2>
      <p class="exercise-question">Explain this lesson from memory, in two sentences. Say it out loud or in your head.</p>

      {!shown ? (
        <button type="button" class="button-secondary" onClick={() => setShown(true)}>
          Show the model answer
        </button>
      ) : (
        <>
          <div class="model-answer">
            <p class="field-label">One way to say it</p>
            {recap?.kind === "explain" && <Html html={recap.modelHtml} />}
          </div>
          {verdict === null ? (
            <fieldset class="self-assess">
              <legend>Did yours cover the same ground?</legend>
              <div class="chips">
                <button type="button" class="chip" onClick={() => decide(true)}>
                  Yes, I had it
                </button>
                <button type="button" class="chip" onClick={() => decide(false)}>
                  Not yet
                </button>
              </div>
            </fieldset>
          ) : (
            <p class="task-verdict" role="status">
              {verdict ? "Noted. It comes back later." : "Noted. It comes back tomorrow."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
