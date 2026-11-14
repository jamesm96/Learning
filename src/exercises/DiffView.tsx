import { useState } from "preact/hooks";
import type { DiffExercise } from "../content/schema";
import { isChangeLine, markDiffReview, partners, type DiffReviewResult } from "../grading/diff-review";
import { Feedback } from "../components/Feedback";

interface DiffViewProps {
  exercise: DiffExercise;
  onAnswer: (correct: boolean) => void;
}

/** Review the diff: flag every changed line that does more than the task asked for. */
export function DiffView({ exercise, onAnswer }: DiffViewProps) {
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<DiffReviewResult | null>(null);
  const pairOf = partners(exercise.lines);

  const toggle = (index: number) => {
    if (result) return;
    const next = new Set(flagged);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setFlagged(next);
  };

  const check = () => {
    const marked = markDiffReview(exercise.lines, exercise.flags, flagged);
    setResult(marked);
    onAnswer(marked.correct);
  };

  /** The note under a line after checking. A missed pair is noted once, on the line the lesson listed. */
  const noteFor = (index: number): string => {
    if (!result) return flagged.has(index) ? "Flagged" : "";
    if (result.missed.includes(index)) return "Missed: this goes beyond the task";
    if (result.extra.includes(index)) return "Flagged, but this was part of the task";
    if (flagged.has(index)) return "Flagged, rightly";
    return "";
  };
  const shouldFlag = (index: number) => result !== null && (exercise.flags.includes(index) || exercise.flags.includes(pairOf[index]!));

  return (
    <div class="exercise">
      <p class="exercise-tag">Review the diff</p>
      <p class="exercise-question">
        The task: <span dangerouslySetInnerHTML={{ __html: exercise.taskHtml }} />
      </p>
      {!result && (
        <p class="run-note">Tap each changed line that goes beyond the task. For a changed line, either its - or its + will do. If every change belongs, flag nothing.</p>
      )}

      <div class="diff-view" role="group" aria-label="Diff">
        {exercise.lines.map((line, index) => {
          if (!isChangeLine(line)) {
            return (
              <pre key={index} class={`diff-line ${line.startsWith("@@") || /^(\+\+\+|---) /.test(line) ? "is-meta" : ""}`}>
                {line || " "}
              </pre>
            );
          }
          const isFlagged = flagged.has(index);
          const note = noteFor(index);
          return (
            <button
              type="button"
              key={index}
              class={`diff-line diff-change ${line[0] === "+" ? "is-added" : "is-removed"} ${isFlagged ? "is-flagged" : ""} ${shouldFlag(index) && !isFlagged ? "should-flag" : ""}`}
              aria-pressed={isFlagged}
              aria-label={`${line[0] === "+" ? "Added" : "Removed"}: ${line.slice(1).trim()}`}
              onClick={() => toggle(index)}
              disabled={result !== null}
            >
              <pre>{line}</pre>
              {note && <span class="option-note">{note}</span>}
            </button>
          );
        })}
      </div>

      {!result && (
        <button type="button" class="button-run" onClick={check}>
          {flagged.size === 0 ? "Nothing beyond the task" : `Check ${flagged.size} flagged ${flagged.size === 1 ? "line" : "lines"}`}
        </button>
      )}

      {result && (
        <Feedback
          correct={result.correct}
          verdict={
            result.correct
              ? "Right."
              : `Not this one. ${[
                  result.missed.length > 0 ? `${result.missed.length} missed` : "",
                  result.extra.length > 0 ? `${result.extra.length} flagged that belonged to the task` : "",
                ]
                  .filter(Boolean)
                  .join(", ")}.`
          }
          explainHtml={exercise.explainHtml}
        />
      )}
    </div>
  );
}
