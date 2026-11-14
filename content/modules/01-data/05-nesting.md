---
id: data-05
title: "Nesting: the shape of real data"
minutes: 8
---

Real data is lists and dictionaries inside each other.

Before reading any code that uses data, say its shape in one sentence. For the scene in the next step: "a dict with a list of asset dicts under `assets`".

---

## Follow the path one step at a time

`scene["assets"][2]["materials"][1]`

- `scene["assets"]` is a list
- `[2]` picks the third asset, a dict
- `["materials"]` is that asset's list of materials
- `[1]` is the second material

---

```exercise predict
id: data-05-predict-scene
code: |
  scene = {
      "level": "harbour",
      "assets": [
          {"name": "rock_01", "tris": 4820, "materials": ["moss", "stone"]},
          {"name": "crane_02", "tris": 18250, "materials": ["metal"]},
          {"name": "boat_01", "tris": 9100, "materials": ["wood", "rope", "metal"]},
      ],
  }
  budget = 9000

  over = [a["name"] for a in scene["assets"] if a["tris"] > budget]
  total = sum([a["tris"] for a in scene["assets"]])

  print(over)
  print(total)
  print(scene["assets"][2]["materials"][1])
output: |
  ['crane_02', 'boat_01']
  32170
  rope
explain: |
  Two assets are over 9000 triangles. The sum is 4820 + 18250 + 9100. The last line follows the path from the previous step: third asset, its materials, the second one.
hint: Print every asset that uses "metal".
```

---

One answer to the hint:

```python
print([a["name"] for a in scene["assets"] if "metal" in a["materials"]])
```

A ComfyUI workflow saved in API format has this same character: a dict of nodes, each node a dict with an `inputs` dict inside. So does the reply from an AI model's API. Learn to read one and you can read them all.

---

```exercise cloze
id: data-05-cloze-path
prompt: In the harbour scene, write the path to the boat's `"metal"`.
code: |
  scene["assets"][___]["materials"][___]
blanks:
  - { options: ["1", "2", "3"], answer: "2" }
  - { options: ["0", "1", "2"], answer: "2" }
explain: |
  The boat is the third asset, index 2. Its materials are `["wood", "rope", "metal"]`, so `"metal"` is index 2 as well.
```

---

```exercise choice
id: data-05-workflow-path
question: 'Given `data = {"nodes": [{"id": 1, "inputs": {"seed": 42}}]}`, which path gives `42`?'
options:
  - { id: right, text: '`data["nodes"][0]["inputs"]["seed"]`' }
  - { id: skip-index, text: '`data["nodes"]["inputs"]["seed"]`' }
  - { id: wrong-order, text: '`data[0]["nodes"]["seed"]`' }
answer: right
explain: |
  `data["nodes"]` is a list, so you need an index before you can ask for a key. Skipping the `[0]` raises `TypeError: list indices must be integers or slices, not str`, one of the most common errors in pipeline code.
```

---

```exercise choice
id: data-05-shape-sentence
question: 'Which sentence describes this shape? `{"robot": "arm_02", "joints": [{"name": "elbow", "angle": 31.5}, {"name": "wrist", "angle": -12.0}]}`'
options:
  - { id: right, text: "A dict with a robot name and a list of joint dicts under `joints`" }
  - { id: list, text: "A list of joints, each with a robot name" }
  - { id: dict-of-dicts, text: "A dict of joints, keyed by joint name" }
answer: right
explain: |
  The outer braces make a dict. `"joints"` holds square brackets, so a list, and each item in it has braces, so a dict. The angle of the wrist is `data["joints"][1]["angle"]`.
```

---

```exercise predict
id: data-05-predict-workflow
code: |
  workflow = {
      "3": {"class_type": "KSampler", "inputs": {"seed": 42, "steps": 20}},
      "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "a red crane"}},
  }
  print(workflow["6"]["inputs"]["text"])
  workflow["3"]["inputs"]["seed"] = 7
  print(workflow["3"]["inputs"])
  print(len(workflow))
output: |
  a red crane
  {'seed': 7, 'steps': 20}
  2
explain: |
  This is the shape of a ComfyUI workflow in API format, trimmed down. The node ids are strings, `"3"` and `"6"`, not numbers, so `workflow[3]` would raise a `KeyError`. `len` counts the top-level keys: two nodes.
```
