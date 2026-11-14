---
id: structure-04
title: "Modules: files as building blocks"
minutes: 8
recap: |
  Every `.py` file is a module, imported whole with `import json` or one name at a time with `from pathlib import Path`. Keep the host application, such as `bpy`, in one file at the edge, and guard `main()` with `if __name__ == "__main__":` so that importing a file does not run the tool.
---

Every `.py` file is a module.

- `import json` loads a module that ships with Python. You then write `json.loads(...)`.
- `from pathlib import Path` pulls one name out of a module, so you write `Path(...)` on its own.

Your own files work the same way. With a file called `naming.py` next to your script, `from naming import is_valid_name` gives you that function.

---

```exercise cloze
id: structure-04-cloze-import
prompt: Bring in just the `find_problems` function from your own `checks.py`.
code: |
  ___ checks ___ find_problems
blanks:
  - { options: ["from", "import", "use"], answer: "from" }
  - { options: ["import", "from", "as"], answer: "import" }
explain: |
  `from checks import find_problems` finds `checks.py` and takes one name from it. The file name is used without `.py`.
```

---

## The standard library

Python comes with a large standard library. The parts you will use most:

- `pathlib`: paths
- `json` and `csv`: data
- `subprocess`: running other programs
- `logging`: messages
- `argparse`: command-line options

Everything else is third-party and installed with `pip`, ideally into a **virtual environment**: a private set of packages for one project, so projects cannot break each other.

---

Two standard modules at work, with no files involved.

```exercise predict
id: structure-04-predict-stdlib
code: |
  import json
  from pathlib import Path

  path = Path("assets/props/crate_01.fbx")
  print(path.name, path.stem, path.suffix)

  text = '{"sku": "LAMP-01", "price": 39.0}'
  product = json.loads(text)
  print(product["price"] * 2)
output: |
  crate_01.fbx crate_01 .fbx
  78.0
explain: |
  `Path` splits a path into its parts for you, which is sturdier than `.split("/")`. `json.loads` turns JSON text into a Python dictionary. Note the two styles: `json.loads` keeps the module name, while `Path` was imported on its own.
```

---

## A layout that will serve you in any industry

```
asset_tools/
  README.md
  pyproject.toml    name, version, dependencies
  src/asset_tools/
    naming.py       rules about names   (pure)
    checks.py       budgets, validation (pure)
    manifest.py     reading and writing data
    blender_io.py   the ONLY file that imports bpy
    cli.py          run it from a terminal
  tests/
```

---

## Keep the host at the edge

The important line is `blender_io.py`. If only one file knows about Blender, the rest of your tool runs anywhere: in Unreal, on a build server, in a completely different company's pipeline.

Keeping the host application at the edge is the most valuable structural habit for someone who wants their skills to travel. The same goes for `unreal`, ComfyUI's node classes, or a robot simulator's API.

---

```exercise choice
id: structure-04-build-server
question: In the layout above, you want to run the naming and budget checks on a build server that has no Blender installed. Which files can run there?
options:
  - { id: pure, text: "`naming.py`, `checks.py` and `manifest.py`" }
  - { id: all, text: "All of them, including `blender_io.py`" }
  - { id: none, text: "None of them, since it is a Blender tool" }
answer: pure
explain: |
  Only `blender_io.py` imports `bpy`, so only it needs Blender. Everything else is plain Python. This is the payoff of keeping the host at the edge: most of the tool no longer depends on the host at all.
```

---

## The line at the bottom of files

You will see this a lot:

```python
if __name__ == "__main__":
    main()
```

It means "run `main()` only when this file is started directly, and stay quiet when another file imports it". When a file is started directly, Python sets `__name__` to `"__main__"`. When it is imported, `__name__` is the module's own name.

---

```exercise choice
id: structure-04-main-guard
question: '`checks.py` ends with `if __name__ == "__main__": main()`. Another file runs `from checks import find_problems`. Does `main()` run?'
options:
  - { id: skipped, text: 'No, because `__name__` is `"checks"` when imported' }
  - { id: runs, text: "Yes, because importing runs the whole file" }
  - { id: error, text: "It raises an ImportError" }
answer: skipped
explain: |
  Importing does run the file from top to bottom, which is why the guard is needed. The `def` lines run and the functions are defined, but the `if` is false, so `main()` is skipped. Without the guard, importing `checks` would run the whole tool.
```

---

```exercise choice
id: structure-04-single-file-addon
tag: Judgement call
question: Claude writes a 600-line Blender add-on in one file. Naming rules, budget maths, UI panels and export are mixed together, and `bpy` is used everywhere. It works. What is the main cost?
options:
  - { id: slow, text: "It will run slowly" }
  - { id: reject, text: "Blender will reject it" }
  - { id: untestable, text: "Nothing in it can be tested or reused without Blender running" }
answer: untestable
explain: |
  It runs fine today. The cost arrives later: every check needs Blender open, the rules cannot move to another tool, and each change risks an unrelated part. Asking for "the same thing, with the rules in a module that does not import bpy" is a reasonable review request.
```
