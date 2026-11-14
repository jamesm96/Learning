import { useState } from "preact/hooks";
import type { SplitExercise } from "../content/schema";
import { CodeBlock } from "../components/CodeBlock";
import { Feedback } from "../components/Feedback";

interface SplitViewProps {
  exercise: SplitExercise;
  onAnswer: (correct: boolean) => void;
}

/** Split this function: give each line of a long script to one of the named jobs, then compare with a model answer. */
export function SplitView({ exercise, onAnswer }: SplitViewProps) {
  const codeLines = exercise.code.split("\n");
  const [job, setJob] = useState(exercise.jobs[0]!.id);
  const [assigned, setAssigned] = useState<(string | null)[]>(() => codeLines.map(() => null));
  const [compared, setCompared] = useState(false);
  const [assessed, setAssessed] = useState<boolean | null>(null);

  const modelJob = (lineNumber: number) => exercise.answer.find((range) => lineNumber >= range.from && lineNumber <= range.to)?.job ?? null;
  const jobName = (id: string | null) => exercise.jobs.find((item) => item.id === id)?.name ?? "";

  const toggle = (index: number) => {
    if (compared) return;
    setAssigned(assigned.map((current, i) => (i === index ? (current === job ? null : job) : current)));
  };

  const modelLines = codeLines.filter((_, index) => modelJob(index + 1) !== null).length;
  const agreed = codeLines.filter((_, index) => modelJob(index + 1) !== null && assigned[index] === modelJob(index + 1)).length;

  const assess = (close: boolean) => {
    setAssessed(close);
    onAnswer(close);
  };

  return (
    <div class="exercise">
      <p class="exercise-tag">Split this function</p>
      <p class="exercise-question" dangerouslySetInnerHTML={{ __html: exercise.promptHtml }} />

      <fieldset class="blank-choices" disabled={compared}>
        <legend>Choose a job, then tap the lines that do it</legend>
        <div class="chips">
          {exercise.jobs.map((item, index) => (
            <button type="button" key={item.id} class={`chip job-chip job-${index}`} aria-pressed={job === item.id} onClick={() => setJob(item.id)}>
              <code>{item.name}</code>
            </button>
          ))}
        </div>
        <p class="run-note" dangerouslySetInnerHTML={{ __html: exercise.jobs.find((item) => item.id === job)!.descriptionHtml }} />
      </fieldset>

      <ol class="split-lines" aria-label="Lines of the script">
        {codeLines.map((text, index) => {
          const mine = assigned[index] ?? null;
          const model = modelJob(index + 1);
          const jobIndex = exercise.jobs.findIndex((item) => item.id === mine);
          const differs = compared && model !== null && mine !== model;
          return (
            <li key={index}>
              <button
                type="button"
                class={`split-line ${mine ? `has-job job-${jobIndex}` : ""} ${differs ? "is-different" : ""}`}
                onClick={() => toggle(index)}
                disabled={compared || text.trim() === ""}
                aria-label={`Line ${index + 1}${mine ? `, in ${jobName(mine)}` : ""}: ${text.trim() || "blank"}`}
              >
                <span class="split-number" aria-hidden="true">
                  {index + 1}
                </span>
                <code>{text || " "}</code>
                {mine && <span class="split-tag">{jobName(mine)}</span>}
                {differs && <span class="split-tag is-model">model: {jobName(model)}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {!compared && (
        <button type="button" class="button-secondary" onClick={() => setCompared(true)}>
          Compare with the model answer
        </button>
      )}

      {compared && (
        <>
          <p class="task-verdict" role="status">
            You agreed with the model on {agreed} of {modelLines} lines. Lines where you differ are marked.
          </p>
          <p class="field-label">The model answer</p>
          <CodeBlock code={exercise.model} label="Model answer" />
          {assessed === null ? (
            <fieldset class="self-assess">
              <legend>There is more than one good split. How close was yours?</legend>
              <div class="chips">
                <button type="button" class="chip" onClick={() => assess(true)}>
                  Close to the model
                </button>
                <button type="button" class="chip" onClick={() => assess(false)}>
                  Quite different
                </button>
              </div>
            </fieldset>
          ) : (
            <Feedback correct={assessed} verdict={assessed ? "Noted." : "Noted. Read the model answer job by job."} explainHtml={exercise.explainHtml} />
          )}
        </>
      )}
    </div>
  );
}
