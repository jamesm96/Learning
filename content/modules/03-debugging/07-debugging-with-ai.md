---
id: debugging-07
title: Debugging with AI without losing the thread
minutes: 8
recap: |
  Spend ten minutes on a bug alone, then give Claude the full traceback, what you expected and what happened, and ask for the cause before any fix. Reject patches that only hide the symptom, read every changed line, and after two failed patches go back to working code and narrow it yourself.
---

## Four habits

- Spend ten minutes on your own first. Read the traceback, form a guess.
- Give the full traceback, what you expected, what happened, and what you have ruled out.
- Ask for the cause before the fix. If the explanation does not make sense to you, the fix is not ready to accept.
- After two failed patches, stop. Go back to the last working commit and narrow the problem yourself.

---

## A prompt to copy

Fill in X and Y, and paste the traceback and function below it.

```text
Here is the full traceback and the function it
points to. I expected X and got Y.

Before proposing any change: explain the most
likely cause, tell me what I could print or
inspect to confirm it, and list any other causes
that would produce the same error.
```

---

```exercise choice
id: debugging-07-get-patch
tag: Judgement call
question: 'The exporter fails with `KeyError: ''folder''`. Claude suggests changing `asset["folder"]` to `asset.get("folder", "")`. What does that patch do?'
options:
  - { id: hides, text: "Stops the error appearing, and writes that asset to the wrong place" }
  - { id: fixes, text: "Fixes the bug: assets without a folder now export" }
  - { id: same, text: "Nothing; the same KeyError appears" }
answer: hides
explain: |
  The symptom goes, the cause stays. The asset still has no folder, and the path becomes `exports//rock_01.fbx`. The useful question was never "how do I stop the KeyError?" but "why does this asset have no folder?".
```

---

This is the code after that patch was accepted. Undo it, so a missing folder fails loudly again.

```exercise fix
id: debugging-07-undo-get
symptom: 'An asset with no folder is written to `exports//rock_01.fbx`, with no error.'
code: |
  def build_path(asset):
      folder = asset.get("folder", "")
      return "exports/" + folder + "/" + asset["name"]

  good = {"name": "tree_02.fbx", "folder": "props"}
  print(build_path(good))
check: |
  assert build_path(good) == "exports/props/tree_02.fbx", "A complete asset should still get its path."
  try:
      path = build_path({"name": "rock_01.fbx"})
  except KeyError:
      pass
  else:
      raise AssertionError(f"An asset with no folder got the path {path!r}. It should raise KeyError.")
solution: |
  def build_path(asset):
      folder = asset["folder"]
      return "exports/" + folder + "/" + asset["name"]

  good = {"name": "tree_02.fbx", "folder": "props"}
  print(build_path(good))
cause:
  options:
    - { id: get-default, text: '`.get()` with a made-up default hides a missing key' }
    - { id: slash, text: "The path has one slash too many" }
    - { id: name, text: "The asset name is wrong" }
  answer: get-default
explain: |
  Square brackets demand the key exists. With them, the broken asset stops the export at once with `KeyError: 'folder'`, instead of producing a file in the wrong place that someone finds a week later.
```

---

Paths joined by hand are another favourite of generated code. One missing slash, no error.

```exercise fix
id: debugging-07-join-paths
symptom: 'The file should go to `exports/props/rock_01.fbx`. It goes to `exportsprops/rock_01.fbx`.'
code: |
  from pathlib import Path

  root = "exports"
  folder = "props"
  name = "rock_01.fbx"
  path = root + folder + "/" + name
  print(path)
check: |
  assert str(path) == "exports/props/rock_01.fbx", f"The path is {str(path)!r}."
solution: |
  from pathlib import Path

  root = "exports"
  folder = "props"
  name = "rock_01.fbx"
  path = Path(root) / folder / name
  print(path)
cause:
  options:
    - { id: separator, text: "The parts are joined with `+`, and one separator is missing" }
    - { id: pathlib, text: "`pathlib` was imported but is broken" }
    - { id: name, text: "The file name needs a folder in it" }
  answer: separator
explain: |
  Adding the missing `"/"` works. `Path(root) / folder / name` is better: the `/` operator puts exactly one separator between parts, and uses the right one for the system, so the same code runs on Windows and Linux.
```

---

```exercise choice
id: debugging-07-two-patches
tag: Judgement call
question: Claude's first patch gave a new error. Its second patch gave another. What next?
options:
  - { id: stop, text: "Stop, go back to the last working commit, and narrow the problem yourself" }
  - { id: third, text: "Paste the new error and ask for a third patch" }
  - { id: rewrite, text: "Ask Claude to rewrite the whole tool" }
answer: stop
explain: |
  Two failed patches mean nobody understands the cause yet, and each patch adds code that might be part of the problem. Going back to known-good code and narrowing it with the method from lesson 4 is slower for ten minutes and faster for the day.
```

---

```exercise choice
id: debugging-07-scope-creep
question: 'You asked Claude to fix a crash in a function that flags heavy meshes. The fix works. The diff also changed `tris > budget` to `tris >= budget`. What should you do?'
options:
  - { id: ask, text: "Ask why that line changed, and undo it if it was not part of the fix" }
  - { id: accept, text: "Accept it; the crash is fixed" }
  - { id: ignore, text: "Ignore it; one character cannot matter" }
answer: ask
explain: |
  A fix should change what the bug needs and nothing else. That one character now flags assets that sit exactly on the budget. Read every line of a diff, especially the ones you did not ask for.
```

---

A last traceback. Read it bottom up, and say the cause in one sentence before you choose.

```exercise traceback
id: debugging-07-workflow-input
code: |
  def node_input(workflow, node_id, key):
      return workflow[node_id]["inputs"][key]

  def get_steps(workflow):
      return node_input(workflow, "3", "steps")

  workflow = {
      "3": {"class_type": "KSampler",
            "inputs": {"seed": 0, "step": 20}},
      "8": {"class_type": "VAEDecode",
            "inputs": {}},
  }
  print(get_steps(workflow))
options:
  - { id: key-name, text: 'The KSampler inputs say "step", but the code asks for "steps"' }
  - { id: node, text: 'There is no node "3"' }
  - { id: inputs, text: 'Node "3" has no "inputs"' }
answer: key-name
explain: |
  `KeyError: 'steps'`, raised in `node_input`. The carets under the line point at the last lookup, `[key]`, so node `"3"` and its `"inputs"` were both found. Printing `workflow["3"]["inputs"].keys()` shows `step`, not `steps`.

  Whether the workflow or the code has the wrong name is the next question, and the one to ask Claude.
```
