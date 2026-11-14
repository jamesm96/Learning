import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

interface CardSessionProps {
  eyebrow: string; // for example "Review" or "Drill: Data shapes"
  queue: string[]; // card ids, fixed for the session
  closeHref: string;
  closeLabel: string; // read by screen readers, for example "Stop reviewing, back to Today"
  renderCard: (id: string, onAnswer: (correct: boolean) => void) => ComponentChildren;
  onAnswer: (id: string, correct: boolean) => void; // called once per card, on the first answer
  emptyTitle: string;
  emptyText: string;
  doneText: string;
}

/** A run of cards, one at a time: used by review sessions, drills and the bug hunt, so they all behave the same. */
export function CardSession(props: CardSessionProps) {
  const { queue } = props;
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const focus = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    focus.current?.focus({ preventScroll: true });
  }, [index]);

  const id = queue[index];
  const answered = id !== undefined && results[id] !== undefined;

  const answer = (cardId: string, correct: boolean) => {
    if (results[cardId] !== undefined) return; // only the first answer counts
    setResults({ ...results, [cardId]: correct });
    props.onAnswer(cardId, correct);
  };

  if (queue.length === 0 || index >= queue.length) {
    const right = Object.values(results).filter(Boolean).length;
    return (
      <div class="player">
        <article class="player-step lesson-done" ref={focus} tabIndex={-1}>
          <p class="eyebrow">{props.eyebrow}</p>
          <h1>{queue.length === 0 ? props.emptyTitle : `${right} of ${queue.length} right`}</h1>
          <p class="muted">{queue.length === 0 ? props.emptyText : props.doneText}</p>
        </article>
        <footer class="player-actions">
          <a class="button-primary" href={props.closeHref}>
            Done
          </a>
        </footer>
      </div>
    );
  }

  return (
    <div class="player">
      <header class="player-top">
        <a class="player-close" href={props.closeHref} aria-label={props.closeLabel}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </a>
        <div class="player-progress">
          <span class="player-count">
            {props.eyebrow} · {index + 1} of {queue.length}
          </span>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style={{ width: `${((index + 1) / queue.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <article class="player-step" key={id} ref={focus} tabIndex={-1} aria-label={`${props.eyebrow}, card ${index + 1} of ${queue.length}`}>
        {props.renderCard(id!, (correct) => answer(id!, correct))}
      </article>

      <footer class="player-actions">
        <button type="button" class="button-primary" onClick={() => setIndex(index + 1)} disabled={!answered}>
          {answered ? (index === queue.length - 1 ? "Finish" : "Next") : "Answer to continue"}
        </button>
      </footer>
    </div>
  );
}
