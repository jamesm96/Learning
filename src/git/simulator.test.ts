import { describe, expect, it } from "vitest";
import type { GitStart } from "../content/schema";
import { lineDiff } from "./line-diff";
import {
  allGoalsMet,
  createRepo,
  execute,
  formatCommand,
  goalMet,
  headFiles,
  history,
  isClean,
  parseCommand,
  status,
  type Repo,
} from "./simulator";

/** Run typed commands one after another; fail the test if any is not understood. */
function run(repo: Repo, ...commands: string[]): { repo: Repo; outputs: string[]; oks: boolean[] } {
  const outputs: string[] = [];
  const oks: boolean[] = [];
  for (const text of commands) {
    const command = parseCommand(text);
    if ("error" in command) throw new Error(command.error);
    const result = execute(repo, command);
    repo = result.repo;
    outputs.push(result.output);
    oks.push(result.ok);
  }
  return { repo, outputs, oks };
}

// A project with two files and two edits, one of them unwanted.
const start: GitStart = {
  commits: [{ message: "Add exporter", files: { "export.py": "export()", "budget.py": "BUDGET = 9000" } }],
  working: { "budget.py": "BUDGET = 12000", "export.py": "export()\nprint('debug')" },
};

describe("createRepo", () => {
  it("builds history, staging and the working folder", () => {
    const repo = createRepo(start);
    expect(history(repo)).toHaveLength(1);
    expect(repo.index["budget.py"]).toBe("BUDGET = 9000");
    expect(repo.working["budget.py"]).toBe("BUDGET = 12000");
  });

  it("forks extra branches from the last commit on main", () => {
    const repo = createRepo({
      commits: [{ message: "Start", files: { "a.py": "a" } }],
      branches: [{ name: "feature", commits: [{ message: "Add b", files: { "b.py": "b" } }] }],
    });
    expect(repo.head).toBe("main");
    expect(repo.commits[repo.branches.feature!]!.parents).toEqual([repo.branches.main]);
  });
});

describe("status", () => {
  it("separates staged, unstaged and untracked changes", () => {
    let repo = createRepo({ ...start, working: { ...start.working, "notes.txt": "todo" } });
    repo = run(repo, "git add budget.py").repo;
    expect(status(repo)).toEqual({
      staged: [{ path: "budget.py", kind: "modified" }],
      unstaged: [{ path: "export.py", kind: "modified" }],
      untracked: ["notes.txt"],
    });
  });
});

describe("the daily loop", () => {
  it("commits only what was staged", () => {
    const { repo, outputs } = run(createRepo(start), "git add budget.py", 'git commit -m "Raise budget"');
    expect(outputs[1]).toContain("1 file changed");
    expect(headFiles(repo)["budget.py"]).toBe("BUDGET = 12000");
    expect(headFiles(repo)["export.py"]).toBe("export()");
    expect(goalMet(repo, { lastCommitFiles: ["budget.py"] })).toBe(true);
  });

  it("refuses to commit when nothing is staged", () => {
    const { oks, outputs } = run(createRepo(start), 'git commit -m "Nothing"');
    expect(oks[0]).toBe(false);
    expect(outputs[0]).toContain("git add");
  });

  it("throws away an unwanted edit with restore", () => {
    const { repo } = run(createRepo(start), "git restore export.py");
    expect(repo.working["export.py"]).toBe("export()");
    expect(repo.working["budget.py"]).toBe("BUDGET = 12000"); // the other edit is untouched
  });

  it("unstages with restore --staged, keeping the edit", () => {
    const { repo } = run(createRepo(start), "git add .", "git restore --staged export.py");
    expect(status(repo).staged.map((c) => c.path)).toEqual(["budget.py"]);
    expect(repo.working["export.py"]).toContain("debug");
  });

  it("shows a line diff of unstaged changes", () => {
    const { outputs } = run(createRepo(start), "git diff");
    expect(outputs[0]).toContain("-BUDGET = 9000\n+BUDGET = 12000");
    expect(outputs[0]).toContain("+print('debug')");
  });

  it("never changes the repository it was given", () => {
    const repo = createRepo(start);
    run(repo, "git add .", 'git commit -m "All"');
    expect(history(repo)).toHaveLength(1);
    expect(repo.index["budget.py"]).toBe("BUDGET = 9000");
  });
});

describe("branches and merging", () => {
  it("fast-forwards when main has not moved", () => {
    let repo = createRepo({ commits: [{ message: "Start", files: { "a.py": "1" } }] });
    repo = run(repo, "git switch -c lod", "git restore a.py").repo;
    repo.working["a.py"] = "2"; // an edit made in the editor
    const result = run(repo, "git add a.py", 'git commit -m "Change a"', "git switch main", "git merge lod");
    expect(result.outputs[3]).toContain("Fast-forward");
    expect(headFiles(result.repo)["a.py"]).toBe("2");
    expect(goalMet(result.repo, { merged: "lod" })).toBe(true);
  });

  it("makes a merge commit when both branches changed different files", () => {
    const repo = createRepo({
      commits: [{ message: "Start", files: { "a.py": "1", "b.py": "1" } }, { message: "Change a", files: { "a.py": "2" } }],
      branches: [{ name: "feature", commits: [{ message: "Change b", files: { "b.py": "2" } }] }],
    });
    // feature forked from the last main commit, so move main on first to force a real merge.
    repo.working["a.py"] = "3";
    const { repo: merged, outputs } = run(repo, "git add a.py", 'git commit -m "Change a again"', "git merge feature");
    expect(outputs[2]).toContain("Merge made");
    expect(headFiles(merged)).toEqual({ "a.py": "3", "b.py": "2" });
    expect(history(merged)[0]!.parents).toHaveLength(2);
  });

  it("stops with an explanation on a conflict", () => {
    const repo = createRepo({
      commits: [{ message: "Start", files: { "a.py": "1" } }],
      branches: [{ name: "feature", commits: [{ message: "Theirs", files: { "a.py": "theirs" } }] }],
    });
    repo.working["a.py"] = "ours";
    const { oks, outputs, repo: after } = run(repo, "git add a.py", 'git commit -m "Ours"', "git merge feature");
    expect(oks[2]).toBe(false);
    expect(outputs[2]).toContain("CONFLICT");
    expect(headFiles(after)["a.py"]).toBe("ours");
  });

  it("refuses to switch when uncommitted changes would be overwritten", () => {
    const repo = createRepo({
      commits: [{ message: "Start", files: { "a.py": "1" } }],
      branches: [{ name: "feature", commits: [{ message: "Change a", files: { "a.py": "2" } }] }],
      working: { "a.py": "mine" },
    });
    const { oks, outputs } = run(repo, "git switch feature");
    expect(oks[0]).toBe(false);
    expect(outputs[0]).toContain("commit your changes or stash them");
  });
});

describe("stash", () => {
  it("puts changes aside and brings them back", () => {
    let repo = createRepo(start);
    repo = run(repo, "git stash").repo;
    expect(isClean(repo)).toBe(true);
    expect(goalMet(repo, { stashed: 1 })).toBe(true);
    repo = run(repo, "git stash pop").repo;
    expect(repo.working["budget.py"]).toBe("BUDGET = 12000");
    expect(repo.stash).toHaveLength(0);
  });

  it("says so when there is nothing to stash", () => {
    const repo = createRepo({ commits: start.commits });
    expect(run(repo, "git stash").outputs[0]).toBe("No local changes to save");
  });
});

describe("goals", () => {
  it("checks committed contents, ignoring trailing whitespace", () => {
    const { repo } = run(createRepo(start), "git add budget.py", 'git commit -m "Raise"');
    expect(allGoalsMet(repo, [{ committed: { "budget.py": "BUDGET = 12000\n" } }, { branch: "main" }, { commits: 2 }])).toBe(true);
  });
});

describe("parseCommand and formatCommand", () => {
  it("reads quoted commit messages", () => {
    expect(parseCommand('git commit -m "Raise the budget"')).toEqual({ kind: "commit", message: "Raise the budget" });
  });

  it("round-trips every command", () => {
    for (const text of ["git status", "git diff --staged", "git add a.py", "git switch -c lod", "git restore --staged a.py", "git stash pop"]) {
      const command = parseCommand(text);
      expect("error" in command).toBe(false);
      if (!("error" in command)) expect(formatCommand(command)).toBe(text);
    }
  });

  it("explains commands it does not know", () => {
    expect(parseCommand("git push")).toMatchObject({ error: expect.stringContaining("git push") });
  });
});

describe("lineDiff", () => {
  it("marks removed and added lines", () => {
    expect(lineDiff("a\nb\nc", "a\nB\nc")).toEqual([
      { op: " ", text: "a" },
      { op: "-", text: "b" },
      { op: "+", text: "B" },
      { op: " ", text: "c" },
    ]);
  });
});
