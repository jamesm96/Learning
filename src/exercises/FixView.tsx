import { useMemo, useState } from "preact/hooks";
import type { FixExercise } from "../content/schema";
import { shuffle } from "../grading/grading";
import { Feedback } from "../components/Feedback";
import { Html } from "../components/Html";
import { BugForm } from "../components/BugForm";
import { addBug } from "../progress/progress";
import { updateProgress } from "../progress/store";
import { CodeTask, type TaskOutcome } from "./CodeTask";

interface FixViewProps {
  exercise: FixExercise;
  onAnswer: (correct: boolean) => void;
}

/** Fix the bug: make the code pass its hidden checks, then name the cause in one line. */
export function FixView({ exercise, onAnswer }: FixViewProps) {
  const [outcome, setOutcome] = useState<TaskOutcome | null>(null);
  const [cause, setCause] = useState<string | null>(null);
  const options = useMemo(() => shuffle(exercise.cause.options), [exercise]);
  const [logging, setLogging] = useState<"no" | "form" | "saved">("no");
  const causeRight = cause === exercise.cause.answer;

  const pickCause = (optionId: string) => {
    if (cause) return;
    setCause(optionId);
    onAnswer(Boolean(outcome?.solved) && optionId === exercise.cause.answer);
  };

  return (
    <div class="exercise">
      <p class="exercise-tag">Fix the bug</p>
      {exercise.symptomHtml && (
        <p class="exercise-question">
          Symptom: <span dangerouslySetInnerHTML={{ __html: exercise.symptomHtml }} />
        </p>
      )}
      <CodeTask code={exercise.code} check={exercise.check} solution={exercise.solution} onDone={setOutcome} />

      {outcome && (
        <fieldset class="cause-question">
          <legend>{outcome.solved ? "Fixed. In one line, what was the cause?" : "What was the cause?"}</legend>
          <ul class="options">
            {options.map((option) => {
              const isAnswer = option.id === exercise.cause.answer;
              const isPicked = option.id === cause;
              let state = "";
              if (cause && isAnswer) state = "is-answer";
              else if (cause && isPicked) state = "is-wrong";
              return (
                <li key={option.id}>
                  <button type="button" class={`option ${state}`} onClick={() => pickCause(option.id)} disabled={cause !== null}>
                    <Html html={option.html} class="option-text" />
                    {cause && isAnswer && <span class="option-note">Cause</span>}
                    {cause && isPicked && !isAnswer && <span class="option-note">Your answer</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {cause && <Feedback correct={causeRight} explainHtml={exercise.explainHtml} />}

      {cause && logging === "no" && (
        <button type="button" class="link-button" onClick={() => setLogging("form")}>
          Log this bug
        </button>
      )}
      {logging === "form" && (
        <BugForm
          initial={{
            symptom: plainText(exercise.symptomHtml ?? ""),
            cause: plainText(exercise.cause.options.find((option) => option.id === exercise.cause.answer)?.html ?? ""),
            howFound: "",
          }}
          onCancel={() => setLogging("no")}
          onSave={(draft) => {
            const entry = { id: `bug-${Date.now().toString(36)}`, ...draft, createdAt: new Date().toISOString(), exerciseId: exercise.id };
            updateProgress((p) => addBug(p, entry));
            setLogging("saved");
          }}
        />
      )}
      {logging === "saved" && (
        <p class="run-note" role="status">
          Saved to your bug journal, on the Me tab.
        </p>
      )}
    </div>
  );
}

/** Turn trusted content HTML into plain text, for the journal. */
function plainText(html: string): string {
  return new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
}
