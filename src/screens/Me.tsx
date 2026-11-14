import { Placeholder } from "../components/Placeholder";

/** Me: progress, notes, the bug journal, settings and backups. */
export function MeScreen() {
  return (
    <>
      <header class="screen-header">
        <p class="eyebrow">Me</p>
        <h1>Progress and settings</h1>
      </header>
      <Placeholder title="Progress" phase={1}>
        How far you are through each module.
      </Placeholder>
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
