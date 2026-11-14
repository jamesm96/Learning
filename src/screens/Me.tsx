import { course } from "../content/course";
import { ApplyTask } from "../components/ApplyTask";
import { ProgressBar } from "../components/ProgressBar";
import { moduleCounts, setSelfTest } from "../progress/progress";
import { updateProgress, useProgress } from "../progress/store";
import { BackupPanel } from "./me/BackupPanel";
import { BugJournal } from "./me/BugJournal";
import { SettingsPanel } from "./me/SettingsPanel";

/** Me: progress, the self-test, Apply tasks, the bug journal, settings and backups. */
export function MeScreen() {
  const progress = useProgress();
  const answers = Object.values(progress.answers);
  const firstTry = answers.filter((answer) => answer.firstTryCorrect).length;
  const selfTestDone = course.selfTest.filter((item) => progress.selfTest[item.id]).length;
  const applyTasks = course.modules.flatMap((module) => module.apply.map((task) => ({ ...task, module })));
  const applyDone = applyTasks.filter((task) => progress.apply[task.id]?.done).length;

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

      {course.selfTest.length > 0 && (
        <section class="panel" aria-labelledby="selftest-heading">
          <h2 id="selftest-heading">You are code-literate when you can</h2>
          <p class="muted">
            Tick each one only when you have done it for real, without help. {selfTestDone} of {course.selfTest.length} so far.
          </p>
          <ul class="check-list">
            {course.selfTest.map((item) => (
              <li key={item.id}>
                <label class="check-row">
                  <input
                    type="checkbox"
                    checked={progress.selfTest[item.id] ?? false}
                    onChange={(event) => updateProgress((p) => setSelfTest(p, item.id, event.currentTarget.checked))}
                  />
                  <span>{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section class="panel" aria-labelledby="apply-heading">
        <h2 id="apply-heading">Apply tasks</h2>
        <p class="muted">
          Desk work, three tiers per module. {applyDone} of {applyTasks.length} done.
        </p>
        {course.modules
          .filter((module) => module.apply.length > 0)
          .map((module) => (
            <details key={module.id} class="apply-group">
              <summary>
                {module.label}: {module.title}
              </summary>
              <ul class="apply-list">
                {module.apply.map((task) => (
                  <ApplyTask key={task.id} id={task.id} tier={task.tier} html={task.html} />
                ))}
              </ul>
            </details>
          ))}
      </section>

      <BugJournal />
      <SettingsPanel />
      <BackupPanel />

      <p class="app-version">Version {__APP_VERSION__}</p>
    </>
  );
}
