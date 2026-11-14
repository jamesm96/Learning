# Writing lessons

Everything in this folder is course content. The app's code never needs to change to
add or edit a lesson. The exact rules are in `src/content/schema.ts`; this page shows
the shape of each piece.

Check your work with `npm run check:content`. It validates every file and runs every
runnable exercise in real Python (Pyodide, Python 3.14), and every Git exercise in the
Git simulator. The build runs the same checks and refuses to deploy if anything fails.

## Layout

```
course.yaml                  module order, and the sample files
files/                       sample files: written into the working folder before every run
modules/01-data/module.yaml  title, summary, intro, lesson list, review checklist, C#/C++ bridge, Apply tasks, prompts
modules/01-data/01-....md    one lesson per file
```

## A lesson file

```markdown
---
id: data-04
title: "Dictionaries: things by name"
minutes: 6
recap: |
  A dictionary stores values under keys... (a model two-sentence explanation)
---

Reading text. One idea per step, at most one code block.

---

```exercise choice
...
```
```

- Steps are separated by a line containing only `---`.
- A step is either short Markdown, or one exercise block with an optional sentence or two above it.
- `recap` adds a final "Explain it back" step: the learner writes two sentences, then sees this model answer.
- In lesson text, a ```` ```python ```` block is coloured. A ```` ```traceback ```` block holds Python code
  that fails: the build runs it and shows the real traceback. Never type a traceback by hand.

## Exercise types

Every exercise has an `id` (lowercase, digits and dashes, unique across the course) and an `explain`
(Markdown, shown after the answer). Code, output and checks use `|` blocks.

| Type | What the learner does | Key fields |
|---|---|---|
| `predict` | Predicts the output, then runs it | `code`, `output` (exact), `hint`, `files` |
| `choice` | Picks one option | `question`, `code`, `options`, `answer`, `tag: Judgement call` |
| `cloze` | Fills one or two `___` gaps from options | `prompt`, `code`, `blanks: [{options, answer}]` |
| `edit` | Changes code until hidden checks pass | `goal`, `code`, `check`, `solution`, `files` |
| `fix` | Fixes broken code, then names the cause | `symptom`, `code`, `check`, `solution`, `cause: {options, answer}`, `files` |
| `traceback` | Taps the failing frame of a real traceback, then picks the cause | `code` (must raise), `question`, `options`, `answer`, `files` |
| `shape` | Taps through JSON to build the path to a value, or types it | `question`, `name`, `data` (JSON text), `answer` (a path such as `data["assets"][2]["materials"][1]`) |
| `parsons` | Puts shuffled lines in order and sets indentation | `prompt`, `code` (the correct program, 4-space indents), `check` |
| `split` | Assigns parts of a long script to named functions; self-assessed | `prompt`, `code`, `jobs: [{id, name, description}]`, `answer: [{job, lines: "4-9"}]`, `model` |
| `diff` | Taps changed lines that go beyond the stated task | `task`, `diff` (unified), `flags` (the exact changed lines to flag, with `+`/`-`; may be empty) |
| `git` | Uses Git commands in the simulator to reach a goal | `task`, `start`, `goal`, `solution` |

`check` is hidden Python that runs after the learner's code, in the same namespace. Write asserts with
plain-sentence messages: `assert total == 32170, "total should add up every asset's triangles"`.
The build proves that the starting `code` fails the check and the `solution` (or, for parsons, the
correct order) passes it.

### Files

Every run starts in a fresh working folder holding the sample files listed in `course.yaml`
(`manifest.json`, `assets.csv`, `notes.txt`, `products.csv`, `sensors.csv`). Code can read and write
them with ordinary relative paths. An exercise can add or replace files with `files: { "name.txt": "content" }`.

### The simulated network

`from simulated import requests` gives a stand-in for the `requests` library with canned replies
(see `src/python/simulated.py` for every address it knows). Always say in the lesson that it is a
simulation, and that on a computer `pip install requests` gives the real thing with the same calls.

### Git exercises

```yaml
start:
  commits:                                   # history on main, oldest first; files change on top of the last
    - { message: "Add exporter", files: { "export.py": "export()", "budget.py": "BUDGET = 9000" } }
  branches:                                  # optional; each forks from the last main commit
    - { name: "lod-tweaks", commits: [{ message: "Lower LOD", files: { "lod.py": "LOD = 2" } }] }
  staged:  { "budget.py": "BUDGET = 12000" } # optional: changes already added
  working: { "export.py": "export()\nprint('debug')" }   # optional: edits not yet added; null deletes a file
goal:                                        # every condition must hold
  - committed: { "budget.py": "BUDGET = 12000" }   # files in the latest commit
  - working:   { "export.py": "export()" }         # files in the working folder
  - clean: true                                    # nothing staged or modified (untracked files are ignored)
  - branch: main                                   # current branch
  - lastCommitFiles: [budget.py]                   # exactly these files changed in the latest commit
  - commits: 2                                     # commits in the current history
  - stashed: 1                                     # entries on the stash
  - merged: lod-tweaks                             # that branch's work is in the current history
solution: ["git add budget.py", 'git commit -m "Raise budget"']
```

Commands the simulator knows: `status`, `diff`, `diff --staged`, `add <file>`, `add .`, `commit -m "..."`,
`switch <branch>`, `switch -c <branch>`, `merge <branch>`, `restore <file>`, `restore --staged <file>`,
`stash`, `stash pop`, `log`. Merges that conflict stop with an explanation. There is no remote, so no
`push` or `pull`.

## Module files

```yaml
id: data
label: Module 1
title: Data
summary: The shapes everything is made of.
intro: |
  Markdown shown at the top of the module page.
lessons: [01-values-and-types.md, ...]
check: ["When Claude writes this, check ...", ...]
bridge: |
  The same ideas in C# and C++ (Markdown, tables allowed).
apply:
  - { id: data-apply-blender, tier: In Blender, text: "..." }   # tiers: In Blender, Pipeline, Beyond games
prompts:
  - { title: "Review the data handling", text: "A prompt to copy into Claude..." }
```

## YAML traps

- Put text in quotes when it contains a comma, a colon followed by a space, or starts with a backtick or quote.
  Inside single quotes, write a single quote twice: `'it''s'`.
- `true`, `false`, `yes`, `no`, `null`, `on`, `off` and bare numbers are not text. Never use them as ids.

## Voice

Plain, specific, short sentences. Say *why*. Adult tone: no exclamation marks, no "Great job", no emoji.
British spelling. Examples from games and Blender, but also ComfyUI, online shops, sensors and simulation,
and robotics, so the skills visibly carry over.
