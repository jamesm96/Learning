import { useEffect, useRef, useState } from "preact/hooks";
import type { Lesson, Module } from "../content/schema";
import { completeLesson, recordAnswer, saveStep } from "../progress/progress";
import { requestPersistentStorage } from "../progress/storage";
import { updateProgress, useProgress } from "../progress/store";
import { moduleHash } from "../routes";
import { LessonDone } from "./LessonDone";
import { StepView } from "./StepView";
import { useSwipe } from "./useSwipe";

interface LessonPlayerProps {
  module: Module;
  lesson: Lesson;
}

/** Plays a lesson one step at a time. Exercises must be answered before moving on. */
export function LessonPlayer({ module, lesson }: LessonPlayerProps) {
  const progress = useProgress();
  const saved = progress.lessons[lesson.id];
  const [index, setIndex] = useState(() => (saved && !saved.completedAt ? Math.min(saved.step, lesson.steps.length - 1) : 0));
  const [finished, setFinished] = useState(false);
  const stepRef = useRef<HTMLElement>(null);

  const step = lesson.steps[index];
  const isLast = index === lesson.steps.length - 1;
  const answered = step?.kind !== "exercise" || progress.answers[step.exercise.id] !== undefined;

  // Move focus and scroll to the new step, so screen readers and long steps start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
    stepRef.current?.focus({ preventScroll: true });
  }, [index, finished]);

  const goTo = (next: number) => {
    setIndex(next);
    updateProgress((p) => saveStep(p, lesson.id, next));
  };

  const goNext = () => {
    if (!answered) return;
    if (isLast) {
      updateProgress((p) => completeLesson(p, lesson.id, new Date()));
      setFinished(true);
    } else {
      goTo(index + 1);
    }
  };

  const goBack = () => {
    if (index > 0) goTo(index - 1);
  };

  const onAnswer = (exerciseId: string, correct: boolean) => {
    requestPersistentStorage();
    updateProgress((p) => recordAnswer(p, exerciseId, correct, new Date()));
  };

  const swipe = useSwipe(goNext, goBack);

  if (finished) {
    return <LessonDone module={module} lesson={lesson} focusRef={stepRef} onRestart={() => { setFinished(false); goTo(0); }} />;
  }
  if (!step) return null;

  return (
    <div class="player">
      <header class="player-top">
        <a class="player-close" href={moduleHash(module.id)} aria-label={`Close lesson, back to ${module.title}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </a>
        <div class="player-progress">
          <span class="player-count">
            Step {index + 1} of {lesson.steps.length}
          </span>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style={{ width: `${((index + 1) / lesson.steps.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <article
        class="player-step"
        key={index}
        ref={stepRef}
        tabIndex={-1}
        aria-label={`${lesson.title}, step ${index + 1}`}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        {index === 0 && <h1 class="player-title">{lesson.title}</h1>}
        <StepView step={step} onAnswer={onAnswer} />
      </article>

      <footer class="player-actions">
        <button type="button" class="button-back" onClick={goBack} disabled={index === 0} aria-label="Previous step">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" class="button-primary" onClick={goNext} disabled={!answered}>
          {answered ? (isLast ? "Finish lesson" : "Next") : "Answer to continue"}
        </button>
      </footer>
    </div>
  );
}
