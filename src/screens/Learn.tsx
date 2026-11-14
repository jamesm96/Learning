import { course } from "../content/course";
import { ProgressBar } from "../components/ProgressBar";
import { moduleCounts } from "../progress/progress";
import { useProgress } from "../progress/store";
import { moduleHash } from "../routes";

/** Learn: the course map. Written modules open; planned ones are listed so you can see what is coming. */
export function LearnScreen() {
  const progress = useProgress();

  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Learn</p>
        <h1>Course map</h1>
      </header>

      <ol class="module-list">
        {course.modules.map((module) => {
          const counts = moduleCounts(progress, module);
          return (
            <li key={module.id}>
              <a class="module-link" href={moduleHash(module.id)}>
                <span class="module-label">{module.label}</span>
                <h2>{module.title}</h2>
                <p>{module.summary}</p>
                <ProgressBar done={counts.done} total={counts.total} label="lessons done" />
              </a>
            </li>
          );
        })}
        {course.planned.map((module) => (
          <li key={module.id} class="is-planned">
            <div class="module-link">
              <span class="module-label">{module.label}</span>
              <h2>{module.title}</h2>
              <p>{module.summary}</p>
              <p class="module-status">Not written yet</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
