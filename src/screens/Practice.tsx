import { Placeholder } from "../components/Placeholder";

/** Practice: tools that work outside the lessons. */
export function PracticeScreen() {
  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Practice</p>
        <h1>Run anything, any time.</h1>
      </header>
      <Placeholder title="Scratchpad" phase={2}>
        A Python editor with a Run button. Real Python, running on your phone. Kept between sessions.
      </Placeholder>
      <Placeholder title="Drills" phase={5}>
        Quick random exercises by topic: data shapes, error types, reading diffs.
      </Placeholder>
      <Placeholder title="Bug hunt" phase={5}>
        Broken snippets to fix, from easy to hard.
      </Placeholder>
    </>
  );
}
