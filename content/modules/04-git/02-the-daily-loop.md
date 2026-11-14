---
id: git-02
title: The daily loop
minutes: 7
recap: |
  Most days are `git status`, `git diff`, `git add`, `git commit` and `git push`, and `git status` is always the safe first command when I am unsure. A good commit holds one idea, its message says what the change does as an instruction, and I commit whenever something works.
---

## Six commands

```text
git status          what has changed?
git diff            show me the changes, line by line
git add checks.py   stage this file
git commit -m "Add triangle budget check"
git log --oneline   the history, one line each
git push            send my commits to the remote
```

Those six cover most days. `git status` only looks, never changes anything, so it is always safe and always the right first command when unsure.

---

```exercise cloze
id: git-02-loop-order
prompt: Fill the gap so these three commands save `checks.py` as a new commit.
code: |
  git status
  git ___ checks.py
  git commit -m "Add triangle budget check"
blanks:
  - { options: [add, push, stash, diff], answer: add }
explain: |
  `git add` moves the change into staging, and `git commit` turns everything staged into a snapshot. Without the `add`, the commit would refuse: nothing is staged.
```

---

## Good commits

- **One idea per commit.** "Add budget check" and "Rename panel" are two commits.
- **The message says what the change does,** as an instruction: "Fix export path on Windows", "Add LOD count to report".
- **Commit when something works,** however small. Each commit is a place you can return to.

---

```exercise choice
id: git-02-message
question: Which commit message will help you most in six months?
options:
  - { id: updates, text: '"updates"' }
  - { id: broke, text: '"fixed stuff Claude broke"' }
  - { id: specific, text: '"Skip assets with no materials during export"' }
answer: specific
explain: |
  A history of specific messages lets you find when a behaviour changed. It is also what a hiring manager sees if they open your repository.
```

---

Two unrelated changes are waiting. Make them two commits, one idea each.

```exercise git
id: git-02-two-commits
task: "Commit the budget change first, then the panel label fix, as two separate commits."
start:
  commits:
    - message: Add exporter panel
      files:
        budget.py: "BUDGET = 9000"
        panel.py: "LABEL = 'Exprot'"
  working:
    budget.py: "BUDGET = 12000"
    panel.py: "LABEL = 'Export'"
goal:
  - commits: 3
  - lastCommitFiles: [panel.py]
  - committed: { budget.py: "BUDGET = 12000", panel.py: "LABEL = 'Export'" }
  - clean: true
solution:
  - git add budget.py
  - 'git commit -m "Raise triangle budget to 12000"'
  - git add panel.py
  - 'git commit -m "Fix typo in export panel label"'
explain: |
  Two commits mean either change can be found, reviewed or undone on its own. If the new budget causes trouble next month, you can undo it without bringing the typo back.

  `git log` now shows three lines, newest first.
```

---

You typed `git add .` and it staged your scratch notes along with the real change.

```exercise git
id: git-02-unstage-notes
task: "Take `notes.txt` out of staging, then commit only the budget change. Keep the notes file in your folder."
start:
  commits:
    - message: Add budget
      files:
        budget.py: "BUDGET = 9000"
  staged:
    budget.py: "BUDGET = 12000"
    notes.txt: "try LOD 3 on the cliffs?"
goal:
  - committed: { budget.py: "BUDGET = 12000" }
  - lastCommitFiles: [budget.py]
  - working: { notes.txt: "try LOD 3 on the cliffs?" }
solution:
  - git restore --staged notes.txt
  - 'git commit -m "Raise triangle budget to 12000"'
explain: |
  `git restore --staged notes.txt` takes the file out of staging and leaves the file itself alone. Your notes are still in the folder, now listed as untracked.

  Run `git status` before every commit. It shows exactly what is staged, so mistakes like this are caught before they are saved.
```

---

```exercise choice
id: git-02-first-command
tag: Judgement call
question: You come back to a project after a week and cannot remember where you left it. What do you run first?
options:
  - { id: status, text: "`git status`" }
  - { id: addall, text: "`git add .` then commit, to be safe" }
  - { id: push, text: "`git push`" }
answer: status
explain: |
  `git status` changes nothing and tells you the branch you are on, what is staged and what is modified. Then `git diff` shows the details. Committing everything without looking saves half-finished work under a message that says nothing.
```
