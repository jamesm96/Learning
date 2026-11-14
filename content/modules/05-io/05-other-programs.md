---
id: io-05
title: Running other programs, and batch thinking
minutes: 8
recap: |
  `subprocess.run` starts another program with its command as a list, one item per word, and `check=True` makes a failure stop my script instead of passing unnoticed; `argparse` gives my own script command-line options. A batch tool I can trust is safe to run twice, has a dry run, survives one bad item, says what it did, and never overwrites its source files.
---

Pipelines chain programs together: Blender exports, a converter packs textures, a renderer makes previews. `subprocess.run` starts one program from Python and waits for it to finish.

```python
import subprocess

subprocess.run(
    ["blender", "--background", "scene.blend",
     "--python", "export.py"],
    check=True,
)
```

A phone cannot start other programs, so this code does not run in the app. Read it here; run it at your desk.

---

The command is a list, one item per word, rather than one long string.

```exercise choice
id: io-05-list-command
question: 'Why `["blender", "--background", "harbour v2.blend"]` rather than the string `"blender --background harbour v2.blend"`?'
options:
  - { id: exact, text: "Each item reaches the program as exactly one argument, so the space in the file name cannot split it in two" }
  - { id: faster, text: "Lists start programs faster than strings" }
  - { id: windows, text: "Strings only work on Windows" }
answer: exact
explain: |
  With a list, nothing has to guess where one argument ends and the next begins. File names with spaces, quotes or accents arrive intact. Generated code sometimes uses one string with `shell=True`; ask why, because it is also how a strange file name can run a command nobody intended.
```

---

```exercise choice
id: io-05-check-true
question: 'Blender fails halfway through the export and exits with an error code. The call has no `check=True`. What does your script do next?'
options:
  - { id: carries-on, text: "Carries on to the next step as if the export worked" }
  - { id: stops, text: "Stops with a `CalledProcessError`" }
  - { id: retries, text: "Runs Blender again" }
answer: carries-on
explain: |
  Without `check=True`, `subprocess.run` just reports the exit code in its result and lets you decide. If nobody looks, a broken step passes unnoticed and the next step works on missing files. With `check=True`, a failure raises `CalledProcessError` straight away.
```

---

## Your own command-line options

To make your script controllable from outside, give it options with `argparse`.

```python
import argparse

parser = argparse.ArgumentParser(
    description="Export assets listed in a manifest.")
parser.add_argument("manifest")
parser.add_argument("--out", default="export")
parser.add_argument("--dry-run", action="store_true")
args = parser.parse_args()
```

At your desk you would run `python export_cli.py manifest.json --out D:/harbour/export --dry-run`. In the app there is no command line, so the next step passes the words as a list.

---

```exercise predict
id: io-05-predict-args
code: |
  import argparse

  parser = argparse.ArgumentParser()
  parser.add_argument("manifest")
  parser.add_argument("--budget", type=int, default=9000)
  parser.add_argument("--out", default="export")
  parser.add_argument("--dry-run", action="store_true")

  args = parser.parse_args(["manifest.json", "--budget", "12000"])
  print(args.manifest)
  print(args.budget + 1)
  print(args.out)
  print(args.dry_run)
output: |
  manifest.json
  12001
  export
  False
explain: |
  `type=int` converts the text `"12000"` for you, so the maths works. `--out` was not given, so it took its default. `--dry-run` becomes `args.dry_run`, with an underscore, and is `False` unless the flag appears.
hint: 'Try adding `"--dry-run"` to the list.'
```

---

```exercise cloze
id: io-05-cloze-flag
prompt: Make `--dry-run` a switch that is either present or absent, with no value after it.
code: |
  parser.add_argument("--dry-run", action=___)
blanks:
  - { options: ['"store_true"', '"store"', "True"], answer: '"store_true"' }
explain: |
  `"store_true"` stores `True` when the flag is present and `False` otherwise. The default action, `"store"`, would expect a value after it, as in `--dry-run yes`.
```

---

## What makes a batch tool trustworthy

- **Safe to run twice.** A second run finishes the job without duplicating or corrupting anything. Skipping items that already exist is the simplest way.
- **A dry run.** An option that prints what would happen and touches nothing.
- **It survives one bad item.** Record the failure, continue, and report all failures at the end.
- **It says what it did.** "Exported 197, skipped 2, failed 1: crane_02 (no materials)".
- **It never overwrites source files.** Outputs go to a separate folder.

---

```exercise edit
id: io-05-run-twice
goal: 'Make `export_all` safe to run twice: if the target file already exists, add the name to `skipped` instead of writing it again.'
code: |
  from pathlib import Path

  out = Path("export")
  out.mkdir(exist_ok=True)

  def export_all(names, dry_run=False):
      exported, skipped = [], []
      for name in names:
          target = out / f"{name}.txt"
          if dry_run:
              print("would export", target.name)
              continue
          target.write_text(name, encoding="utf-8")
          exported.append(name)
      return exported, skipped

  print(export_all(["rock_01", "boat_01"]))
check: |
  first = export_all(["fern_01"])
  assert first == (["fern_01"], []), f"A first run should export fern_01, not return {first}."
  second = export_all(["fern_01", "fern_02"])
  assert second == (["fern_02"], ["fern_01"]), f"The second run returned {second}; fern_01 already exists and should be skipped."
solution: |
  from pathlib import Path

  out = Path("export")
  out.mkdir(exist_ok=True)

  def export_all(names, dry_run=False):
      exported, skipped = [], []
      for name in names:
          target = out / f"{name}.txt"
          if target.exists():
              skipped.append(name)
              continue
          if dry_run:
              print("would export", target.name)
              continue
          target.write_text(name, encoding="utf-8")
          exported.append(name)
      return exported, skipped

  print(export_all(["rock_01", "boat_01"]))
explain: |
  Checking for the target before doing the work means a batch that stopped halfway can simply be run again: it skips what is done and finishes the rest. Putting the check before the dry run also makes the dry run honest about what would really happen.
```

---

```exercise choice
id: io-05-protect-source
tag: Judgement call
question: Claude wrote a batch tool that resizes product photos in place, in the shop's only photo folder. Which change protects you most?
options:
  - { id: separate, text: "Write the resized photos to a separate output folder" }
  - { id: faster, text: "Make it run faster so there is less time for something to go wrong" }
  - { id: log, text: "Print each file name as it is resized" }
answer: separate
explain: |
  A tool that overwrites its source cannot be run again with different settings, and one bug destroys the originals. A separate output folder makes every mistake recoverable. A printed log is useful too, but it only tells you what was lost.
```
