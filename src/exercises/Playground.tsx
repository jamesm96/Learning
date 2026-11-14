import { useState } from "preact/hooks";
import { CodeEditor } from "../editor/CodeEditor";
import { useRun } from "../python/useRun";
import { RunButtons } from "../components/RunButtons";
import { RunOutput } from "../components/RunOutput";

interface PlaygroundProps {
  code: string;
  hintHtml?: string;
}

/** An editable copy of some code with Run and Reset. Nothing is graded; it is for trying ideas. */
export function Playground({ code, hintHtml }: PlaygroundProps) {
  const [current, setCurrent] = useState(code);
  const [resets, setResets] = useState(0);
  const state = useRun();

  const reset = () => {
    setCurrent(code);
    setResets(resets + 1); // a new key makes a fresh editor with the original code
    state.clear();
  };

  return (
    <div class="playground">
      {hintHtml && (
        <p class="feedback-hint">
          Try this: <span dangerouslySetInnerHTML={{ __html: hintHtml }} />
        </p>
      )}
      <CodeEditor key={resets} value={code} onChange={setCurrent} onRun={() => void state.run(current)} />
      <RunButtons state={state} onRun={() => void state.run(current)} onReset={reset} />
      <RunOutput state={state} />
    </div>
  );
}
