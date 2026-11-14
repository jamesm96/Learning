import { useMemo, useState } from "preact/hooks";
import type { ChoiceExercise } from "../content/schema";
import { gradeChoice, shuffle } from "../grading/grading";
import { CodeBlock } from "../components/CodeBlock";
import { Feedback } from "../components/Feedback";
import { Html } from "../components/Html";

interface ChoiceViewProps {
  exercise: ChoiceExercise;
  onAnswer: (correct: boolean) => void;
}

/** Multiple choice. Options are shuffled each time; one tap answers, then the right option is marked. */
export function ChoiceView({ exercise, onAnswer }: ChoiceViewProps) {
  const options = useMemo(() => shuffle(exercise.options), [exercise]);
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;

  const pick = (optionId: string) => {
    if (answered) return;
    setPicked(optionId);
    onAnswer(gradeChoice(exercise, optionId));
  };

  return (
    <div class="exercise">
      <p class="exercise-tag">{exercise.tag}</p>
      <p class="exercise-question" dangerouslySetInnerHTML={{ __html: exercise.questionHtml }} />
      {exercise.code && <CodeBlock code={exercise.code} />}

      <ul class="options" aria-label="Options">
        {options.map((option) => {
          const isAnswer = option.id === exercise.answer;
          const isPicked = option.id === picked;
          let state = "";
          if (answered && isAnswer) state = "is-answer";
          else if (answered && isPicked) state = "is-wrong";

          return (
            <li key={option.id}>
              <button type="button" class={`option ${state}`} onClick={() => pick(option.id)} disabled={answered}>
                <Html html={option.html} class="option-text" />
                {answered && isAnswer && <span class="option-note">Correct answer</span>}
                {answered && isPicked && !isAnswer && <span class="option-note">Your answer</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && <Feedback correct={picked === exercise.answer} explainHtml={exercise.explainHtml} />}
    </div>
  );
}
