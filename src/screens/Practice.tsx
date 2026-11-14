import { get, set } from "idb-keyval";
import { useEffect, useRef, useState } from "preact/hooks";
import { CodeEditor } from "../editor/CodeEditor";
import { useRun } from "../python/useRun";
import { course } from "../content/course";
import type { FixExercise } from "../content/schema";
import { useProgress } from "../progress/store";
import { bugHash, drillHash } from "../routes";
import { DRILL_SIZE } from "../review/PracticeSessions";
import { RunButtons } from "../components/RunButtons";
import { RunOutput } from "../components/RunOutput";

const SCRATCHPAD_KEY = "scratchpad";
const STARTER = `# Anything you like. It is kept between sessions.
assets = {"rock_01": 4820, "crane_02": 18250}
for name, tris in assets.items():
    print(f"{name}: {tris:,} triangles")
`;

/** Practice: the Scratchpad, drills by topic, and the bug hunt. */
export function PracticeScreen() {
  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Practice</p>
        <h1>Run anything, any time.</h1>
      </header>
      <Scratchpad />
      <Drills />
      <BugHunt />
    </>
  );
}

/** Drill topics: each starts a run of five random exercises. */
function Drills() {
  if (course.practice.drills.length === 0) return null;
  return (
    <section class="panel" aria-labelledby="drills-heading">
      <h2 id="drills-heading">Drills</h2>
      <p class="muted">{DRILL_SIZE} quick exercises at random from one topic. About five minutes.</p>
      <ul class="practice-list">
        {course.practice.drills.map((topic) => (
          <li key={topic.id}>
            <a class="lesson-link" href={drillHash(topic.id)}>
              <span class="lesson-body">
                <span class="lesson-title">{topic.title}</span>
                <span class="lesson-meta">{topic.steps.length} exercises in the bank</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The bug hunt: broken snippets by level, easiest first, each marked once solved. */
function BugHunt() {
  const progress = useProgress();
  if (course.practice.bugHunt.length === 0) return null;
  return (
    <section class="panel" aria-labelledby="bughunt-heading">
      <h2 id="bughunt-heading">Bug hunt</h2>
      <p class="muted">Broken snippets to fix, then name the cause. Most are bugs AI-written code really produces.</p>
      {course.practice.bugHunt.map((level) => {
        const bugs = level.steps.flatMap((step) => (step.kind === "exercise" && step.exercise.type === "fix" ? [step.exercise] : []));
        const solved = bugs.filter((bug) => progress.answers[bug.id]?.lastCorrect).length;
        return (
          <details key={level.id} class="apply-group">
            <summary>
              {level.title} · {solved} of {bugs.length} solved
            </summary>
            <ol class="practice-list">
              {bugs.map((bug, index) => {
                const record = progress.answers[bug.id];
                const state = record?.lastCorrect ? "done" : record ? "started" : "new";
                return (
                  <li key={bug.id}>
                    <a class={`lesson-link is-${state}`} href={bugHash(bug.id)}>
                      <span class="lesson-number" aria-hidden="true">
                        {state === "done" ? "✓" : index + 1}
                      </span>
                      <span class="lesson-body">
                        <span class="lesson-title">{bugTitle(bug)}</span>
                        <span class="lesson-meta">{state === "done" ? "Solved" : state === "started" ? "Tried" : "Not tried"}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </details>
        );
      })}
    </section>
  );
}

/** A short title for a bug: its symptom, as plain text, cut to one line. */
function bugTitle(bug: FixExercise): string {
  const text = new DOMParser().parseFromString(bug.symptomHtml ?? "", "text/html").body.textContent?.trim() || "A broken snippet";
  return text.length > 70 ? `${text.slice(0, 69)}…` : text;
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
