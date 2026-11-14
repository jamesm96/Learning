---
id: io-01
title: "Paths: where the files are"
minutes: 7
recap: |
  A `Path` joins folders with `/` and gives me a file's name, stem and suffix, so I never glue paths together with strings. A relative path starts from wherever the program is running, which is the usual cause of "file not found", so paths should come from one setting or option rather than being typed in six places.
---

Strip any pipeline down and it is three steps: get data from somewhere, transform it, put it somewhere.

An asset export, a ComfyUI batch, a product-image generator for a retailer and a report for a producer all have that outline. This module is the "from somewhere" and the "to somewhere".

Every run in this app starts in a fresh working folder holding five sample files: `manifest.json`, `assets.csv`, `notes.txt`, `products.csv` and `sensors.csv`. The code really reads and writes them.

---

## Path, not strings

`pathlib.Path` joins folders with `/`, works on Windows, Mac and Linux, and gives you the parts of a file name.

```python
from pathlib import Path

root = Path("D:/projects/harbour")
export_dir = root / "export" / "meshes"
report = export_dir / "report.txt"
```

The `/` here is not division. On a `Path`, it means "and then this folder or file inside it".

---

```exercise predict
id: io-01-predict-parts
code: |
  from pathlib import Path

  fbx = Path("export") / "props" / "rock_01.fbx"
  print(fbx)
  print(fbx.name)
  print(fbx.stem)
  print(fbx.suffix)
  print(fbx.parent)
output: |
  export/props/rock_01.fbx
  rock_01.fbx
  rock_01
  .fbx
  export/props
explain: |
  `name` is the last part, `stem` is the name without its suffix, `suffix` keeps its dot, and `parent` is everything before the last part. On Windows, `print(fbx)` shows backslashes instead; the parts are the same.
hint: Try `print(fbx.with_suffix(".glb"))`.
```

---

`glob` finds files by pattern. `sorted` puts them in a fixed order, because the folder listing has none.

```exercise predict
id: io-01-predict-glob
code: |
  from pathlib import Path

  for p in sorted(Path(".").glob("*.csv")):
      print(p.name, p.stat().st_size > 0)

  print(Path("manifest.json").exists())
  print(Path("missing.json").exists())
output: |
  assets.csv True
  products.csv True
  sensors.csv True
  True
  False
explain: |
  `Path(".")` is the current folder, where the sample files live. The pattern `*.csv` matches the three tables, and `.exists()` checks a path without opening anything.
```

---

## Absolute and relative

An absolute path starts from the drive or root: `D:/projects/harbour`. A relative path, such as `assets.csv`, starts from wherever the program is running.

That is often somewhere you did not expect: the folder Blender was launched from, or the one your terminal happened to be in. Most "file not found" errors are this.

`Path(__file__).parent` is the folder containing the current script. Use it to find files that ship with your tool, whatever folder it is run from.

---

```exercise choice
id: io-01-hardcoded
tag: Judgement call
question: 'A script contains `"C:/Users/james/Desktop/export/"` in six places. What is the first improvement?'
options:
  - { id: setting, text: "One named setting or parameter for the folder, built with `Path`" }
  - { id: backslash, text: "Switch the slashes to backslashes" }
  - { id: nothing, text: "Nothing; it works on your machine" }
answer: setting
explain: |
  A hard-coded personal path means the tool works for one person on one computer. Paths should arrive from a setting, a parameter or a command-line option, in one place.
```

---

Joining paths with `+` and slashes is fragile. On Windows, a backslash inside a string can start an escape: `\n` is a newline and `\t` is a tab.

```exercise predict
id: io-01-predict-escape
code: |
  folder = "D:\new\table"
  print(len(folder))
  print("\n" in folder, "\t" in folder)
output: |
  10
  True True
explain: |
  You typed twelve characters, but Python read ten: `\n` became one newline and `\t` became one tab. The folder name is silently wrong. `Path("D:/new/table")` with forward slashes avoids it, and works on Windows too.
```

---

The skip check in this render script never finds the frame that is already there, so it renders it again on every run.

```exercise fix
id: io-01-fix-joined
symptom: "The script prints `render shot_01.png` even though `renders/shot_01.png` exists."
files:
  "renders/shot_01.png": "already rendered"
code: |
  from pathlib import Path

  base = "renders/"
  done = {str(p) for p in Path("renders").glob("*.png")}

  def needs_render(name):
      target = base + "/" + name
      return target not in done

  for name in ["shot_01.png", "shot_02.png"]:
      if needs_render(name):
          print("render", name)
check: |
  assert not needs_render("shot_01.png"), "shot_01.png already exists, so it should be skipped."
  assert needs_render("shot_02.png"), "shot_02.png does not exist yet, so it still needs rendering."
solution: |
  from pathlib import Path

  base = Path("renders/")
  done = set(Path("renders").glob("*.png"))

  def needs_render(name):
      target = base / name
      return target not in done

  for name in ["shot_01.png", "shot_02.png"]:
      if needs_render(name):
          print("render", name)
cause:
  options:
    - { id: double, text: 'Joining by hand gave `renders//shot_01.png`, which is not equal to the text `renders/shot_01.png`' }
    - { id: glob, text: "`glob` cannot see `.png` files" }
    - { id: set, text: "A set cannot hold paths" }
  answer: double
explain: |
  `base` already ended with a slash, so the hand-made join produced `renders//shot_01.png`. The operating system would still open that file, but as text it does not equal `renders/shot_01.png`, so the skip check never matches.

  `Path` tidies the slashes for you, and paths compare as paths rather than as text, so `Path("renders/") / "shot_01.png"` equals what `glob` returns. Generated code often joins paths with `+ "/" +`; replace it with `/` on a `Path` on sight.
```

---

Outputs often need a folder that does not exist yet.

```exercise cloze
id: io-01-cloze-mkdir
prompt: Create the folder and any missing parents, without failing if it already exists.
code: |
  export_dir = Path("export") / "meshes"
  export_dir.mkdir(parents=True, ___=True)
blanks:
  - { options: ["exist_ok", "force", "overwrite"], answer: "exist_ok" }
explain: |
  `parents=True` creates `export` as well as `meshes`. `exist_ok=True` means a second run does not fail because the folder is already there, which matters for any tool you run more than once.
```
