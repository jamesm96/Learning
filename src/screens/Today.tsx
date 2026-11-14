import { course } from "../content/course";
import { Placeholder } from "../components/Placeholder";
import { nextStop } from "../progress/progress";
import { useProgress } from "../progress/store";
import { lessonHash } from "../routes";

/** Today: the default screen. Pick up the next lesson where you left off. */
export function TodayScreen() {
  const progress = useProgress();
  const stop = nextStop(progress, course);

  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Today</p>
        <h1>Read the code before you trust it.</h1>
      </header>

      {stop ? (
        <section class="continue-card" aria-labelledby="continue-heading">
          <h2 id="continue-heading" class="continue-label">
            {stop.step === 0 ? "Next lesson" : "Continue"}
          </h2>
          <p class="continue-title">{stop.lessonTitle}</p>
          <p class="muted">
            {stop.moduleLabel} · step {stop.step + 1} of {stop.stepCount}
          </p>
        </section>
      ) : (
        <section class="continue-card">
          <h2 class="continue-label">All caught up</h2>
          <p>You have finished every lesson written so far. More modules are on the way.</p>
        </section>
      )}

      <Placeholder title="Review" phase={4}>
        Up to ten cards due today, from exercises you have already done.
      </Placeholder>
      <Placeholder title="Streak and goal" phase={4}>
        Days with at least five minutes of practice, and a 15-minute daily goal.
      </Placeholder>

      {stop && (
        <div class="primary-action">
          <a class="button-primary" href={lessonHash(stop.moduleId, stop.lessonId)}>
            {stop.step === 0 ? "Start lesson" : "Continue lesson"}
          </a>
        </div>
      )}
    </>
  );
}
