import { useEffect, useRef, useState } from "preact/hooks";
import { findExercise, findLessonById } from "../content/course";
import { dayKey } from "../progress/dates";
import { recordAnswer, recordReview } from "../progress/progress";
import { dueCards, RECALL_PREFIX } from "../progress/review";
import { buzz } from "../progress/settings-effects";
import { getProgress, updateProgress } from "../progress/store";
import { ExerciseView } from "../lesson/StepView";
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
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const focus = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    focus.current?.focus({ preventScroll: true });
  }, [index]);

  const id = queue[index];
  const finished = index >= queue.length;
  const answered = id !== undefined && results[id] !== undefined;

  const answer = (cardId: string, correct: boolean) => {
    if (results[cardId] !== undefined) return; // only the first answer moves the card
    buzz(correct);
    const now = new Date();
    setResults({ ...results, [cardId]: correct });
    updateProgress((p) => {
      const recorded = cardId.startsWith(RECALL_PREFIX) ? p : recordAnswer(p, cardId, correct, now);
      return recordReview(recorded, cardId, correct, dayKey(now));
    });
  };

  if (queue.length === 0) {
    return (
      <div class="player">
        <article class="player-step lesson-done" ref={focus} tabIndex={-1}>
          <p class="eyebrow">Review</p>
          <h1>Nothing due</h1>
          <p class="muted">Cards come back on a schedule: 1, 3, 7, 14, then 30 days after you get them right.</p>
        </article>
        <footer class="player-actions">
          <a class="button-primary" href="#/today">
            Back to Today
          </a>
        </footer>
      </div>
    );
  }

  if (finished) {
    const right = Object.values(results).filter(Boolean).length;
    return (
      <div class="player">
        <article class="player-step lesson-done" ref={focus} tabIndex={-1}>
          <p class="eyebrow">Review done</p>
          <h1>
            {right} of {queue.length} right
          </h1>
          <p class="muted">Right answers come back later each time. The ones you missed come back tomorrow.</p>
        </article>
        <footer class="player-actions">
          <a class="button-primary" href="#/today">
            Back to Today
          </a>
        </footer>
      </div>
    );
  }

  return (
    <div class="player">
      <header class="player-top">
        <a class="player-close" href="#/today" aria-label="Stop reviewing, back to Today">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </a>
        <div class="player-progress">
          <span class="player-count">
            Card {index + 1} of {queue.length}
          </span>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style={{ width: `${((index + 1) / queue.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <article class="player-step" key={id} ref={focus} tabIndex={-1} aria-label={`Review card ${index + 1}`}>
        <ReviewCardBody id={id!} onAnswer={(correct) => answer(id!, correct)} />
      </article>

      <footer class="player-actions">
        <button type="button" class="button-primary" onClick={() => setIndex(index + 1)} disabled={!answered}>
          {answered ? (index === queue.length - 1 ? "Finish review" : "Next card") : "Answer to continue"}
        </button>
      </footer>
    </div>
  );
}

/** One card: a recall card, or the exercise itself, labelled with the lesson it came from. */
function ReviewCardBody({ id, onAnswer }: { id: string; onAnswer: (correct: boolean) => void }) {
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
