interface ProgressBarProps {
  done: number;
  total: number;
  label: string; // for example "lessons done"
}

/** A thin bar with the numbers written beside it, so the meaning never depends on the bar alone. */
export function ProgressBar({ done, total, label }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div class="progress-row">
      <div class="progress-track" aria-hidden="true">
        <div class="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span class="progress-text">
        {done} of {total} {label}
      </span>
    </div>
  );
}
