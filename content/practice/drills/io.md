---
id: drills-io
title: Files and formats
minutes: 5
---

```exercise predict
id: drills-io-predict-path-parts
code: |
  from pathlib import Path

  frame = Path("renders") / "shot_04" / "beauty.0012.exr"
  print(frame.name)
  print(frame.suffix)
  print(frame.parent.name)
  print(frame.with_suffix(".png").name)
output: |
  beauty.0012.exr
  .exr
  shot_04
  beauty.0012.png
explain: |
  `suffix` is only the part after the last dot, so the frame number stays in the name. `parent` is the folder holding the file, and its `name` is that folder's own name. `with_suffix` gives a new path; the original is unchanged.
```

---

`notes.txt` is in the working folder. Predict what this reads.

```exercise predict
id: drills-io-predict-notes-lines
code: |
  from pathlib import Path

  text = Path("notes.txt").read_text(encoding="utf-8")
  lines = text.splitlines()
  print(len(lines))
  print(lines[0])
  print([l for l in lines if "LOD" in l])
output: |
  4
  Harbour level notes
  ['- boat_01 needs a lower LOD for the rope']
explain: |
  `read_text` gives the whole file as one string, and `splitlines` breaks it into lines without their line endings. The heading is line 0. Only one note mentions LOD, and the `in` test is case-sensitive.
```

---

`manifest.json` is in the working folder. Predict what this prints.

```exercise predict
id: drills-io-predict-manifest-types
code: |
  import json

  with open("manifest.json", encoding="utf-8") as f:
      manifest = json.load(f)
  print(manifest["project"], manifest["version"])
  print(type(manifest["assets"][0]["tris"]).__name__)
  print(manifest["assets"][2]["materials"][-1])
output: |
  harbour 3
  int
  metal
explain: |
  JSON keeps its types: a number in the file becomes an `int` in Python, a list becomes a list. That is the main difference from CSV, where every cell arrives as text. The boat is the third asset, and `[-1]` is its last material.
```

---

`products.csv` is in the working folder. Read the last line carefully.

```exercise predict
id: drills-io-predict-csv-strings
code: |
  import csv

  with open("products.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))
  print(rows[1]["name"], rows[1]["stock"])
  print(type(rows[1]["stock"]).__name__)
  print([r["sku"] for r in rows if r["stock"] == 0])
output: |
  Oak chair 0
  str
  []
explain: |
  The chair's stock is the text `"0"`, and `"0" == 0` is false, so the sold-out filter finds nothing and raises no error. Convert CSV cells where you read them: `int(r["stock"]) == 0`.
hint: Change the last line to compare `int(r["stock"]) == 0`.
```

---

`sensors.csv` is in the working folder. One reading from t-02 is missing.

```exercise predict
id: drills-io-predict-sensor-mean
code: |
  import csv

  temps = []
  with open("sensors.csv", newline="", encoding="utf-8") as f:
      for row in csv.DictReader(f):
          if row["sensor"] == "t-02" and row["temp_c"] != "n/a":
              temps.append(float(row["temp_c"]))
  print(temps)
  print(round(sum(temps) / len(temps), 2))
output: |
  [19.8, 20.1]
  19.95
explain: |
  The `"n/a"` row is skipped before `float` sees it, so only two readings count and the mean is of those two. Skipping is a decision: it hides the gap. A report should usually say how many readings it left out.
```

---

```exercise predict
id: drills-io-predict-write-append
code: |
  from pathlib import Path

  with open("run.log", "w", encoding="utf-8") as f:
      f.write("start\n")
  with open("run.log", "w", encoding="utf-8") as f:
      f.write("frame 1\n")
  with open("run.log", "a", encoding="utf-8") as f:
      f.write("frame 2\n")
  print(Path("run.log").read_text(encoding="utf-8").splitlines())
output: |
  ['frame 1', 'frame 2']
explain: |
  `"w"` empties the file as soon as it opens, so the second block wiped out `start`. `"a"` adds to the end. Opening an existing file with `"w"` is one of the quickest ways to lose data, so check the mode when an AI writes to a file.
```

---

```exercise predict
id: drills-io-predict-argparse-types
code: |
  import argparse

  parser = argparse.ArgumentParser()
  parser.add_argument("table")
  parser.add_argument("--limit", type=float, default=30.0)
  parser.add_argument("--quiet", action="store_true")

  args = parser.parse_args(["sensors.csv", "--limit", "22"])
  print(args.table, args.limit, args.quiet)
output: |
  sensors.csv 22.0 False
explain: |
  `type=float` turns the text `"22"` into the number 22.0. `--quiet` was not given, so a `store_true` option is `False`. On a real command line the list comes from what you type after the script name.
```

---

This uses a simulated `requests` with canned replies; on your computer, `pip install requests` gives the real library with the same calls.

```exercise predict
id: drills-io-predict-requests-status
code: |
  from simulated import requests

  base = "https://shop.example/api/products/"
  reply = requests.get(base + "RUG-07", timeout=5)
  print(reply.status_code, reply.json()["stock"])
  reply = requests.get(base + "VASE-09", timeout=5)
  print(reply.status_code, reply.ok)
  print(reply.json()["error"])
output: |
  200 3
  404 False
  not found
explain: |
  A 404 is still a reply, so `get` does not raise and `.json()` happily reads the error body. Code that skips the status check would treat `{"error": "not found"}` as a product. `reply.raise_for_status()` turns any 4xx or 5xx into an exception.
```

---

A reply from the simulated shop API. Tap through it to the value.

```exercise shape
id: drills-io-shape-shop-reply
question: Find the stock count of the oak chair.
name: reply
data: |
  {
    "products": [
      {"sku": "LAMP-01", "name": "Desk lamp", "stock": 14},
      {"sku": "CHAIR-OAK-120", "name": "Oak chair", "stock": 0},
      {"sku": "RUG-07", "name": "Wool rug", "stock": 3}
    ],
    "count": 3
  }
answer: reply["products"][1]["stock"]
explain: |
  The reply is a dict with the list under `"products"`. The chair is the second product, index 1. `"count"` sits beside the list, not inside it, so it is `reply["count"]`.
```

---

A ComfyUI `/history` reply: keyed by prompt id, then by output node id.

```exercise shape
id: drills-io-shape-comfy-history
question: Find the file name of the first image the job saved.
name: history
data: |
  {
    "a1b2c3d4": {
      "status": {"status_str": "success", "completed": true},
      "outputs": {
        "9": {"images": [
          {"filename": "ComfyUI_00001_.png", "type": "output"}
        ]}
      }
    }
  }
answer: history["a1b2c3d4"]["outputs"]["9"]["images"][0]["filename"]
explain: |
  Two dict levels are keyed by ids you only know at run time: the prompt id, then the node id `"9"` as a string. `"images"` is a list, so it needs an index before the last key.
```

---

```exercise shape
id: drills-io-shape-weather
question: Find the wind speed in this weather reply.
name: weather
data: |
  {
    "city": "Leeds",
    "current": {"temp_c": 11.5, "conditions": "light rain"},
    "wind": {"speed_kph": 18, "direction": "SW"}
  }
answer: weather["wind"]["speed_kph"]
explain: |
  Two dict keys, no lists, so no indexes. Before reading a reply in code, say its shape aloud: "a dict with a city, and dicts for the current weather and the wind".
```

---

```exercise edit
id: drills-io-edit-stock-value
goal: 'Set `total` to the value of all stock in `products.csv`: price times stock, added up. It should be 1306.5.'
code: |
  import csv

  with open("products.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  total = 0
  for r in rows:
      total += float(r["price"])
  print(total)
check: |
  assert total == 1306.5, f"total is {total}; multiply each price by its stock, converting both from text"
solution: |
  import csv

  with open("products.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  total = 0
  for r in rows:
      total += float(r["price"]) * int(r["stock"])
  print(total)
explain: |
  Both cells are text, so both need converting: `float` for the price, `int` for the count. Without the conversion, `"39.00" * "14"` raises a `TypeError`, which is at least loud.
```

---

```exercise edit
id: drills-io-edit-write-heavy-json
goal: 'Write the `heavy` list to `heavy.json` as JSON, so another tool can read it.'
code: |
  import json
  from pathlib import Path

  text = Path("manifest.json").read_text(encoding="utf-8")
  manifest = json.loads(text)
  heavy = [a["name"] for a in manifest["assets"]
           if a["tris"] > 9000]
  print(heavy)
check: |
  import json
  from pathlib import Path
  assert Path("heavy.json").exists(), "heavy.json has not been written yet"
  saved = json.loads(Path("heavy.json").read_text(encoding="utf-8"))
  assert saved == ["crane_02", "boat_01"], f"heavy.json holds {saved!r}; it should hold the two heavy asset names"
solution: |
  import json
  from pathlib import Path

  text = Path("manifest.json").read_text(encoding="utf-8")
  manifest = json.loads(text)
  heavy = [a["name"] for a in manifest["assets"]
           if a["tris"] > 9000]
  Path("heavy.json").write_text(json.dumps(heavy), encoding="utf-8")
explain: |
  `json.dumps` turns the list into JSON text and `write_text` saves it. Writing `str(heavy)` instead would give single quotes, which is Python's way of printing a list and not valid JSON.
```

---

```exercise edit
id: drills-io-edit-blank-tris
goal: '`read_tris` turns a blank count into 0, which hides lamp_03''s missing data. Make it raise `ValueError` naming the asset instead.'
code: |
  def read_tris(row):
      return int(row["tris"] or 0)

  print(read_tris({"name": "rock_01", "tris": "4820"}))
check: |
  assert read_tris({"name": "rock_01", "tris": "4820"}) == 4820, "a normal count should still come back as an int"
  try:
      read_tris({"name": "lamp_03", "tris": ""})
  except ValueError as e:
      assert "lamp_03" in str(e), "the error message should name the asset"
  else:
      raise AssertionError("a blank count should raise ValueError, not count as 0")
solution: |
  def read_tris(row):
      if not row["tris"]:
          raise ValueError(f"{row['name']} has no triangle count")
      return int(row["tris"])

  print(read_tris({"name": "rock_01", "tris": "4820"}))
explain: |
  Checking at the door means bad data stops where it enters, with a message that says which row and why. A silent 0 travels on and turns into a wrong budget report far from its cause.
```

---

```exercise edit
id: drills-io-edit-argparse-int
goal: 'Make `--steps` arrive as a number, so `args.steps` is the integer 30.'
code: |
  import argparse

  parser = argparse.ArgumentParser()
  parser.add_argument("--steps", default=20)
  args = parser.parse_args(["--steps", "30"])
  print(args.steps)
check: |
  assert args.steps == 30, f"args.steps is {args.steps!r}; argparse should convert it with type=int"
solution: |
  import argparse

  parser = argparse.ArgumentParser()
  parser.add_argument("--steps", type=int, default=20)
  args = parser.parse_args(["--steps", "30"])
  print(args.steps)
explain: |
  Everything on a command line is text, so without `type=int` the value is the string `"30"`. Converting in the parser also rejects nonsense such as `--steps many` with a clear message before your code runs.
```

---

```exercise cloze
id: drills-io-cloze-json-load
prompt: Read the manifest from an open file.
code: |
  import json

  with open("manifest.json", encoding="utf-8") as f:
      manifest = json.___(f)
blanks:
  - { options: ["load", "loads", "dump", "dumps"], answer: "load" }
explain: |
  `load` reads from a file, `loads` from a string: the `s` stands for string. `dump` and `dumps` go the other way, from Python data to JSON.
```

---

```exercise cloze
id: drills-io-cloze-append-mode
prompt: Add one line to the end of the render log without wiping what is already there.
code: |
  with open("render.log", "___", encoding="utf-8") as f:
      f.write("shot_04 done\n")
blanks:
  - { options: ["a", "w", "r", "x"], answer: "a" }
explain: |
  `"a"` appends. `"w"` empties the file first, `"r"` only reads, and `"x"` refuses if the file already exists. For a log that grows, append is the only safe choice.
```

---

```exercise choice
id: drills-io-choice-encoding
question: 'A product name written as "Café" comes back as "CafÃ©" when another script reads the file. What is the likely cause?'
options:
  - { id: encoding, text: "The file was written as UTF-8 and read with a different encoding" }
  - { id: csv, text: "The CSV module cannot store accented letters" }
  - { id: disk, text: "The file was damaged on disk" }
answer: encoding
explain: |
  UTF-8 stores "é" as two bytes, and an encoding such as Windows-1252 reads each byte as its own character. Pass `encoding="utf-8"` every time you open a text file, both when writing and when reading.
```

---

```exercise choice
id: drills-io-choice-raise-for-status
question: Why call `reply.raise_for_status()` before `reply.json()`?
options:
  - { id: stop, text: "So a 404 or 500 stops with an error instead of being read as if it were data" }
  - { id: speed, text: "It makes the request faster" }
  - { id: retry, text: "It retries the request until it succeeds" }
answer: stop
explain: |
  An error reply still has a body, often JSON, and `.json()` will read it. Without the status check, an error message can flow into your pipeline as though it were a product or a workflow result.
```
