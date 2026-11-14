import { useState } from "preact/hooks";
import { findExercise, findLessonById } from "../content/course";
import { dayKey } from "../progress/dates";
import { recordAnswer, recordReview } from "../progress/progress";
import { dueCards, RECALL_PREFIX } from "../progress/review";
import { buzz } from "../progress/settings-effects";
import { getProgress, updateProgress } from "../progress/store";
import { ExerciseView } from "../lesson/StepView";
import { CardSession } from "./CardSession";
import { RecallCard } from "./RecallCard";

/** Cards shown on Today, and the most a full review session holds. */
export const REVIEW_LIMIT = 10;

/** True if a review card still exists in the course (lessons and exercises can be removed). */
export function cardExists(id: string): boolean {
  if (id.startsWith(RECALL_PREFIX)) return findLessonById(id.slice(RECALL_PREFIX.length)) !== undefined;
  return findExercise(id) !== undefined;
}

interface ReviewSessionProps {
  limit?: number;
}

/** A review session: due cards one at a time. Right moves a card up a box; wrong sends it back to box 1. */
export function ReviewSession({ limit = REVIEW_LIMIT }: ReviewSessionProps) {
  // The queue is fixed when the session starts, so answering a card does not reshuffle it.
  const [queue] = useState(() => dueCards(getProgress().review, dayKey(new Date()), limit, cardExists));

  const answer = (id: string, correct: boolean) => {
    buzz(correct);
    const now = new Date();
    updateProgress((p) => {
      const recorded = id.startsWith(RECALL_PREFIX) ? p : recordAnswer(p, id, correct, now);
      return recordReview(recorded, id, correct, dayKey(now));
    });
  };

  return (
    <CardSession
      eyebrow="Review"
      queue={queue}
      closeHref="#/today"
      closeLabel="Stop reviewing, back to Today"
      onAnswer={answer}
      renderCard={(id, onAnswer) => <ReviewCardBody id={id} onAnswer={onAnswer} />}
      emptyTitle="Nothing due"
      emptyText="Cards come back on a schedule: 1, 3, 7, 14, then 30 days after you get them right."
      doneText="Right answers come back later each time. The ones you missed come back tomorrow."
    />
  );
}

/** One card: a recall card, or the exercise itself, labelled with where it came from. */
export function ReviewCardBody({ id, onAnswer }: { id: string; onAnswer: (correct: boolean) => void }) {
  if (id.startsWith(RECALL_PREFIX)) {
    const found = findLessonById(id.slice(RECALL_PREFIX.length))!;
    return <RecallCard lesson={found.lesson} moduleLabel={found.module.label} onAnswer={onAnswer} />;
  }
  const found = findExercise(id)!;
  return (
    <>
      <p class="review-source">
        {found.module.label} · {found.lesson.title}
      </p>
      <ExerciseView exercise={found.exercise} onAnswer={onAnswer} />
    </>
  );
}
