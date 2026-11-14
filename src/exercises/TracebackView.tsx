import { useMemo, useState } from "preact/hooks";
import type { TracebackExercise } from "../content/schema";
import { shuffle } from "../grading/grading";
import { parseTraceback } from "../grading/traceback";
import { CodeBlock } from "../components/CodeBlock";
import { Feedback } from "../components/Feedback";
import { Html } from "../components/Html";

interface TracebackViewProps {
  exercise: TracebackExercise;
  onAnswer: (correct: boolean) => void;
}

/** Read the traceback: tap the frame where it failed, then choose the most likely cause. */
export function TracebackView({ exercise, onAnswer }: TracebackViewProps) {
  const parsed = useMemo(() => parseTraceback(exercise.traceback), [exercise]);
  const options = useMemo(() => shuffle(exercise.options), [exercise]);
  const [frame, setFrame] = useState<number | null>(null);
  const [cause, setCause] = useState<string | null>(null);

  const frameRight = frame === parsed.failingFrame;
  const causeRight = cause === exercise.answer;

  const pickCause = (optionId: string) => {
    if (cause) return;
    setCause(optionId);
    onAnswer(frameRight && optionId === exercise.answer);
  };

  return (
    <div class="exercise">
      <p class="exercise-tag">Read the traceback</p>
      <CodeBlock code={exercise.code} lineNumbers />

      <div class="traceback" aria-label="Traceback">
        {parsed.header && <pre class="tb-line">{parsed.header}</pre>}
        {parsed.frames.map((item, index) => {
          let state = "";
          if (frame !== null && index === parsed.failingFrame) state = "is-answer";
          else if (frame === index) state = "is-wrong";
          return (
            <button
              type="button"
              key={index}
              class={`tb-frame ${state}`}
              onClick={() => frame === null && setFrame(index)}
              disabled={frame !== null}
              aria-label={`${item.file}, line ${item.line}${item.functionName ? `, in ${item.functionName}` : ""}`}
            >
              <pre>{item.lines.join("\n")}</pre>
              {frame !== null && index === parsed.failingFrame && <span class="option-note">Failed here</span>}
              {frame === index && index !== parsed.failingFrame && <span class="option-note">Your answer</span>}
            </button>
          );
        })}
        <pre class="tb-line tb-exception">{parsed.exceptionLines.join("\n")}</pre>
      </div>

      {frame === null && <p class="exercise-question">Tap the part of the traceback where it failed.</p>}

      {frame !== null && (
        <>
          <p class="task-verdict" role="status">
            {frameRight
              ? `Right. Line ${parsed.frames[parsed.failingFrame]?.line} is where the error was raised: read from the bottom up.`
              : "Not this one. The failure is in the last frame of your own file, just above the error message."}
          </p>
          <fieldset class="cause-question">
            <legend dangerouslySetInnerHTML={{ __html: exercise.questionHtml }} />
            <ul class="options">
              {options.map((option) => {
                const isAnswer = option.id === exercise.answer;
                const isPicked = option.id === cause;
                let state = "";
                if (cause && isAnswer) state = "is-answer";
                else if (cause && isPicked) state = "is-wrong";
                return (
                  <li key={option.id}>
                    <button type="button" class={`option ${state}`} onClick={() => pickCause(option.id)} disabled={cause !== null}>
                      <Html html={option.html} class="option-text" />
                      {cause && isAnswer && <span class="option-note">Correct answer</span>}
                      {cause && isPicked && !isAnswer && <span class="option-note">Your answer</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </>
      )}

      {cause && <Feedback correct={causeRight} explainHtml={exercise.explainHtml} />}
    </div>
  );
}
