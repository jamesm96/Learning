import { Placeholder } from "../components/Placeholder";

/** Today: the default screen. Continue the next lesson or do a short review. */
export function TodayScreen() {
  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Today</p>
        <h1>Read the code before you trust it.</h1>
      </header>
      <Placeholder title="Continue" phase={1}>
        The next step of your current lesson. One tap picks up where you left off.
      </Placeholder>
      <Placeholder title="Review" phase={4}>
        Up to ten cards due today, from exercises you have already done.
      </Placeholder>
      <Placeholder title="Streak and goal" phase={4}>
        Days with at least five minutes of practice, and a 15-minute daily goal.
      </Placeholder>
      <div class="primary-action">
        <button type="button" class="button-primary" disabled>
          Continue lesson
        </button>
      </div>
    </>
  );
}
