import type { Ref } from "preact";
import { nextLessonInModule } from "../content/course";
import type { Lesson, Module } from "../content/schema";
import { lessonScore } from "../progress/progress";
import { useProgress } from "../progress/store";
import { lessonHash, moduleHash } from "../routes";

interface LessonDoneProps {
  module: Module;
  lesson: Lesson;
  focusRef: Ref<HTMLElement>;
  onRestart: () => void;
}

/** Shown after the last step: the first-try score and where to go next. */
export function LessonDone({ module, lesson, focusRef, onRestart }: LessonDoneProps) {
  const progress = useProgress();
  const score = lessonScore(progress, lesson);
  const next = nextLessonInModule(module, lesson.id);

  return (
    <div class="player">
      <article class="player-step lesson-done" ref={focusRef} tabIndex={-1}>
        <p class="eyebrow">Lesson complete</p>
        <h1>{lesson.title}</h1>
        {score.answered > 0 && (
          <p class="lesson-score">
            {score.right} of {score.answered} right first time.
          </p>
        )}
        <p class="muted">
          Before moving on, explain the idea to yourself in two sentences. If you can't, go through it again.
        </p>
        <button type="button" class="link-button" onClick={onRestart}>
          Go through it again
        </button>
      </article>

      <footer class="player-actions player-actions-stacked">
        {next ? (
          <a class="button-primary" href={lessonHash(module.id, next.id)}>
            Next: {next.title}
          </a>
        ) : (
          <a class="button-primary" href="#/learn">
            Back to the course map
          </a>
        )}
        {next && (
          <a class="button-quiet" href={moduleHash(module.id)}>
            Back to {module.title}
          </a>
        )}
      </footer>
    </div>
  );
}
