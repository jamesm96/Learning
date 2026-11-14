// A small simulated Git repository, for practising the daily loop safely.
// Pure: every command takes a repository and returns a new one plus the text Git would print.
// It models the working folder, staging (the index), commits, branches, merges and the stash.
// It is a teaching model, not Git: merge conflicts stop with an explanation, and there is no remote.

import type { GitGoal, GitStart } from "../content/schema.ts";
import { lineDiff } from "./line-diff.ts";

/** File contents by path. A missing path means the file does not exist. */
export type Files = Record<string, string>;

export interface Commit {
  id: string;
  message: string;
  parents: string[];
  files: Files;
}

export interface StashEntry {
  base: Files; // the commit the changes were made on
  working: Files; // the tracked files as they were
  message: string;
}

export interface Repo {
  commits: Record<string, Commit>;
  branches: Record<string, string>; // branch name -> commit id
  head: string; // current branch name
  index: Files; // staging: what the next commit will contain
  working: Files; // the working folder
  stash: StashEntry[];
  counter: number; // for making commit ids
}

export type Command =
  | { kind: "status" }
  | { kind: "diff"; staged: boolean }
  | { kind: "add"; path: string }
  | { kind: "commit"; message: string }
  | { kind: "switch"; branch: string; create: boolean }
  | { kind: "merge"; branch: string }
  | { kind: "restore"; path: string; staged: boolean }
  | { kind: "stash" }
  | { kind: "stash-pop" }
  | { kind: "log" };

export interface Result {
  repo: Repo;
  output: string;
  ok: boolean; // false when Git would refuse or report an error
}

export type ChangeKind = "modified" | "new file" | "deleted";
export interface Change {
  path: string;
  kind: ChangeKind;
}

// ---- Building a repository ----

/** Trailing whitespace never counts, so content written in YAML compares cleanly. */
function normalise(text: string): string {
  return text.replace(/\s+$/, "");
}

/** Apply changes (null deletes a file) on top of some files. */
function applyChanges(files: Files, changes: Record<string, string | null> = {}): Files {
  const next = { ...files };
  for (const [path, content] of Object.entries(changes)) {
    if (content === null) delete next[path];
    else next[path] = normalise(content);
  }
  return next;
}

/** A short, stable, made-up commit id, so ids look like Git's. */
function makeId(counter: number): string {
  return ((counter * 2654435761) % 4294967296).toString(16).padStart(8, "0").slice(0, 7);
}

/** Add a commit to the repository and return its id. */
function addCommit(repo: Repo, message: string, parents: string[], files: Files): string {
  repo.counter += 1;
  const id = makeId(repo.counter);
  repo.commits[id] = { id, message, parents, files: { ...files } };
  return id;
}

/** Build a repository from an exercise's starting state. Branches fork from the last commit on main. */
export function createRepo(start: GitStart): Repo {
  const repo: Repo = { commits: {}, branches: {}, head: "main", index: {}, working: {}, stash: [], counter: 0 };
  let tip = "";
  let files: Files = {};
  for (const commit of start.commits) {
    files = applyChanges(files, commit.files);
    tip = addCommit(repo, commit.message, tip ? [tip] : [], files);
  }
  repo.branches.main = tip;

  for (const branch of start.branches ?? []) {
    let branchTip = tip;
    let branchFiles = files;
    for (const commit of branch.commits) {
      branchFiles = applyChanges(branchFiles, commit.files);
      branchTip = addCommit(repo, commit.message, [branchTip], branchFiles);
    }
    repo.branches[branch.name] = branchTip;
  }

  repo.index = applyChanges(files, start.staged);
  repo.working = applyChanges(repo.index, start.working);
  return repo;
}

/** A deep copy, so commands never change the repository they were given. */
function clone(repo: Repo): Repo {
  return {
    ...repo,
    commits: { ...repo.commits },
    branches: { ...repo.branches },
    index: { ...repo.index },
    working: { ...repo.working },
    stash: [...repo.stash],
  };
}

// ---- Looking at a repository ----

/** The files in the current branch's latest commit. */
export function headFiles(repo: Repo): Files {
  return repo.commits[repo.branches[repo.head]!]!.files;
}

/** Paths that differ between two sets of files. */
export function changesBetween(before: Files, after: Files, only?: (path: string) => boolean): Change[] {
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const changes: Change[] = [];
  for (const path of paths) {
    if (only && !only(path)) continue;
    if (before[path] === after[path]) continue;
    if (before[path] === undefined) changes.push({ path, kind: "new file" });
    else if (after[path] === undefined) changes.push({ path, kind: "deleted" });
    else changes.push({ path, kind: "modified" });
  }
  return changes;
}

export interface Status {
  staged: Change[]; // staging vs latest commit
  unstaged: Change[]; // working folder vs staging, for tracked files
  untracked: string[]; // in the working folder, never added
}

/** What `git status` reports. */
export function status(repo: Repo): Status {
  const tracked = (path: string) => repo.index[path] !== undefined;
  return {
    staged: changesBetween(headFiles(repo), repo.index),
    unstaged: changesBetween(repo.index, repo.working, tracked),
    untracked: Object.keys(repo.working)
      .filter((path) => !tracked(path))
      .sort(),
  };
}

/** True when there are no staged or unstaged changes to tracked files. Untracked files are ignored. */
export function isClean(repo: Repo): boolean {
  const current = status(repo);
  return current.staged.length === 0 && current.unstaged.length === 0;
}

/** Every commit reachable from a commit, including itself. */
function ancestors(repo: Repo, id: string): Set<string> {
  const seen = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const next = queue.pop()!;
    if (seen.has(next)) continue;
    seen.add(next);
    queue.push(...repo.commits[next]!.parents);
  }
  return seen;
}

/** The current branch's history, newest first, following first parents. */
export function history(repo: Repo): Commit[] {
  const list: Commit[] = [];
  let id: string | undefined = repo.branches[repo.head];
  while (id) {
    const commit: Commit = repo.commits[id]!;
    list.push(commit);
    id = commit.parents[0];
  }
  return list;
}

// ---- Commands ----

/** Turn a typed command such as `git commit -m "Fix budget"` into a Command. */
export function parseCommand(text: string): Command | { error: string } {
  const words = text.trim().match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  const parts = words.map((word) => word.replace(/^["']|["']$/g, ""));
  if (parts[0] !== "git") return { error: "Commands start with git." };
  const [, verb, ...rest] = parts;

  switch (verb) {
    case "status":
      return { kind: "status" };
    case "log":
      return { kind: "log" };
    case "diff":
      return { kind: "diff", staged: rest.includes("--staged") };
    case "add":
      return rest[0] ? { kind: "add", path: rest[0] } : { error: "git add needs a file name, or . for everything." };
    case "commit": {
      const flag = rest.indexOf("-m");
      const message = flag >= 0 ? rest[flag + 1] : undefined;
      return message ? { kind: "commit", message } : { error: 'Use git commit -m "a message".' };
    }
    case "switch": {
      const create = rest[0] === "-c";
      const branch = create ? rest[1] : rest[0];
      return branch ? { kind: "switch", branch, create } : { error: "git switch needs a branch name." };
    }
    case "merge":
      return rest[0] ? { kind: "merge", branch: rest[0] } : { error: "git merge needs a branch name." };
    case "restore": {
      const staged = rest.includes("--staged");
      const path = rest.find((word) => word !== "--staged");
      return path ? { kind: "restore", path, staged } : { error: "git restore needs a file name." };
    }
    case "stash":
      if (rest[0] === "pop") return { kind: "stash-pop" };
      return rest.length === 0 ? { kind: "stash" } : { error: "The simulator knows git stash and git stash pop." };
    default:
      return { error: `The simulator does not know "git ${verb ?? ""}".` };
  }
}

/** Write a command back out as text, the way it would be typed. */
export function formatCommand(command: Command): string {
  switch (command.kind) {
    case "status":
      return "git status";
    case "log":
      return "git log --oneline";
    case "diff":
      return command.staged ? "git diff --staged" : "git diff";
    case "add":
      return `git add ${command.path}`;
    case "commit":
      return `git commit -m "${command.message}"`;
    case "switch":
      return command.create ? `git switch -c ${command.branch}` : `git switch ${command.branch}`;
    case "merge":
      return `git merge ${command.branch}`;
    case "restore":
      return command.staged ? `git restore --staged ${command.path}` : `git restore ${command.path}`;
    case "stash":
      return "git stash";
    case "stash-pop":
      return "git stash pop";
  }
}

/** Run one command. Never changes the repository passed in. */
export function execute(original: Repo, command: Command): Result {
  const repo = clone(original);
  const ok = (output: string): Result => ({ repo, output, ok: true });
  const refuse = (output: string): Result => ({ repo: original, output, ok: false });

  switch (command.kind) {
    case "status":
      return ok(formatStatus(repo));

    case "log":
      return ok(
        history(repo)
          .map((commit) => `${commit.id} ${commit.message}`)
          .join("\n"),
      );

    case "diff": {
      const before = command.staged ? headFiles(repo) : repo.index;
      const after = command.staged ? repo.index : repo.working;
      const tracked = (path: string) => command.staged || repo.index[path] !== undefined;
      return ok(formatDiff(before, after, changesBetween(before, after, tracked)));
    }

    case "add": {
      const paths =
        command.path === "."
          ? changesBetween(repo.index, repo.working).map((change) => change.path)
          : [command.path];
      for (const path of paths) {
        if (repo.working[path] === undefined && repo.index[path] === undefined) {
          return refuse(`fatal: pathspec '${path}' did not match any files`);
        }
        if (repo.working[path] === undefined) delete repo.index[path];
        else repo.index[path] = repo.working[path]!;
      }
      return ok("");
    }

    case "commit": {
      const staged = changesBetween(headFiles(repo), repo.index);
      if (staged.length === 0) {
        return refuse('nothing added to commit. Use "git add" to choose what goes in the next commit.');
      }
      const id = addCommit(repo, command.message, [repo.branches[repo.head]!], repo.index);
      repo.branches[repo.head] = id;
      const files = staged.length === 1 ? "1 file changed" : `${staged.length} files changed`;
      return ok(`[${repo.head} ${id}] ${command.message}\n ${files}`);
    }

    case "switch": {
      if (command.create) {
        if (repo.branches[command.branch]) return refuse(`fatal: a branch named '${command.branch}' already exists`);
        repo.branches[command.branch] = repo.branches[repo.head]!;
        repo.head = command.branch;
        return ok(`Switched to a new branch '${command.branch}'`);
      }
      if (!repo.branches[command.branch]) return refuse(`fatal: invalid reference: ${command.branch}`);
      if (command.branch === repo.head) return ok(`Already on '${command.branch}'`);
      return switchBranch(repo, original, command.branch);
    }

    case "merge":
      return merge(repo, original, command.branch);

    case "restore": {
      const { path } = command;
      if (command.staged) {
        const committed = headFiles(repo)[path];
        if (committed === undefined) delete repo.index[path];
        else repo.index[path] = committed;
        return ok("");
      }
      if (repo.index[path] === undefined) {
        return refuse(`error: pathspec '${path}' did not match any file(s) known to git`);
      }
      repo.working[path] = repo.index[path]!;
      return ok("");
    }

    case "stash": {
      if (isClean(repo)) return refuse("No local changes to save");
      const head = headFiles(repo);
      const tip = repo.commits[repo.branches[repo.head]!]!;
      const tracked: Files = {};
      for (const path of Object.keys(repo.working)) {
        if (repo.index[path] !== undefined || head[path] !== undefined) tracked[path] = repo.working[path]!;
      }
      const message = `WIP on ${repo.head}: ${tip.id} ${tip.message}`;
      repo.stash = [{ base: head, working: tracked, message }, ...repo.stash];
      const untracked = status(original).untracked;
      repo.index = { ...head };
      repo.working = { ...head };
      for (const path of untracked) repo.working[path] = original.working[path]!;
      return ok(`Saved working directory and index state ${message}`);
    }

    case "stash-pop": {
      const [entry, ...rest] = repo.stash;
      if (!entry) return refuse("No stash entries found.");
      for (const change of changesBetween(entry.base, entry.working)) {
        if (change.kind === "deleted") delete repo.working[change.path];
        else repo.working[change.path] = entry.working[change.path]!;
      }
      repo.stash = rest;
      return ok(`${formatStatus(repo)}\nDropped refs/stash@{0}`);
    }
  }
}

/** Switch to an existing branch, carrying uncommitted changes only when they do not clash. */
function switchBranch(repo: Repo, original: Repo, branch: string): Result {
  const head = headFiles(repo);
  const target = repo.commits[repo.branches[branch]!]!.files;
  const current = status(repo);
  const changed = [...current.staged, ...current.unstaged].map((change) => change.path);
  const clashes = [...new Set(changed)].filter((path) => head[path] !== target[path]);
  if (clashes.length > 0) {
    return {
      repo: original,
      ok: false,
      output: `error: Your local changes to the following files would be overwritten by checkout:\n\t${clashes.join("\n\t")}\nPlease commit your changes or stash them before you switch branches.`,
    };
  }
  const index = { ...target };
  for (const change of current.staged) {
    if (repo.index[change.path] === undefined) delete index[change.path];
    else index[change.path] = repo.index[change.path]!;
  }
  const working = { ...index };
  for (const change of current.unstaged) {
    if (repo.working[change.path] === undefined) delete working[change.path];
    else working[change.path] = repo.working[change.path]!;
  }
  for (const path of current.untracked) working[path] = repo.working[path]!;
  repo.head = branch;
  repo.index = index;
  repo.working = working;
  return { repo, ok: true, output: `Switched to branch '${branch}'` };
}

/** Merge another branch into the current one: fast-forward, or a merge commit when both have moved on. */
function merge(repo: Repo, original: Repo, branch: string): Result {
  const theirs = repo.branches[branch];
  if (!theirs) return { repo: original, ok: false, output: `merge: ${branch} - not something we can merge` };
  if (!isClean(repo)) {
    return { repo: original, ok: false, output: "error: You have uncommitted changes. Commit or stash them before you merge." };
  }
  const ours = repo.branches[repo.head]!;
  const ourHistory = ancestors(repo, ours);
  if (ourHistory.has(theirs)) return { repo, ok: true, output: "Already up to date." };

  const untracked = status(repo).untracked;
  const keepUntracked = (files: Files) => {
    const working = { ...files };
    for (const path of untracked) working[path] = repo.working[path]!;
    return working;
  };

  if (ancestors(repo, theirs).has(ours)) {
    repo.branches[repo.head] = theirs;
    repo.index = { ...repo.commits[theirs]!.files };
    repo.working = keepUntracked(repo.index);
    return { repo, ok: true, output: `Updating ${ours}..${theirs}\nFast-forward` };
  }

  // Three-way merge: compare each file on both sides with the last commit they share.
  const theirHistory = ancestors(repo, theirs);
  const base = [...ourHistory].filter((id) => theirHistory.has(id)).sort((a, b) => ancestors(repo, b).size - ancestors(repo, a).size)[0]!;
  const baseFiles = repo.commits[base]!.files;
  const ourFiles = repo.commits[ours]!.files;
  const theirFiles = repo.commits[theirs]!.files;
  const merged: Files = {};
  const conflicts: string[] = [];
  for (const path of new Set([...Object.keys(baseFiles), ...Object.keys(ourFiles), ...Object.keys(theirFiles)])) {
    const [b, o, t] = [baseFiles[path], ourFiles[path], theirFiles[path]];
    let result: string | undefined;
    if (o === t) result = o;
    else if (o === b) result = t;
    else if (t === b) result = o;
    else {
      conflicts.push(path);
      continue;
    }
    if (result !== undefined) merged[path] = result;
  }
  if (conflicts.length > 0) {
    return {
      repo: original,
      ok: false,
      output: `CONFLICT (content): Merge conflict in ${conflicts.join(", ")}\nThe simulator stops here. In real Git you would edit the file to keep the right lines, then git add and git commit it.`,
    };
  }
  const id = addCommit(repo, `Merge branch '${branch}'`, [ours, theirs], merged);
  repo.branches[repo.head] = id;
  repo.index = { ...merged };
  repo.working = keepUntracked(merged);
  return { repo, ok: true, output: "Merge made by the 'ort' strategy." };
}

// ---- Text output ----

function formatStatus(repo: Repo): string {
  const current = status(repo);
  const lines = [`On branch ${repo.head}`];
  if (current.staged.length > 0) {
    lines.push("Changes to be committed:", ...current.staged.map((c) => `\t${`${c.kind}:`.padEnd(12)}${c.path}`));
  }
  if (current.unstaged.length > 0) {
    lines.push("Changes not staged for commit:", ...current.unstaged.map((c) => `\t${`${c.kind}:`.padEnd(12)}${c.path}`));
  }
  if (current.untracked.length > 0) {
    lines.push("Untracked files:", ...current.untracked.map((path) => `\t${path}`));
  }
  if (current.staged.length + current.unstaged.length + current.untracked.length === 0) {
    lines.push("nothing to commit, working tree clean");
  }
  return lines.join("\n");
}

function formatDiff(before: Files, after: Files, changes: Change[]): string {
  return changes
    .map(({ path }) => {
      const body = lineDiff(before[path] ?? "", after[path] ?? "").map((line) => `${line.op}${line.text}`);
      return [`diff --git a/${path} b/${path}`, `--- a/${path}`, `+++ b/${path}`, ...body].join("\n");
    })
    .join("\n");
}

// ---- Goals ----

/** Whether one goal is met. */
export function goalMet(repo: Repo, goal: GitGoal): boolean {
  const head = headFiles(repo);
  if ("committed" in goal) return Object.entries(goal.committed).every(([path, text]) => head[path] === normalise(text));
  if ("working" in goal) return Object.entries(goal.working).every(([path, text]) => repo.working[path] === normalise(text));
  if ("clean" in goal) return isClean(repo);
  if ("branch" in goal) return repo.head === goal.branch;
  if ("lastCommitFiles" in goal) {
    const tip = repo.commits[repo.branches[repo.head]!]!;
    const parent = tip.parents[0] ? repo.commits[tip.parents[0]]!.files : {};
    const changed = changesBetween(parent, tip.files).map((change) => change.path);
    return changed.length === goal.lastCommitFiles.length && goal.lastCommitFiles.every((path) => changed.includes(path));
  }
  if ("commits" in goal) return ancestors(repo, repo.branches[repo.head]!).size === goal.commits;
  if ("stashed" in goal) return repo.stash.length === goal.stashed;
  const tip = repo.branches[goal.merged];
  return tip !== undefined && ancestors(repo, repo.branches[repo.head]!).has(tip);
}

/** Whether every goal is met. */
export function allGoalsMet(repo: Repo, goals: GitGoal[]): boolean {
  return goals.every((goal) => goalMet(repo, goal));
}
