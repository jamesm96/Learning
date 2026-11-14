---
id: git-04
title: Branches and undo
minutes: 8
recap: |
  A branch is a separate line of history for trying something: merge it if it works, delete it if not, and main is never harmed. To undo, I use `git restore` for uncommitted edits, `git stash` to put work aside, and `git revert` for a commit that is already shared, and I stop and check before anyone runs `git reset --hard`.
---

## Branches

A branch is a separate line of history for trying something. If it works, merge it into the main line. If not, delete it and nothing was harmed.

```text
git switch -c try-new-exporter   make a branch, move onto it
  ...work, commit, test...
git switch main                  back to the main line
git merge try-new-exporter       bring the work in
git branch -d try-new-exporter   tidy up
```

`git branch -d` refuses to delete a branch whose work is not merged, which protects you from losing it.

---

You want to try a lower LOD setting without touching main. The edit is already in your folder; uncommitted changes come with you onto a new branch.

```exercise git
id: git-04-branch-commit
task: "Make a branch called `try-lod-3` and commit the LOD change on it."
start:
  commits:
    - message: Add LOD settings
      files:
        lod.py: "LOD_LEVELS = 2"
  working:
    lod.py: "LOD_LEVELS = 3"
goal:
  - branch: try-lod-3
  - committed: { lod.py: "LOD_LEVELS = 3" }
  - clean: true
solution:
  - git switch -c try-lod-3
  - git add lod.py
  - 'git commit -m "Try three LOD levels"'
explain: |
  The commit lives on `try-lod-3`. Run `git switch main` and `lod.py` goes back to `LOD_LEVELS = 2`: main never saw the experiment.
```

---

## Undo

| I want to | Command |
|---|---|
| Throw away my uncommitted changes to one file | `git restore file.py` |
| Take a file out of staging | `git restore --staged file.py` |
| Put work aside for a moment | `git stash`, later `git stash pop` |
| Undo a commit that is already shared | `git revert <commit>` |
| See an old version of the project | `git switch --detach <commit>` |

`git restore file.py` cannot be undone itself: the edit is gone. That is the point, so be sure first.

---

Claude fixed the budget, and also edited the exporter, which you did not ask for. You have read the diff.

```exercise git
id: git-04-restore-export
task: "Throw away the unwanted edit to `export.py`. Keep the budget change."
start:
  commits:
    - message: Add exporter and budget
      files:
        export.py: "def export(asset):\n    write(asset)"
        budget.py: "BUDGET = 9000"
  working:
    budget.py: "BUDGET = 12000"
    export.py: "def export(asset):\n    try:\n        write(asset)\n    except Exception:\n        pass"
goal:
  - working: { export.py: "def export(asset):\n    write(asset)", budget.py: "BUDGET = 12000" }
solution:
  - git restore export.py
explain: |
  `git restore export.py` puts the file back as it was in the last commit. The budget edit is untouched, ready to stage and commit on its own.

  That `except Exception: pass` would have hidden every export failure. Restoring one file is the cheapest way to say no to it.
```

---

You are halfway through a budget edit when a crash fix on another branch needs you. Try `git switch hotfix` first and read what Git says.

```exercise git
id: git-04-stash-switch
task: "Put your unfinished budget edit aside, then switch to the `hotfix` branch."
start:
  commits:
    - message: Add budget
      files:
        budget.py: "BUDGET = 9000"
  branches:
    - name: hotfix
      commits:
        - message: Guard against empty asset lists
          files:
            budget.py: "BUDGET = 9000\nMIN_ASSETS = 1"
  working:
    budget.py: "BUDGET = 15000"
goal:
  - branch: hotfix
  - stashed: 1
  - clean: true
solution:
  - git stash
  - git switch hotfix
explain: |
  Git refused the switch because `budget.py` differs on `hotfix`, and switching would overwrite your edit. `git stash` set the edit aside and left a clean folder.

  When the fix is done, `git switch main` and `git stash pop` bring the edit back. Stashes are easy to forget, so pop them soon.
```

---

```exercise choice
id: git-04-revert
question: A commit you pushed yesterday broke the exporter for the whole team. What is the safe way to undo it?
options:
  - { id: revert, text: "`git revert <commit>`, which adds a new commit that undoes it" }
  - { id: reset, text: "`git reset --hard` to before it, then force-push" }
  - { id: restore, text: "`git restore export.py`" }
answer: revert
explain: |
  `git revert` adds a new commit that reverses the old one, so history only moves forward and colleagues who already pulled are not disturbed.

  Resetting and force-pushing rewrites history that others have. Their copies no longer match, and work can be lost. `git restore` only touches uncommitted changes, so it cannot undo a commit.
```

---

```exercise choice
id: git-04-reset-hard
tag: Judgement call
question: 'An agent says: "I will run `git reset --hard` to get back to a clean state." You have two hours of uncommitted edits. What do you do?'
options:
  - { id: stop, text: "Stop it. Commit or stash the edits first, or restore only the files that need it." }
  - { id: allow, text: "Let it run. Git can always undo a reset." }
  - { id: push, text: "Push first, then let it run" }
answer: stop
explain: |
  `git reset --hard` throws away every uncommitted change to tracked files, and those edits were never saved in history, so Git cannot bring them back. Whenever an agent proposes it, stop and check what would be lost.
```

---

## A working rhythm with an AI agent

1. Commit your working state first.
2. Make a branch for the task.
3. Let the agent work. Read the diff.
4. Keep it, fix it, or delete the branch.

Step 1 matters most. A clean commit before the session means any mess can be undone in one command.
