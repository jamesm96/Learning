import type { Exercise, Step } from "../content/schema";
import { Html } from "../components/Html";
import { ChoiceView } from "../exercises/ChoiceView";
import { ClozeView } from "../exercises/ClozeView";
import { EditView } from "../exercises/EditView";
import { FixView } from "../exercises/FixView";
import { PredictView } from "../exercises/PredictView";
import { TracebackView } from "../exercises/TracebackView";

interface StepViewProps {
  step: Step;
  onAnswer: (exerciseId: string, correct: boolean) => void;
}

/** One step of a lesson: reading text, or an exercise with optional text above it. */
export function StepView({ step, onAnswer }: StepViewProps) {
  if (step.kind === "read") {
    return <Html html={step.html} />;
  }
  if (step.kind === "explain") {
    return <Html html={step.modelHtml} />; // replaced by the explain-it-back component later in this phase
  }
  return (
    <>
      {step.introHtml && <Html html={step.introHtml} />}
      <ExerciseView exercise={step.exercise} onAnswer={(correct) => onAnswer(step.exercise.id, correct)} />
    </>
  );
}

interface ExerciseViewProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
}

/** Pick the component for each exercise type. */
function ExerciseView({ exercise, onAnswer }: ExerciseViewProps) {
  switch (exercise.type) {
    case "predict":
      return <PredictView exercise={exercise} onAnswer={onAnswer} />;
    case "choice":
      return <ChoiceView exercise={exercise} onAnswer={onAnswer} />;
    case "cloze":
      return <ClozeView exercise={exercise} onAnswer={onAnswer} />;
    case "edit":
      return <EditView exercise={exercise} onAnswer={onAnswer} />;
    case "fix":
      return <FixView exercise={exercise} onAnswer={onAnswer} />;
    case "traceback":
      return <TracebackView exercise={exercise} onAnswer={onAnswer} />;
  }
}
