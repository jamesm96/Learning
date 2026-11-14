import { useMemo, useState } from "preact/hooks";
import { BLANK } from "../content/constants";
import type { ClozeExercise } from "../content/schema";
import { gradeCloze, shuffle, type ClozeResult } from "../grading/grading";
import { CodeBlock } from "../components/CodeBlock";
import { Feedback } from "../components/Feedback";

interface ClozeViewProps {
  exercise: ClozeExercise;
  onAnswer: (correct: boolean) => void;
}

/** Fill the gap: pick an option for each blank in the code, then check. */
export function ClozeView({ exercise, onAnswer }: ClozeViewProps) {
  const choices = useMemo(() => exercise.blanks.map((blank) => shuffle(blank.options)), [exercise]);
  const [picks, setPicks] = useState<(string | null)[]>(() => exercise.blanks.map(() => null));
  const [result, setResult] = useState<ClozeResult | null>(null);
  const many = exercise.blanks.length > 1;

  const choose = (blankIndex: number, option: string) => {
    if (result) return;
    setPicks(picks.map((pick, index) => (index === blankIndex ? option : pick)));
  };

  const check = () => {
    const graded = gradeCloze(exercise, picks);
    setResult(graded);
    onAnswer(graded.correct);
  };

  // Split the code at each ___ and put the current pick (or an empty slot) between the pieces.
  const pieces = exercise.code.split(BLANK);
  const code = pieces.flatMap((piece, index) => {
    if (index === pieces.length - 1) return [piece];
    const pick = picks[index];
    const slot = (
      <mark class={`blank ${pick ? "is-filled" : ""}`} key={index}>
        {pick ?? (many ? `[${index + 1}]` : "___")}
      </mark>
    );
    return [piece, slot];
  });

  return (
    <div class="exercise">
      <p class="exercise-tag">Fill the gap</p>
      <p class="exercise-question" dangerouslySetInnerHTML={{ __html: exercise.promptHtml }} />
      <CodeBlock label="Code with gaps">{code}</CodeBlock>

      {choices.map((options, blankIndex) => (
        <fieldset class="blank-choices" key={blankIndex} disabled={result !== null}>
          <legend>{many ? `Gap ${blankIndex + 1}` : "Fill the gap with"}</legend>
          <div class="chips">
            {options.map((option) => (
              <button
                type="button"
                class="chip"
                key={option}
                aria-pressed={picks[blankIndex] === option}
                onClick={() => choose(blankIndex, option)}
              >
                <code>{option}</code>
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      {!result && (
        <button type="button" class="button-secondary" onClick={check} disabled={picks.some((pick) => pick === null)}>
          Check
        </button>
      )}

      {result && (
        <Feedback correct={result.correct} explainHtml={exercise.explainHtml}>
          {!result.correct && (
            <ul class="feedback-blanks">
              {exercise.blanks.map((blank, index) =>
                result.blanks[index] ? null : (
                  <li key={index}>
                    {many ? `Gap ${index + 1}` : "The gap"} should be <code>{blank.answer}</code>.
                  </li>
                ),
              )}
            </ul>
          )}
        </Feedback>
      )}
    </div>
  );
}
