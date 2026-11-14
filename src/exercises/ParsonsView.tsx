import { useMemo, useState } from "preact/hooks";
import type { ParsonsExercise } from "../content/schema";
import { describeCheck, type CheckVerdict } from "../grading/check-result";
import { shuffle } from "../grading/grading";
import { useRun } from "../python/useRun";
import { CodeBlock } from "../components/CodeBlock";
import { Feedback } from "../components/Feedback";
import { RunOutput } from "../components/RunOutput";

interface ParsonsViewProps {
  exercise: ParsonsExercise;
  onAnswer: (correct: boolean) => void;
}

interface Line {
  key: number; // stable identity while lines move
  text: string;
  indent: number;
}

const MAX_INDENT = 4;

/** Reorder lines: put the shuffled lines in order and set each one's indentation. Checked by running the result. */
export function ParsonsView({ exercise, onAnswer }: ParsonsViewProps) {
  const start = useMemo(() => shuffledLines(exercise), [exercise]);
  const [lines, setLines] = useState<Line[]>(start);
  const [selected, setSelected] = useState<number | null>(null); // index into lines
  const [checks, setChecks] = useState(0);
  const [verdict, setVerdict] = useState<CheckVerdict | null>(null);
  const [finished, setFinished] = useState<"solved" | "shown" | null>(null);
  const state = useRun();

  const program = (list: Line[]) => list.map((line) => "    ".repeat(line.indent) + line.text).join("\n");

  const move = (by: number) => {
    if (selected === null) return;
    const target = selected + by;
    if (target < 0 || target >= lines.length) return;
    const next = [...lines];
    [next[selected], next[target]] = [next[target]!, next[selected]!];
    setLines(next);
    setSelected(target);
  };

  const indent = (by: number) => {
    if (selected === null) return;
    setLines(lines.map((line, index) => (index === selected ? { ...line, indent: Math.min(MAX_INDENT, Math.max(0, line.indent + by)) } : line)));
  };

  const check = async () => {
    const result = await state.run(program(lines), exercise.check);
    if (!result) return;
    const next = describeCheck(result);
    setVerdict(next);
    setChecks(checks + 1);
    if (next.passed) {
      setFinished("solved");
      setSelected(null);
      onAnswer(checks === 0);
    }
  };

  const showSolution = () => {
    setFinished("shown");
    setSelected(null);
    onAnswer(false);
  };

  const locked = finished !== null;
  const current = selected === null ? null : lines[selected];

  return (
    <div class="exercise">
      <p class="exercise-tag">Reorder the lines</p>
      <p class="exercise-question" dangerouslySetInnerHTML={{ __html: exercise.promptHtml }} />
      {!locked && <p class="run-note">Tap a line, then move it and set its indent with the buttons below.</p>}

      <ol class="parsons-lines" aria-label="Lines of code">
        {lines.map((line, index) => (
          <li key={line.key}>
            <button
              type="button"
              class={`parsons-line ${index === selected ? "is-selected" : ""}`}
              aria-pressed={index === selected}
              aria-label={`Line ${index + 1}, indent ${line.indent}: ${line.text}`}
              onClick={() => !locked && setSelected(index === selected ? null : index)}
              disabled={locked}
            >
              <code>
                <span class="parsons-indent">{"    ".repeat(line.indent)}</span>
                {line.text}
              </code>
            </button>
          </li>
        ))}
      </ol>

      {!locked && (
        <div class="parsons-controls" role="group" aria-label={current ? `Move or indent: ${current.text}` : "Select a line first"}>
          <button type="button" class="kb-key" onClick={() => move(-1)} disabled={selected === null || selected === 0} aria-label="Move up">
            ↑
          </button>
          <button
            type="button"
            class="kb-key"
            onClick={() => move(1)}
            disabled={selected === null || selected === lines.length - 1}
            aria-label="Move down"
          >
            ↓
          </button>
          <button type="button" class="kb-key" onClick={() => indent(-1)} disabled={!current || current.indent === 0} aria-label="Indent less">
            ⇤
          </button>
          <button type="button" class="kb-key" onClick={() => indent(1)} disabled={!current || current.indent === MAX_INDENT} aria-label="Indent more">
            ⇥
          </button>
        </div>
      )}

      {!locked && (
        <div class="run-buttons">
          <button type="button" class="button-run" onClick={() => void check()} disabled={state.running}>
            Run to check
          </button>
          {checks >= 2 && (
            <button type="button" class="link-button" onClick={showSolution}>
              Show the solution
            </button>
          )}
        </div>
      )}

      {(state.running || state.loadFailed) && <RunOutput state={state} />}
      {verdict && !finished && (
        <>
          {verdict.showTraceback && state.result?.error && (
            <CodeBlock code={state.result.error.traceback.replace(/\n+$/, "")} label="Error" plain />
          )}
          <p class="task-verdict" role="status">
            <span class="feedback-mark is-wrong-mark" aria-hidden="true">
              ✗
            </span>
            {verdict.message}
          </p>
        </>
      )}

      {finished === "shown" && (
        <CodeBlock code={exercise.lines.map((line) => "    ".repeat(line.indent) + line.text).join("\n")} label="Solution" />
      )}
      {finished && (
        <Feedback correct={finished === "solved"} verdict={finished === "solved" ? "Right. It runs and passes." : "Here is the working order."} explainHtml={exercise.explainHtml} />
      )}
    </div>
  );
}

/** The exercise's lines in a random order, all unindented, and never already solved. */
function shuffledLines(exercise: ParsonsExercise): Line[] {
  const keyed = exercise.lines.map((line, key) => ({ key, text: line.text, indent: 0 }));
  let order = shuffle(keyed);
  for (let tries = 0; tries < 5 && order.every((line, index) => line.key === index); tries++) order = shuffle(keyed);
  return order;
}
