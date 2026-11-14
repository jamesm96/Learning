import { Placeholder } from "../components/Placeholder";

const MODULES: readonly { number: string; title: string; summary: string }[] = [
  { number: "0", title: "Start", summary: "Setup and habits." },
  { number: "1", title: "Data", summary: "The shapes everything is made of." },
  { number: "2", title: "Structure", summary: "Functions, modules and classes." },
  { number: "3", title: "Debugging", summary: "Finding out what is true." },
  { number: "4", title: "Git", summary: "Undo, history and review." },
  { number: "5", title: "Data in and out", summary: "Files, formats and other programs." },
  { number: "→", title: "What next", summary: "Capstone, schedule and where this leads." },
];

/** Learn: the course map. Modules and their lessons, with progress. */
export function LearnScreen() {
  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Learn</p>
        <h1>Course map</h1>
      </header>
      <ol class="module-list">
        {MODULES.map((module) => (
          <li key={module.title}>
            <span class="module-number" aria-hidden="true">
              {module.number}
            </span>
            <div>
              <h2>{module.title}</h2>
              <p>{module.summary}</p>
            </div>
          </li>
        ))}
      </ol>
      <Placeholder title="Lessons" phase={1}>
        Each module opens into short lessons of five to ten steps.
      </Placeholder>
    </>
  );
}
