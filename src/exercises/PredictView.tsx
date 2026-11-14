import { useState } from "preact/hooks";
import type { PredictExercise } from "../content/schema";
import { compareOutput, type OutputComparison } from "../grading/compare-output";
import { useRun } from "../python/useRun";
import { CodeBlock } from "../components/CodeBlock";
import { Feedback } from "../components/Feedback";
import { RunOutput } from "../components/RunOutput";
import { OutputDiff } from "./OutputDiff";
import { Playground } from "./Playground";

interface PredictViewProps {
  exercise: PredictExercise;
  onAnswer: (correct: boolean) => void;
}

type Mode = "type" | "head";

/**
 * Predict the output. You commit to a prediction first (typed, or in your head), and only then can you Run.
 * The code really runs in Python; your prediction is compared with what it printed.
 */
export function PredictView({ exercise, onAnswer }: PredictViewProps) {
  const [mode, setMode] = useState<Mode>("type");
  const [prediction, setPrediction] = useState("");
  const [comparison, setComparison] = useState<OutputComparison | null>(null);
  const [selfAssessed, setSelfAssessed] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const state = useRun();

  const ran = state.result !== null || state.loadFailed;
  // If Python cannot load (offline before first use), fall back to the output the build checked.
  const realOutput = state.result?.stdout ?? (state.loadFailed ? exercise.output : "");

  const run = async () => {
    const result = await state.run(exercise.code);
    if (mode === "type") {
      const actual = result?.stdout ?? exercise.output;
      const compared = compareOutput(prediction, actual);
      setComparison(compared);
      onAnswer(compared.match);
    }
  };

  const assess = (matched: boolean) => {
    setSelfAssessed(matched);
    onAnswer(matched);
  };

  const done = comparison !== null || selfAssessed !== null;

  return (
    <div class="exercise">
      <p class="exercise-tag">Predict the output</p>
      <CodeBlock code={exercise.code} />

      {!ran && !state.running && mode === "type" && (
        <>
          <label class="field">
            <span class="field-label">What will it print? Every line.</span>
            <textarea
              class="code-input"
              rows={Math.min(6, Math.max(2, exercise.output.split("\n").length))}
              value={prediction}
              onInput={(event) => setPrediction(event.currentTarget.value)}
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck={false}
            />
          </label>
          <div class="run-buttons">
            <button type="button" class="button-run" onClick={run} disabled={prediction.trim() === ""}>
              Run it
            </button>
            <button type="button" class="link-button" onClick={() => setMode("head")}>
              Predict in my head instead
            </button>
          </div>
        </>
      )}

      {!ran && !state.running && mode === "head" && (
        <div class="run-buttons">
          <button type="button" class="button-run" onClick={run}>
            I have my prediction. Run it
          </button>
          <button type="button" class="link-button" onClick={() => setMode("type")}>
            Type it instead
          </button>
        </div>
      )}

      {state.running && <RunOutput state={state} />}

      {ran && (
        <>
          {state.loadFailed && (
            <p class="run-note">Python could not load, so this is the output stored with the lesson.</p>
          )}
          {state.result?.error && <RunOutput state={state} />}
          {comparison ? (
            <OutputDiff comparison={comparison} />
          ) : (
            <CodeBlock code={realOutput.replace(/\n+$/, "")} label="Output" plain />
          )}

          {mode === "head" && selfAssessed === null && (
            <fieldset class="self-assess">
              <legend>Did your prediction match, every line?</legend>
              <div class="chips">
                <button type="button" class="chip" onClick={() => assess(true)}>
                  Yes, it matched
                </button>
                <button type="button" class="chip" onClick={() => assess(false)}>
                  No
                </button>
              </div>
            </fieldset>
          )}
        </>
      )}

      {done && (
        <Feedback
          correct={comparison ? comparison.match : selfAssessed === true}
          verdict={(comparison ? comparison.match : selfAssessed) ? "Right." : "Not this one. Find the first line that differs."}
          explainHtml={exercise.explainHtml}
        />
      )}

      {done && !playing && (
        <button type="button" class="link-button" onClick={() => setPlaying(true)}>
          Edit and run this code
        </button>
      )}
      {playing && <Playground code={exercise.code} hintHtml={exercise.hintHtml} />}
    </div>
  );
}
