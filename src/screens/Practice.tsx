import { get, set } from "idb-keyval";
import { useEffect, useRef, useState } from "preact/hooks";
import { CodeEditor } from "../editor/CodeEditor";
import { useRun } from "../python/useRun";
import { Placeholder } from "../components/Placeholder";
import { RunButtons } from "../components/RunButtons";
import { RunOutput } from "../components/RunOutput";

const SCRATCHPAD_KEY = "scratchpad";
const STARTER = `# Anything you like. It is kept between sessions.
assets = {"rock_01": 4820, "crane_02": 18250}
for name, tris in assets.items():
    print(f"{name}: {tris:,} triangles")
`;

/** Practice: the Scratchpad now; drills and bug hunts later. */
export function PracticeScreen() {
  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Practice</p>
        <h1>Run anything, any time.</h1>
      </header>
      <Scratchpad />
      <Placeholder title="Drills" phase={5}>
        Quick random exercises by topic: data shapes, error types, reading diffs.
      </Placeholder>
      <Placeholder title="Bug hunt" phase={5}>
        Broken snippets to fix, from easy to hard.
      </Placeholder>
    </>
  );
}

/** A Python editor whose code is saved on the device as you type. */
function Scratchpad() {
  const [saved, setSaved] = useState<string | null>(null); // null until loaded
  const code = useRef("");
  const state = useRun();

  useEffect(() => {
    void get<string>(SCRATCHPAD_KEY).then((stored) => {
      const start = stored ?? STARTER;
      code.current = start;
      setSaved(start);
    });
  }, []);

  const change = (next: string) => {
    code.current = next;
    void set(SCRATCHPAD_KEY, next);
  };

  const run = () => void state.run(code.current);

  return (
    <section class="stack" aria-labelledby="scratchpad-heading">
      <h2 id="scratchpad-heading">Scratchpad</h2>
      {saved !== null && <CodeEditor value={saved} onChange={change} onRun={run} label="Scratchpad" />}
      <RunButtons state={state} onRun={run} />
      <RunOutput state={state} />
    </section>
  );
}
