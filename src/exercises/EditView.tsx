import { useState } from "preact/hooks";
import type { EditExercise } from "../content/schema";
import { Feedback } from "../components/Feedback";
import { CodeTask, type TaskOutcome } from "./CodeTask";

interface EditViewProps {
  exercise: EditExercise;
  onAnswer: (correct: boolean) => void;
}

/** Edit and run: change the code until it meets the goal. Hidden checks decide. */
export function EditView({ exercise, onAnswer }: EditViewProps) {
  const [outcome, setOutcome] = useState<TaskOutcome | null>(null);

  const done = (result: TaskOutcome) => {
    setOutcome(result);
    onAnswer(result.solved && result.firstRun);
  };

  return (
    <div class="exercise">
      <p class="exercise-tag">Edit and run</p>
      <p class="exercise-question" dangerouslySetInnerHTML={{ __html: exercise.goalHtml }} />
      <CodeTask code={exercise.code} check={exercise.check} solution={exercise.solution} onDone={done} />
      {outcome && (
        <Feedback
          correct={outcome.solved}
          verdict={outcome.solved ? "Goal met." : "Here is one way. Read it line by line against yours."}
          explainHtml={exercise.explainHtml}
        />
      )}
    </div>
  );
}
