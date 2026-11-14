---
id: git-01
title: The mental model
minutes: 6
recap: |
  A commit is a saved snapshot of the whole project with a message, and history is a chain of them kept on my own machine. Changes go from the working folder into staging with `git add`, then into history with `git commit`, and staging lets me choose which changes belong together.
---

Git records snapshots of a project so you can see what changed, go back, and try things safely. Every software team in every industry uses it.

For you it has a third job. The list of changes Git shows is the best place to review what an AI did to your code.

---

## Snapshots in a chain

A **commit** is a saved snapshot of the whole project, with a message saying what changed.

**History** is a chain of commits, newest on top. Any commit in it is a place you can go back to.

Git does not store your edits as you type. Nothing is saved in history until you commit.

---

## Four places

Changes move through three places on your machine, then optionally to a server.

| Place | What it holds | Moves on with |
|---|---|---|
| Working folder | Your files as they are now | `git add` |
| Staging | What the next snapshot will contain | `git commit` |
| History | Saved snapshots on your machine | `git push` |
| Remote | A copy on GitHub or a company server | `git pull` brings it back |

---

```exercise choice
id: git-01-why-staging
question: You edited five files. Why does Git make you stage changes before committing them?
options:
  - { id: choose, text: "So you can choose which changes go into this snapshot" }
  - { id: backup, text: "Staging is a backup in case the commit fails" }
  - { id: share, text: "Staged files are shared with your team straight away" }
answer: choose
explain: |
  Staging exists so a snapshot holds one idea. You might have edited five files and want to commit the two that belong together, and leave the rest for a later commit or throw them away.
```

---

Two files have changed. Only one belongs in this commit. Try `git status` and `git diff` first to see what is there.

```exercise git
id: git-01-commit-budget
task: "Commit only the budget change. The edit to `export.py` is an experiment that is not ready."
start:
  commits:
    - message: Add exporter and budget
      files:
        export.py: "def export(asset):\n    write(asset)"
        budget.py: "BUDGET = 9000"
  working:
    budget.py: "BUDGET = 12000"
    export.py: "def export(asset):\n    write(asset, fast=True)"
goal:
  - committed: { budget.py: "BUDGET = 12000" }
  - lastCommitFiles: [budget.py]
solution:
  - git add budget.py
  - 'git commit -m "Raise triangle budget to 12000"'
explain: |
  `git add budget.py` stages one file, so the commit holds only that change. The experiment in `export.py` is still in your working folder, untouched, for later.

  `git add .` would have staged both. It is convenient, and it is how unrelated changes end up in one commit.
```

---

## If you know Perforce

The ideas map closely.

| Perforce | Git |
|---|---|
| Submitted changelist | Commit |
| Pending changelist | Staging |
| Shelving | `git stash` |
| Submit (goes to the server) | Commit, then push: two steps |

The big difference: Git keeps the full history on your own machine, and committing and sharing are separate steps.

---

```exercise cloze
id: git-01-shelve
prompt: In Perforce you shelve work to set it aside without submitting it. Which Git command does the same job?
code: |
  git ___
blanks:
  - { options: [stash, commit, push, restore], answer: stash }
explain: |
  `git stash` puts your uncommitted changes aside and gives you a clean folder. `git stash pop` brings them back. One difference from shelving: a stash stays on your machine, so a colleague cannot unshelve it.
```

---

```exercise choice
id: git-01-where-commit
question: You commit on a train with no internet. Where is the commit now?
options:
  - { id: local, text: "In the history on your own machine. Nobody else has it until you push." }
  - { id: server, text: "On the server, because committing sends it there" }
  - { id: nowhere, text: "Nowhere yet. Git cannot commit without a connection." }
answer: local
explain: |
  A commit is local. That is the difference from a Perforce submit, which goes straight to the server. You can commit as often as you like offline, and `git push` shares the commits later.
```
