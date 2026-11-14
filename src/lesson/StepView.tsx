import type { Exercise, Step } from "../content/schema";
import { Html } from "../components/Html";
import { ChoiceView } from "../exercises/ChoiceView";
import { ClozeView } from "../exercises/ClozeView";
import { DiffView } from "../exercises/DiffView";
import { EditView } from "../exercises/EditView";
import { FixView } from "../exercises/FixView";
import { GitView } from "../exercises/GitView";
import { ParsonsView } from "../exercises/ParsonsView";
import { PredictView } from "../exercises/PredictView";
import { ShapeView } from "../exercises/ShapeView";
import { SplitView } from "../exercises/SplitView";
import { TracebackView } from "../exercises/TracebackView";
import { ExplainBack } from "./ExplainBack";

interface StepViewProps {
  lessonId: string;
  step: Step;
  onAnswer: (exerciseId: string, correct: boolean) => void;
}

/** One step of a lesson: reading text, an exercise with optional text above it, or "explain it back". */
export function StepView({ lessonId, step, onAnswer }: StepViewProps) {
  if (step.kind === "read") {
    return <Html html={step.html} />;
  }
  if (step.kind === "explain") {
    return <ExplainBack lessonId={lessonId} modelHtml={step.modelHtml} />;
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
    case "shape":
      return <ShapeView exercise={exercise} onAnswer={onAnswer} />;
    case "parsons":
      return <ParsonsView exercise={exercise} onAnswer={onAnswer} />;
    case "split":
      return <SplitView exercise={exercise} onAnswer={onAnswer} />;
    case "diff":
      return <DiffView exercise={exercise} onAnswer={onAnswer} />;
    case "git":
      return <GitView exercise={exercise} onAnswer={onAnswer} />;
  }
}
