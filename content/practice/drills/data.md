---
id: drills-data
title: Data shapes
minutes: 5
---

A robot arm's joint data, as a training scene exports it.

```exercise shape
id: drills-data-shape-robot-wrist
question: Find the wrist's maximum torque.
name: arm
data: |
  {
    "robot": "arm_07",
    "joints": [
      {"name": "shoulder", "torque": {"max": 120, "unit": "Nm"}},
      {"name": "elbow", "torque": {"max": 80, "unit": "Nm"}},
      {"name": "wrist", "torque": {"max": 25, "unit": "Nm"}}
    ]
  }
answer: arm["joints"][2]["torque"]["max"]
explain: |
  `arm["joints"]` is a list, so the wrist needs an index: it is the third joint, index 2. Each joint is a dict, and `"torque"` is another dict inside it, so two keys follow.
```

---

A ComfyUI workflow in API format: a dict of nodes, keyed by node id.

```exercise shape
id: drills-data-shape-comfy-steps
question: Find the number of sampling steps.
name: workflow
data: |
  {
    "4": {"class_type": "CheckpointLoaderSimple",
          "inputs": {"ckpt_name": "sdxl_base.safetensors"}},
    "3": {"class_type": "KSampler",
          "inputs": {"seed": 42, "steps": 20, "cfg": 7.0}},
    "9": {"class_type": "SaveImage",
          "inputs": {"filename_prefix": "harbour"}}
  }
answer: workflow["3"]["inputs"]["steps"]
explain: |
  The node ids are strings, so the key is `"3"` in quotes, not the number 3. The outer level is a dict, not a list, so the order the nodes appear in does not matter: you look them up by id.
```

---

An order from an online shop.

```exercise shape
id: drills-data-shape-order-sku
question: Find the SKU of the second item in the basket.
name: order
data: |
  {
    "order_id": "A-1043",
    "customer": {"name": "R. Patel", "country": "GB"},
    "lines": [
      {"sku": "LAMP-01", "qty": 1},
      {"sku": "MUG-02", "qty": 4}
    ],
    "total": 87.0
  }
answer: order["lines"][1]["sku"]
explain: |
  The basket is the list under `"lines"`. The second item is index 1, because lists count from 0, and each item is a dict with a `"sku"` key.
```

---

Readings from a greenhouse, grouped by sensor.

```exercise shape
id: drills-data-shape-sensor-reading
question: Find the last humidity reading from sensor h-02.
name: log
data: |
  {
    "site": "greenhouse_b",
    "sensors": [
      {"id": "h-01", "humidity": [61, 63, 62]},
      {"id": "h-02", "humidity": [55, 57, 58]}
    ]
  }
answer: log["sensors"][1]["humidity"][2]
explain: |
  h-02 is the second sensor, index 1. Its readings are a list of three, so the last one is index 2. In code you would often write `[-1]` for "the last one", which works whatever the length.
```

---

A Blender export preset with levels of detail.

```exercise shape
id: drills-data-shape-lod-ratio
question: Find the decimation ratio of the lowest level of detail.
name: preset
data: |
  {
    "asset": "crane_02",
    "export": {
      "format": "fbx",
      "lods": [
        {"level": 0, "ratio": 1.0},
        {"level": 1, "ratio": 0.5},
        {"level": 2, "ratio": 0.2}
      ]
    }
  }
answer: preset["export"]["lods"][2]["ratio"]
explain: |
  The lods sit inside `"export"`, so that key comes first. The lowest detail is level 2, the third item, at index 2. Here the level number and the index happen to match, but that is a property of this data, not a rule.
```

---

```exercise predict
id: drills-data-predict-alias-materials
code: |
  rock = ["moss", "stone"]
  boulder = rock
  boulder.append("lichen")
  print(rock)
  print(len(boulder))
output: |
  ['moss', 'stone', 'lichen']
  3
explain: |
  `boulder = rock` does not copy the list. It gives the same list a second name, so appending through one name changes what the other sees. Use `rock.copy()` when you want a separate list.
hint: Change the second line to `boulder = rock.copy()` and run it again.
```

---

```exercise predict
id: drills-data-predict-truthy-stock
code: |
  stock = {"LAMP-01": 14, "CHAIR-OAK-120": 0}
  for sku, count in stock.items():
      if count:
          print(sku, "in stock")
      else:
          print(sku, "sold out")
  print(bool([]), bool("0"))
output: |
  LAMP-01 in stock
  CHAIR-OAK-120 sold out
  False True
explain: |
  `if count:` treats 0 as false, which is what you want here. An empty list is false too. The string `"0"` is true, because any non-empty string is true, whatever it says.
```

---

```exercise predict
id: drills-data-predict-strip-filename
code: |
  raw = "  Crane_02.FBX\n"
  name = raw.strip().lower()
  print(name)
  print(name.split(".")[0])
  print(name.endswith(".fbx"))
output: |
  crane_02.fbx
  crane_02
  True
explain: |
  `strip()` removes the spaces and the line break at the ends, and `lower()` makes the extension comparable. `split(".")` gives `["crane_02", "fbx"]`, so index 0 is the stem. Each method returns a new string; the original `raw` is unchanged.
```

---

```exercise predict
id: drills-data-predict-csv-text
code: |
  tris = "4820"
  extra = "180"
  print(tris + extra)
  print(int(tris) + int(extra))
  print(type(float(tris)).__name__)
output: |
  4820180
  5000
  float
explain: |
  Values read from a CSV file or typed into a form arrive as text. `+` on two strings joins them, so the first line is a long number-looking string. Convert with `int()` or `float()` before doing any arithmetic.
```

---

```exercise predict
id: drills-data-predict-get-default
code: |
  camera = {"name": "cam_top", "fov": 50}
  print(camera.get("fov", 60))
  print(camera.get("near", 0.1))
  print(camera.get("far"))
  print("far" in camera)
output: |
  50
  0.1
  None
  False
explain: |
  `.get()` returns the stored value when the key exists and the default when it does not. With no default it returns `None` instead of raising `KeyError`. That is handy for optional settings and dangerous for required ones, because a missing value slips through quietly.
```

---

```exercise choice
id: drills-data-choice-zero-price
question: A promotional item has `price = 0.0`. Which test reports only a genuinely missing price?
options:
  - { id: is-none, text: "`if price is None:`" }
  - { id: not, text: "`if not price:`" }
  - { id: eq-zero, text: "`if price == 0:`" }
answer: is-none
explain: |
  `not price` is true for `0.0` as well as for `None`, so a free item would be reported as missing. `price is None` asks exactly one question: was there a value at all. Use it whenever 0, an empty string or an empty list is a valid value.
```

---

```exercise choice
id: drills-data-choice-tuple-assign
question: What happens when this runs?
code: |
  spawn = (12.0, 4.5, 0.0)
  spawn[2] = 1.0
options:
  - { id: type-error, text: "A `TypeError`: a tuple cannot be changed" }
  - { id: works, text: "`spawn` becomes `(12.0, 4.5, 1.0)`" }
  - { id: index-error, text: "An `IndexError`: there is no index 2" }
answer: type-error
explain: |
  Tuples are fixed once made, which is why they suit positions and colours that should not change by accident. To get a new position, build a new tuple: `spawn = (spawn[0], spawn[1], 1.0)`.
```

---

```exercise choice
id: drills-data-choice-shape-sentence
question: 'Which sentence describes `{"t-01": [21.4, 21.9], "t-02": [19.8]}`?'
options:
  - { id: dict-of-lists, text: "A dict from sensor id to a list of readings" }
  - { id: list-of-dicts, text: "A list of sensor dicts, each with readings" }
  - { id: dict-of-dicts, text: "A dict of sensors, each a dict of readings" }
answer: dict-of-lists
explain: |
  The outer braces with `"key": value` pairs make a dict. Each value is in square brackets, so a list of numbers. The readings for t-01 are `data["t-01"]`, and its second reading is `data["t-01"][1]`.
```

---

```exercise cloze
id: drills-data-cloze-unique-materials
prompt: Count how many different materials the harbour scene uses.
code: |
  used = ["stone", "metal", "wood", "metal", "stone"]
  unique = ___(used)
  print(len(unique))   # 3
blanks:
  - { options: ["set", "list", "tuple", "sorted"], answer: "set" }
explain: |
  A set keeps each value once, so duplicates disappear. `list`, `tuple` and `sorted` all keep every item, so the count would stay at 5. Sets have no order, so do not rely on the order you get back.
```

---

```exercise cloze
id: drills-data-cloze-items-prices
prompt: Print each SKU with its price.
code: |
  prices = {"LAMP-01": 39.0, "RUG-07": 89.5}
  for sku, price in prices.___():
      print(f"{sku}: £{price:.2f}")
blanks:
  - { options: ["items", "keys", "values", "get"], answer: "items" }
explain: |
  `.items()` gives each key and value as a pair, which the loop unpacks into `sku` and `price`. `.keys()` and `.values()` give one half each, so unpacking two names from them fails or gives nonsense.
```

---

```exercise cloze
id: drills-data-cloze-copy-list
prompt: Make a separate copy of the default tags, so the defaults stay as they are.
code: |
  defaults = ["static", "lod0"]
  tags = defaults.___()
  tags.append("collision")
  print(defaults)   # ['static', 'lod0']
blanks:
  - { options: ["copy", "append", "sort", "clear"], answer: "copy" }
explain: |
  `.copy()` makes a new list holding the same items. Without it, `tags` and `defaults` would be two names for one list, and the defaults would gain `"collision"` too.
```
