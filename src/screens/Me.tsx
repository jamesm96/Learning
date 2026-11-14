import { course } from "../content/course";
import { Placeholder } from "../components/Placeholder";
import { ProgressBar } from "../components/ProgressBar";
import { moduleCounts } from "../progress/progress";
import { useProgress } from "../progress/store";

/** Me: progress, notes, the bug journal, settings and backups. */
export function MeScreen() {
  const progress = useProgress();
  const answers = Object.values(progress.answers);
  const firstTry = answers.filter((answer) => answer.firstTryCorrect).length;

  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Me</p>
        <h1>Progress and settings</h1>
      </header>

      <section aria-labelledby="progress-heading" class="stack">
        <h2 id="progress-heading">Progress</h2>
        <ul class="progress-list">
          {course.modules.map((module) => {
            const counts = moduleCounts(progress, module);
            return (
              <li key={module.id}>
                <span class="progress-name">
                  {module.label}: {module.title}
                </span>
                <ProgressBar done={counts.done} total={counts.total} label="lessons" />
              </li>
            );
          })}
        </ul>
        <p class="muted">
          {answers.length === 0
            ? "No exercises answered yet."
            : `${answers.length} exercises answered, ${firstTry} right first time.`}
        </p>
      </section>

      <Placeholder title="Apply tasks and bug journal" phase={4}>
        Desk tasks with notes, and a log of bugs you have found: symptom, cause and how you found it.
      </Placeholder>
      <Placeholder title="Settings and backup" phase={4}>
        Theme, haptics, and export or import of your progress as a file.
      </Placeholder>
      <p class="app-version">Version {__APP_VERSION__}</p>
    </>
  );
}
