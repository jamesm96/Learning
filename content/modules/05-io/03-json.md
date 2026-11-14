---
id: io-03
title: "JSON: dictionaries and lists as text"
minutes: 8
recap: |
  JSON is nested dictionaries and lists written out as text: `json.loads` turns the text into Python data and `json.dumps` turns it back, with `indent=2` to keep it readable. It only holds text, numbers, true/false, null, lists and dictionaries with text keys, so tuples come back as lists, number keys come back as text, and things like a `Path` must be converted first.
---

JSON is the format nearly every tool and web service uses to exchange data: ComfyUI workflows, settings files, AI model replies, shop product feeds.

It is the nested dict-and-list shape from Module 1, written out as text.

```python
import json
from pathlib import Path

path = Path("manifest.json")
manifest = json.loads(path.read_text(encoding="utf-8"))   # text -> dict
```

---

```exercise predict
id: io-03-predict-manifest
code: |
  import json
  from pathlib import Path

  text = Path("manifest.json").read_text(encoding="utf-8")
  manifest = json.loads(text)
  print(type(text).__name__, type(manifest).__name__)
  print(manifest["project"], len(manifest["assets"]))

  for asset in manifest["assets"]:
      if asset["tris"] > 9000:
          print("over budget:", asset["name"])
output: |
  str dict
  harbour 3
  over budget: crane_02
  over budget: boat_01
explain: |
  Before `loads` it is one long string. After, it is a dictionary with a list of asset dictionaries under `"assets"`, and the numbers are real numbers, so `> 9000` works without conversion.
```

---

This is `manifest.json`, the file you just read.

```exercise shape
id: io-03-shape-manifest
question: Find the second material of the boat.
name: manifest
data: |
  {
    "project": "harbour",
    "version": 3,
    "assets": [
      {"name": "rock_01", "type": "prop", "tris": 4820, "materials": ["moss", "stone"], "path": "props/rock_01.fbx"},
      {"name": "crane_02", "type": "prop", "tris": 18250, "materials": ["metal"], "path": "props/crane_02.fbx"},
      {"name": "boat_01", "type": "vehicle", "tris": 9100, "materials": ["wood", "rope", "metal"], "path": "vehicles/boat_01.fbx"}
    ]
  }
answer: 'manifest["assets"][2]["materials"][1]'
explain: |
  The boat is the third asset, index 2. Its materials are a list, and the second one is index 1: `"rope"`. Say the shape first, then the path writes itself.
```

---

## Writing it back

```python
manifest["assets"].append({"name": "fern_01", "tris": 600})
text = json.dumps(manifest, indent=2)       # dict -> text
path.write_text(text, encoding="utf-8")
```

`loads` and `dumps` work with strings; the s stands for string. `load` and `dump` work directly with open files.

`indent=2` puts each item on its own line. People can read the file, and a change to one asset shows up as one changed line in Git.

---

```exercise edit
id: io-03-add-fern
goal: 'Add `{"name": "fern_01", "tris": 600}` to the assets, then write the manifest back to `manifest.json` with `indent=2`.'
code: |
  import json
  from pathlib import Path

  path = Path("manifest.json")
  manifest = json.loads(path.read_text(encoding="utf-8"))

  print(len(manifest["assets"]), "assets")
check: |
  import json
  from pathlib import Path
  saved = Path("manifest.json").read_text(encoding="utf-8")
  back = json.loads(saved)
  names = [a["name"] for a in back["assets"]]
  assert "fern_01" in names, "manifest.json on disk should now include fern_01."
  assert len(names) == 4, f"manifest.json should hold 4 assets, not {len(names)}."
  assert '\n  "project"' in saved, "Write the file with indent=2 so it stays readable."
solution: |
  import json
  from pathlib import Path

  path = Path("manifest.json")
  manifest = json.loads(path.read_text(encoding="utf-8"))
  manifest["assets"].append({"name": "fern_01", "tris": 600})
  path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

  print(len(manifest["assets"]), "assets")
explain: |
  Load, change, save: the whole pattern for editing a JSON file. Changing the dictionary alone changes nothing on disk; only the `write_text` does that. Here you overwrote the source file, which is fine for a sample; a real tool should usually write to a new file.
```

---

JSON holds only text, numbers, true/false, null, lists, and dictionaries with text keys. Predict what comes back.

```exercise predict
id: io-03-predict-roundtrip
code: |
  import json

  data = {"position": (1.0, 2.0, 0.5), 3: "three"}
  back = json.loads(json.dumps(data))
  print(back)
  print(back == data)
output: |
  {'position': [1.0, 2.0, 0.5], '3': 'three'}
  False
explain: |
  The tuple came back as a list, and the number key came back as text. Data that survives the trip "unchanged" may have changed type, so `back[3]` would now be a `KeyError`.
```

---

Some values will not convert at all.

```exercise traceback
id: io-03-not-serializable
code: |
  import json
  from pathlib import Path

  settings = {"project": "harbour", "out": Path("export")}
  print(json.dumps(settings))
question: What is the fix?
options:
  - { id: str, text: 'Convert the path to text first: `"out": str(Path("export"))`' }
  - { id: indent, text: "Add `indent=2`" }
  - { id: load, text: "Use `json.dump` instead of `json.dumps`" }
answer: str
explain: |
  JSON has no type for a path. The same goes for a set, a Blender object or a robot's pose class: turn them into strings, lists or plain dictionaries before saving, and rebuild them after loading.
```

---

```exercise cloze
id: io-03-cloze-loads
prompt: Turn the text of a ComfyUI workflow into a dictionary.
code: |
  text = Path("workflow_api.json").read_text(encoding="utf-8")
  workflow = json.___(text)
blanks:
  - { options: ["loads", "dumps", "load"], answer: "loads" }
explain: |
  `loads` reads from a string. `dumps` goes the other way, and `load` expects an open file rather than the text.
```
