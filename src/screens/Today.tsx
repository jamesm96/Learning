import { course, findExercise, findLessonById } from "../content/course";
import { dayKey } from "../progress/dates";
import { nextStop } from "../progress/progress";
import { dueCards, RECALL_PREFIX } from "../progress/review";
import { currentStreak, DAILY_GOAL_SECONDS } from "../progress/streak";
import { useProgress } from "../progress/store";
import { cardExists, REVIEW_LIMIT } from "../review/ReviewSession";
import { lessonHash, reviewHash } from "../routes";
import { GoalRing } from "../components/GoalRing";

/** Cards in a "5-minute review": about a minute each. */
const SHORT_REVIEW = 5;

const TYPE_NAMES: Record<string, string> = {
  predict: "Predict",
  choice: "Question",
  cloze: "Fill the gap",
  edit: "Edit and run",
  fix: "Fix the bug",
  traceback: "Traceback",
  shape: "Shape it",
  parsons: "Reorder",
  diff: "Diff review",
  git: "Git",
};

/** Today: the streak and goal, what is due for review, and where to pick up the course. */
export function TodayScreen() {
  const progress = useProgress();
  const today = dayKey(new Date());
  const stop = nextStop(progress, course);
  const due = dueCards(progress.review, today, REVIEW_LIMIT, cardExists);
  const streak = currentStreak(progress.activity, today);
  const secondsToday = progress.activity[today] ?? 0;

  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Today</p>
        <h1>Read the code before you trust it.</h1>
      </header>

      <section class="today-stats" aria-label="Today's practice">
        <GoalRing seconds={secondsToday} goal={DAILY_GOAL_SECONDS} />
        <div class="streak">
          <p class="streak-number">
            {streak.days} {streak.days === 1 ? "day" : "days"}
          </p>
          <p class="muted">
            {streak.days === 0
              ? "Five minutes of practice starts a streak."
              : streak.todayDone
                ? "Today counts."
                : "Five minutes today keeps it going."}
          </p>
          {streak.forgivenDay && streak.days > 0 && <p class="run-note">One missed day this week, forgiven.</p>}
        </div>
      </section>

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
          <h2 class="continue-label">Course complete</h2>
          <p>Every lesson is done. Reviews keep it fresh, and the capstone is waiting at your desk.</p>
        </section>
      )}

      <section class="panel" aria-labelledby="review-heading">
        <h2 id="review-heading">Review</h2>
        {due.length === 0 ? (
          <p class="muted">Nothing due today. Cards come back 1, 3, 7, 14 and 30 days after you get them right.</p>
        ) : (
          <>
            <p class="muted">
              {due.length} {due.length === 1 ? "card is" : "cards are"} due{due.length === REVIEW_LIMIT ? ", showing the first ten" : ""}.
            </p>
            <ul class="due-list">
              {due.map((id) => (
                <li key={id}>{describeCard(id)}</li>
              ))}
            </ul>
            <div class="run-buttons">
              <a class="button-secondary" href={reviewHash(SHORT_REVIEW)}>
                5-minute review
              </a>
              {due.length > SHORT_REVIEW && (
                <a class="link-button" href={reviewHash()}>
                  Review all {due.length}
                </a>
              )}
            </div>
          </>
        )}
      </section>

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

/** A short label for a due card: its kind, and the lesson it came from. */
function describeCard(id: string): string {
  if (id.startsWith(RECALL_PREFIX)) {
    const found = findLessonById(id.slice(RECALL_PREFIX.length));
    return `Recall · ${found?.lesson.title ?? ""}`;
  }
  const found = findExercise(id);
  return found ? `${TYPE_NAMES[found.exercise.type] ?? "Exercise"} · ${found.lesson.title}` : id;
}
