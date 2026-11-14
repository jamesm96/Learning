import { useMemo, useState } from "preact/hooks";
import type { GitExercise } from "../content/schema";
import {
  allGoalsMet,
  createRepo,
  execute,
  formatCommand,
  headFiles,
  history,
  status,
  type Command,
  type Repo,
} from "../git/simulator";
import { lineDiff } from "../git/line-diff";
import { Feedback } from "../components/Feedback";

interface GitViewProps {
  exercise: GitExercise;
  onAnswer: (correct: boolean) => void;
}

interface LogEntry {
  command: string;
  output: string;
  ok: boolean;
}

/** Which command is waiting for a file, message or branch name. */
type Asking = "add" | "restore" | "unstage" | "commit" | "create" | "switch" | "merge" | null;

/** Git: reach the task's goal by running commands in a simulated repository. */
export function GitView({ exercise, onAnswer }: GitViewProps) {
  const start = useMemo(() => createRepo(exercise.start), [exercise]);
  const [repo, setRepo] = useState<Repo>(start);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [asking, setAsking] = useState<Asking>(null);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [solutionShown, setSolutionShown] = useState(false);

  const run = (command: Command) => {
    const result = execute(repo, command);
    setRepo(result.repo);
    setLog([...log, { command: formatCommand(command), output: result.output, ok: result.ok }]);
    setAsking(null);
    setText("");
    if (!done && allGoalsMet(result.repo, exercise.goal)) {
      setDone(true);
      onAnswer(!solutionShown);
    }
  };

  const reset = () => {
    setRepo(start);
    setLog([]);
    setAsking(null);
  };

  const showSolution = () => {
    setSolutionShown(true);
    if (!done) onAnswer(false);
  };

  const current = status(repo);
  const otherBranches = Object.keys(repo.branches).filter((name) => name !== repo.head);
  const addable = [...current.unstaged.map((c) => c.path), ...current.untracked];
  const restorable = current.unstaged.map((c) => c.path);
  const unstageable = current.staged.map((c) => c.path);

  return (
    <div class="exercise">
      <p class="exercise-tag">Git</p>
      <p class="exercise-question" dangerouslySetInnerHTML={{ __html: exercise.taskHtml }} />

      <RepoView repo={repo} />

      {!done && (
        <div class="git-commands" role="group" aria-label="Git commands">
          <button type="button" class="kb-key" onClick={() => run({ kind: "status" })}>status</button>
          <button type="button" class="kb-key" onClick={() => run({ kind: "diff", staged: false })}>diff</button>
          <button type="button" class="kb-key" onClick={() => run({ kind: "diff", staged: true })}>diff --staged</button>
          <button type="button" class="kb-key" onClick={() => setAsking("add")} aria-pressed={asking === "add"}>add…</button>
          <button type="button" class="kb-key" onClick={() => setAsking("commit")} aria-pressed={asking === "commit"}>commit…</button>
          <button type="button" class="kb-key" onClick={() => setAsking("restore")} aria-pressed={asking === "restore"}>restore…</button>
          <button type="button" class="kb-key" onClick={() => setAsking("unstage")} aria-pressed={asking === "unstage"}>restore --staged…</button>
          <button type="button" class="kb-key" onClick={() => setAsking("create")} aria-pressed={asking === "create"}>switch -c…</button>
          <button type="button" class="kb-key" onClick={() => setAsking("switch")} aria-pressed={asking === "switch"}>switch…</button>
          <button type="button" class="kb-key" onClick={() => setAsking("merge")} aria-pressed={asking === "merge"}>merge…</button>
          <button type="button" class="kb-key" onClick={() => run({ kind: "stash" })}>stash</button>
          <button type="button" class="kb-key" onClick={() => run({ kind: "stash-pop" })}>stash pop</button>
          <button type="button" class="kb-key" onClick={() => run({ kind: "log" })}>log</button>
        </div>
      )}

      {asking && !done && (
        <div class="git-ask">
          {(asking === "add" || asking === "restore" || asking === "unstage") && (
            <Choices
              label={asking === "add" ? "git add which file?" : asking === "restore" ? "Throw away the edits to which file?" : "Unstage which file?"}
              options={asking === "add" ? (addable.length > 1 ? [...addable, "."] : addable) : asking === "restore" ? restorable : unstageable}
              empty={asking === "add" ? "Nothing to add." : asking === "restore" ? "No unstaged edits to throw away." : "Nothing is staged."}
              onPick={(path) =>
                run(asking === "add" ? { kind: "add", path } : { kind: "restore", path, staged: asking === "unstage" })
              }
            />
          )}
          {(asking === "switch" || asking === "merge") && (
            <Choices
              label={asking === "switch" ? "Switch to which branch?" : `Merge which branch into ${repo.head}?`}
              options={otherBranches}
              empty="There are no other branches yet."
              onPick={(branch) => run(asking === "switch" ? { kind: "switch", branch, create: false } : { kind: "merge", branch })}
            />
          )}
          {(asking === "commit" || asking === "create") && (
            <form
              class="git-form"
              onSubmit={(event) => {
                event.preventDefault();
                const value = text.trim();
                if (!value) return;
                run(asking === "commit" ? { kind: "commit", message: value } : { kind: "switch", branch: value.replace(/\s+/g, "-"), create: true });
              }}
            >
              <label class="field">
                <span class="field-label">{asking === "commit" ? "Commit message" : "New branch name"}</span>
                <input
                  class="code-input"
                  value={text}
                  onInput={(event) => setText(event.currentTarget.value)}
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck={asking === "commit"}
                />
              </label>
              <button type="submit" class="button-run" disabled={!text.trim()}>
                {asking === "commit" ? "Commit" : "Create and switch"}
              </button>
            </form>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div class="git-log" role="log" aria-label="Terminal">
          {log.map((entry, index) => (
            <div key={index} class={`git-entry ${entry.ok ? "" : "is-refused"}`}>
              <pre class="git-command">$ {entry.command}</pre>
              {entry.output && <pre class="git-output">{entry.output}</pre>}
            </div>
          ))}
        </div>
      )}

      {done && <Feedback correct={!solutionShown} verdict="Done. The repository is in the state the task asked for." explainHtml={exercise.explainHtml} />}

      <div class="run-buttons">
        {!done && log.length > 0 && (
          <button type="button" class="link-button" onClick={reset}>
            Start again
          </button>
        )}
        {!done && !solutionShown && log.length >= Math.max(6, exercise.solution.length * 2) && (
          <button type="button" class="link-button" onClick={showSolution}>
            Show a solution
          </button>
        )}
      </div>
      {solutionShown && (
        <pre class="code is-output" aria-label="One solution">
          {exercise.solution.join("\n")}
        </pre>
      )}
    </div>
  );
}

interface ChoicesProps {
  label: string;
  options: string[];
  empty: string;
  onPick: (option: string) => void;
}

/** A row of choices for a command's argument. */
function Choices({ label, options, empty, onPick }: ChoicesProps) {
  return (
    <fieldset class="blank-choices">
      <legend>{label}</legend>
      {options.length === 0 ? (
        <p class="run-note">{empty}</p>
      ) : (
        <div class="chips">
          {options.map((option) => (
            <button type="button" key={option} class="chip" onClick={() => onPick(option)}>
              <code>{option === "." ? ". (everything)" : option}</code>
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}

/** The three places changes live: working folder, staging and history. Tap a file to see its changes. */
function RepoView({ repo }: { repo: Repo }) {
  const [open, setOpen] = useState<string | null>(null);
  const current = status(repo);
  const head = headFiles(repo);
  const paths = [...new Set([...Object.keys(repo.working), ...Object.keys(repo.index), ...Object.keys(head)])].sort();

  const describe = (path: string): string => {
    const staged = current.staged.find((c) => c.path === path);
    const unstaged = current.unstaged.find((c) => c.path === path);
    if (current.untracked.includes(path)) return "untracked";
    const parts = [];
    if (staged) parts.push(`${staged.kind}, staged`);
    if (unstaged) parts.push(`${unstaged.kind}${staged ? " again" : ""}, not staged`);
    return parts.join("; ") || "unchanged";
  };

  return (
    <div class="git-state">
      <section class="git-panel" aria-label="Working folder">
        <h3 class="git-heading">Working folder</h3>
        <ul class="git-files">
          {paths.map((path) => {
            const state = describe(path);
            const before = head[path] ?? "";
            const after = repo.working[path] ?? "";
            return (
              <li key={path}>
                <button type="button" class={`git-file ${state === "unchanged" ? "" : "is-changed"}`} aria-expanded={open === path} onClick={() => setOpen(open === path ? null : path)}>
                  <code>{path}</code>
                  <span class="git-file-state">{state}</span>
                </button>
                {open === path && (
                  <pre class="git-file-diff" aria-label={`Changes to ${path} since the last commit`}>
                    {lineDiff(before, after).map((line, index) => (
                      <span key={index} class={line.op === "+" ? "is-added" : line.op === "-" ? "is-removed" : ""}>
                        {`${line.op} ${line.text}\n`}
                      </span>
                    ))}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <section class="git-panel" aria-label="History">
        <h3 class="git-heading">
          History on <code>{repo.head}</code>
          {repo.stash.length > 0 && <span class="git-file-state"> · {repo.stash.length} stashed</span>}
        </h3>
        <ol class="git-history">
          {history(repo).map((commit) => {
            const labels = Object.entries(repo.branches)
              .filter(([, id]) => id === commit.id)
              .map(([name]) => name);
            return (
              <li key={commit.id}>
                <code class="git-id">{commit.id}</code> {commit.message}
                {labels.map((name) => (
                  <span key={name} class={`git-branch ${name === repo.head ? "is-head" : ""}`}>
                    {name}
                  </span>
                ))}
              </li>
            );
          })}
        </ol>
        {Object.keys(repo.branches).length > 1 && (
          <p class="run-note">Branches: {Object.keys(repo.branches).join(", ")}</p>
        )}
      </section>
    </div>
  );
}
