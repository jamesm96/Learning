import { useState } from "preact/hooks";
import { course, findExercise } from "../content/course";
import { shuffle } from "../grading/grading";
import { recordAnswer } from "../progress/progress";
import { buzz } from "../progress/settings-effects";
import { updateProgress } from "../progress/store";
import { CardSession } from "./CardSession";
import { ReviewCardBody } from "./ReviewSession";

/** Exercises in one drill session. */
export const DRILL_SIZE = 5;

/** Record a practice answer. Drills and the bug hunt count towards your record, but not towards spaced review. */
function recordPractice(id: string, correct: boolean): void {
  buzz(correct);
  updateProgress((p) => recordAnswer(p, id, correct, new Date()));
}

/** A drill: five random exercises from one topic. */
export function DrillSession({ topicId }: { topicId: string }) {
  const topic = course.practice.drills.find((file) => file.id === topicId);
  const [queue] = useState(() => {
    const ids = (topic?.steps ?? []).flatMap((step) => (step.kind === "exercise" ? [step.exercise.id] : []));
    return shuffle(ids).slice(0, DRILL_SIZE);
  });

  return (
    <CardSession
      eyebrow={`Drill: ${topic?.title ?? "unknown topic"}`}
      queue={queue}
      closeHref="#/practice"
      closeLabel="Stop the drill, back to Practice"
      onAnswer={recordPractice}
      renderCard={(id, onAnswer) => <ReviewCardBody id={id} onAnswer={onAnswer} />}
      emptyTitle="No drills here"
      emptyText="This topic has no exercises yet."
      doneText="Run it again for a different five. Each drill picks at random."
    />
  );
}

/** One bug-hunt snippet: fix it, then name the cause. */
export function BugSession({ exerciseId }: { exerciseId: string }) {
  const exists = findExercise(exerciseId) !== undefined;
  return (
    <CardSession
      eyebrow="Bug hunt"
      queue={exists ? [exerciseId] : []}
      closeHref="#/practice"
      closeLabel="Stop, back to Practice"
      onAnswer={recordPractice}
      renderCard={(id, onAnswer) => <ReviewCardBody id={id} onAnswer={onAnswer} />}
      emptyTitle="Snippet not found"
      emptyText="It may have been removed from the bug hunt."
      doneText="Worth logging in your bug journal if the cause was new to you."
    />
  );
}
