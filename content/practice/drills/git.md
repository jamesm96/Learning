---
id: drills-git
title: Git and diffs
minutes: 5
---

You asked an AI to add a dry-run option to an export script. Tap any changed line that goes beyond that.

```exercise diff
id: drills-git-diff-dry-run
task: "Add a `--dry-run` option that prints what would be exported instead of exporting it."
diff: |
  --- a/export_cli.py
  +++ b/export_cli.py
  @@ -3,4 +3,8 @@
   parser.add_argument("manifest")
  +parser.add_argument("--dry-run", action="store_true")
   args = parser.parse_args()
   for asset in load(args.manifest):
  -    export(asset)
  +    if args.dry_run:
  +        print("would export", asset["name"])
  +    else:
  +        export(asset)
flags: []
explain: |
  Every line serves the task. The option is added, a dry run only prints, and a normal run still calls `export(asset)`. The removed line is the same call, moved one level in under `else`.
```

---

The task was a warning for missing greenhouse readings. Tap any changed line that goes beyond it.

```exercise diff
id: drills-git-diff-vent-threshold
task: 'Print a warning and return "unknown" when a reading is missing.'
diff: |
  --- a/greenhouse.py
  +++ b/greenhouse.py
  @@ -1,4 +1,7 @@
   def check(reading):
  +    if reading["temp_c"] is None:
  +        print(f"Warning: no reading from {reading['sensor']}")
  +        return "unknown"
  -    if reading["temp_c"] > 30:
  +    if reading["temp_c"] > 35:
           return "vent"
       return "ok"
flags:
  - '-    if reading["temp_c"] > 30:'
  - '+    if reading["temp_c"] > 35:'
explain: |
  The first three added lines are the task. The vent threshold also moved from 30 to 35, so the greenhouse now gets five degrees hotter before it opens. A changed number in a comparison is easy to miss and changes real behaviour.
```

---

```exercise diff
id: drills-git-diff-skip-sold-out
task: "Leave sold-out products out of the export."
diff: |
  --- a/shop_export.py
  +++ b/shop_export.py
  @@ -1,5 +1,7 @@
   def export_rows(products):
       rows = []
       for p in products:
  +        if p["stock"] == 0:
  +            continue
           rows.append([p["sku"], p["price"]])
       return rows
flags: []
explain: |
  Two lines, both the task. `continue` skips to the next product, so a product with no stock never reaches `append`. Nothing else in the function changed, which makes this a quick approval.
```

---

You asked for type hints only. Read every changed line before you tap.

```exercise diff
id: drills-git-diff-hints-encoding
task: "Add type hints to `load_manifest`."
diff: |
  --- a/manifest.py
  +++ b/manifest.py
  @@ -1,5 +1,5 @@
   import json

  -def load_manifest(path):
  -    with open(path, encoding="utf-8") as f:
  +def load_manifest(path: str) -> dict:
  +    with open(path, encoding="latin-1") as f:
           return json.load(f)
flags:
  - '-    with open(path, encoding="utf-8") as f:'
  - '+    with open(path, encoding="latin-1") as f:'
explain: |
  The new `def` line is the task. The encoding change is not: JSON files are UTF-8, and reading them as Latin-1 turns names such as "Café" into garbled text without raising any error. Hints never change behaviour; this line does.
```

---

```exercise diff
id: drills-git-diff-gitignore-env
task: "Stop Blender's `.blend1` backup files from showing up in Git."
diff: |
  --- a/.gitignore
  +++ b/.gitignore
  @@ -1,4 +1,4 @@
   __pycache__/
  -.env
   renders/
   *.log
  +*.blend1
flags:
  - '-.env'
explain: |
  Adding `*.blend1` is the task. Removing `.env` means the file holding your API keys is no longer ignored, so the next `git add .` would stage it. Once a secret is committed it stays in the history, so treat a removed ignore rule as a serious change.
```

---

You asked for a new output name in a ComfyUI script. Tap any changed line that goes beyond that.

```exercise diff
id: drills-git-diff-comfy-seed
task: 'Change the output filename prefix from "test" to "harbour".'
diff: |
  --- a/queue_render.py
  +++ b/queue_render.py
  @@ -1,4 +1,5 @@
  +import random
   workflow = load_workflow("harbour_api.json")
  -workflow["9"]["inputs"]["filename_prefix"] = "test"
  -workflow["3"]["inputs"]["seed"] = 42
  +workflow["9"]["inputs"]["filename_prefix"] = "harbour"
  +workflow["3"]["inputs"]["seed"] = random.randint(0, 999)
   queue(workflow)
flags:
  - '+import random'
  - '-workflow["3"]["inputs"]["seed"] = 42'
  - '+workflow["3"]["inputs"]["seed"] = random.randint(0, 999)'
explain: |
  Only the prefix lines are the task. The fixed seed of 42 became a random one, so the same workflow no longer gives the same image twice, and you lose the ability to reproduce a result. The `import random` exists only to support that change, so it goes too.
```

---

There is an untracked `.env` file in this folder. Commit only the sensor fix.

```exercise git
id: drills-git-sim-commit-one-file
task: "Commit the change to `sensor.py` on its own. Leave `notes.md` and `.env` out of the commit."
start:
  commits:
    - message: Add sensor reader
      files:
        sensor.py: "LIMIT = 30"
        notes.md: "# Greenhouse"
  working:
    sensor.py: "LIMIT = 32"
    notes.md: "# Greenhouse\n- check vents"
    .env: "API_KEY=abc123"
goal:
  - committed: { sensor.py: "LIMIT = 32", notes.md: "# Greenhouse" }
  - lastCommitFiles: [sensor.py]
solution:
  - git add sensor.py
  - 'git commit -m "Raise sensor limit to 32"'
explain: |
  `git add sensor.py` stages one file, so the commit holds one idea. `git add .` would have staged the notes and the `.env` with its key as well. Check `git status` before every commit to see what is about to go in.
```

---

A log file was staged by mistake. Take it out of the staging area, then commit the config change.

```exercise git
id: drills-git-sim-unstage-log
task: "Unstage `debug.log`, then commit only `config.py`."
start:
  commits:
    - message: Add config
      files:
        config.py: "STEPS = 20"
  staged:
    config.py: "STEPS = 30"
    debug.log: "step 1 ok\nstep 2 ok"
goal:
  - committed: { config.py: "STEPS = 30" }
  - lastCommitFiles: [config.py]
solution:
  - git restore --staged debug.log
  - 'git commit -m "Use 30 sampling steps"'
explain: |
  `git restore --staged` takes a file out of the next commit without touching the file itself, so `debug.log` stays on disk, untracked. Adding `*.log` to `.gitignore` would stop it being staged again.
```

---

The `fix-units` branch is finished. Bring its work into `main`.

```exercise git
id: drills-git-sim-merge-branch
task: "Merge the `fix-units` branch into `main`."
start:
  commits:
    - message: Add speed conversion
      files:
        units.py: "KPH = 3.6"
  branches:
    - name: fix-units
      commits:
        - message: Add miles per hour
          files:
            units.py: "KPH = 3.6\nMPH = 2.237"
goal:
  - branch: main
  - merged: fix-units
  - committed: { units.py: "KPH = 3.6\nMPH = 2.237" }
solution:
  - git merge fix-units
explain: |
  You are already on `main`, so `git merge fix-units` brings that branch's commit in. Main had not moved since the branch started, so Git simply moves `main` forward: a fast-forward, with no merge commit.
```

---

You are mid-edit when someone asks you to test the `hotfix` branch. Try switching first and read what Git says.

```exercise git
id: drills-git-sim-stash-switch
task: "Set your unfinished speed edit aside without committing it, then switch to `hotfix`."
start:
  commits:
    - message: Add rover limits
      files:
        rover.py: "MAX_SPEED = 2.0"
  branches:
    - name: hotfix
      commits:
        - message: Cap speed on slopes
          files:
            rover.py: "MAX_SPEED = 2.0\nSLOPE_SPEED = 0.5"
  working:
    rover.py: "MAX_SPEED = 2.5"
goal:
  - branch: hotfix
  - stashed: 1
  - working: { rover.py: "MAX_SPEED = 2.0\nSLOPE_SPEED = 0.5" }
solution:
  - git stash
  - git switch hotfix
explain: |
  Git refuses the switch because `rover.py` differs on `hotfix` and your edit would be overwritten. `git stash` saves the edit and leaves a clean folder. Back on `main` later, `git stash pop` puts it back.
```

---

Try the lighter material on its own branch first, then bring it into `main` once you are happy.

```exercise git
id: drills-git-sim-branch-then-merge
task: "Commit the roughness change on a new branch called `try-roughness`, then merge that branch into `main`."
start:
  commits:
    - message: Add material defaults
      files:
        materials.py: "ROUGHNESS = 0.5"
  working:
    materials.py: "ROUGHNESS = 0.35"
goal:
  - branch: main
  - merged: try-roughness
  - committed: { materials.py: "ROUGHNESS = 0.35" }
  - clean: true
solution:
  - git switch -c try-roughness
  - git add materials.py
  - 'git commit -m "Lower default roughness"'
  - git switch main
  - git merge try-roughness
explain: |
  `git switch -c` carries your uncommitted edit onto the new branch, where you commit it. Back on `main`, the file shows the old value until the merge brings the commit across. If the experiment had failed, you could have left the branch unmerged and `main` would never have known.
```

---

```exercise choice
id: drills-git-choice-keep-out
question: Which of these belongs in the repository?
options:
  - { id: script, text: "`batch_export.py`, the pipeline script" }
  - { id: env, text: "`.env`, holding the shop's payment API key" }
  - { id: renders, text: "`renders/`, 4 GB of output images" }
  - { id: cache, text: "`__pycache__/`, files Python makes when it runs" }
answer: script
explain: |
  Commit what you wrote and need to rebuild everything else. Secrets stay out because history is forever and gets shared. Large outputs and generated caches stay out because they can be remade and they bloat every clone. All three go in `.gitignore`.
```

---

```exercise choice
id: drills-git-choice-restore-staged
question: 'You staged `notes.md` by mistake. What does `git restore --staged notes.md` do?'
options:
  - { id: unstage, text: "Takes it out of the next commit and keeps your edits in the file" }
  - { id: discard, text: "Throws away your edits to the file" }
  - { id: delete, text: "Deletes the file from the folder" }
answer: unstage
explain: |
  With `--staged`, restore only changes the staging area. Without it, `git restore notes.md` puts the file back as it was in the last commit, and your uncommitted edits are gone. One flag decides which, so read it twice.
```

---

```exercise choice
id: drills-git-choice-hunk-header
question: 'In a diff, what does `@@ -12,3 +12,6 @@` tell you?'
options:
  - { id: lines, text: "From line 12, three lines in the old file became six in the new one" }
  - { id: commits, text: "Twelve commits changed, three removed and six added" }
  - { id: files, text: "Three files were removed and six added" }
answer: lines
explain: |
  The `-` side describes the old file and the `+` side the new one: a starting line and a count. A hunk that grows from 3 to 6 lines has added three; check that each one belongs to the task.
```

---

```exercise cloze
id: drills-git-cloze-staged-diff
prompt: See exactly what will go into the next commit, and nothing that is still unstaged.
code: |
  git diff ___
blanks:
  - { options: ["--staged", "-m", "-c", "main"], answer: "--staged" }
explain: |
  Plain `git diff` shows edits you have not staged yet. `git diff --staged` shows what is staged, which is what `git commit` will record. Reading it just before committing catches stray files and debug prints.
```

---

```exercise cloze
id: drills-git-cloze-new-branch
prompt: Start a new branch for an experiment with a lower vent threshold, and move onto it.
code: |
  git switch ___ vent-experiment
blanks:
  - { options: ["-c", "-m", "--staged", "pop"], answer: "-c" }
explain: |
  `-c` creates the branch and switches to it in one step. Without it, `git switch vent-experiment` only works if the branch already exists. Commits made now stay on the experiment until you merge them.
```

---

```exercise cloze
id: drills-git-cloze-ignore-pattern
prompt: In `.gitignore`, ignore every CSV export in the `exports` folder.
code: |
  exports/___.csv
blanks:
  - { options: ["*", "!", "#", "?"], answer: "*" }
explain: |
  `*` matches any run of characters, so `exports/*.csv` covers every CSV file in that folder. `#` starts a comment, and `!` re-includes a file that an earlier rule ignored.
```
