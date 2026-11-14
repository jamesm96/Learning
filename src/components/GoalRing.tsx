interface GoalRingProps {
  seconds: number;
  goal: number;
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A ring that fills towards the daily goal, with the minutes written inside so it never relies on the drawing alone. */
export function GoalRing({ seconds, goal }: GoalRingProps) {
  const minutes = Math.floor(seconds / 60);
  const goalMinutes = Math.round(goal / 60);
  const fraction = Math.min(1, seconds / goal);

  return (
    <div class="goal-ring" role="img" aria-label={`${minutes} of ${goalMinutes} minutes practised today`}>
      <svg viewBox="0 0 80 80" width="88" height="88" aria-hidden="true">
        <circle class="goal-track" cx="40" cy="40" r={RADIUS} />
        <circle
          class="goal-fill"
          cx="40"
          cy="40"
          r={RADIUS}
          stroke-dasharray={CIRCUMFERENCE}
          stroke-dashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <span class="goal-text" aria-hidden="true">
        <strong>{minutes}</strong>
        <small>of {goalMinutes} min</small>
      </span>
    </div>
  );
}
