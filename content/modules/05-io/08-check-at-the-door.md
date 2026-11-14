---
id: io-08
title: Check data at the door
minutes: 8
recap: |
  Anything arriving from outside my code, a file, a spreadsheet, an API or a person, may be wrong, so I check it once, right where it enters, and fail with a message that names the item and the problem. After that the rest of the code can assume clean data, instead of hiding gaps with defaults, treating 0 as missing, or swallowing errors.
---

Anything arriving from outside your code (a file, a spreadsheet, an API, a person) may be wrong. Check it once, where it enters, and fail with a message that names the problem. The rest of the code can then assume clean data.

```python
def validate_asset(asset: dict) -> None:
    for key in ("name", "tris", "materials"):
        if key not in asset:
            name = asset.get("name", "?")
            raise ValueError(
                f"Asset {name} is missing '{key}'")
    if not isinstance(asset["tris"], int):
        raise ValueError(
            f"{asset['name']}: tris must be a whole number")
```

---

```exercise predict
id: io-08-predict-validate
code: |
  def validate_asset(asset):
      for key in ("name", "tris", "materials"):
          if key not in asset:
              name = asset.get("name", "?")
              raise ValueError(
                  f"Asset {name} is missing '{key}'")
      if not isinstance(asset["tris"], int):
          raise ValueError(
              f"{asset['name']}: tris must be a whole number")

  assets = [
      {"name": "rock_01", "tris": 4820, "materials": ["stone"]},
      {"name": "crane_02", "tris": 18250},
      {"name": "boat_01", "tris": "9100", "materials": ["wood"]},
  ]
  for a in assets:
      try:
          validate_asset(a)
          print("ok", a["name"])
      except ValueError as e:
          print(e)
output: |
  ok rock_01
  Asset crane_02 is missing 'materials'
  boat_01: tris must be a whole number
explain: |
  Each message names the asset and the problem. `"9100"` in quotes is a string, which is what you get when a number passes through a CSV unconverted. Here `.get("name", "?")` is a fair default: it is only used to word the error message.
```

---

## Compare the experience

With the check: "Asset crane_02 is missing 'materials'", the moment the manifest loads.

Without it: a `KeyError: 'materials'` forty lines deep in the exporter, eleven minutes into a batch, with half the files written.

---

```exercise choice
id: io-08-where
tag: Judgement call
question: 'In the `asset_tools` layout from Module 2 (`manifest.py` reads data, `checks.py` holds the rules, `cli.py` runs it), where does validation belong?'
options:
  - { id: everywhere, text: "Inside every function that touches an asset" }
  - { id: ui, text: "In the user interface code, `cli.py`" }
  - { id: boundary, text: "Right after loading, before anything else uses the data" }
answer: boundary
explain: |
  One checkpoint at the boundary. Checks scattered through every function are noise and tend to drift apart. This idea goes by the name "validate at the boundary" in every language.
```

---

Generated code often trades a clear early error for a quiet wrong answer. Three versions of that follow. First, a default that hides a missing field.

```exercise fix
id: io-08-fix-get-default
symptom: "The budget check says every asset is fine. `lamp_03` has no triangle count at all."
files:
  scene.json: |
    {"assets": [
      {"name": "rock_01", "tris": 4820},
      {"name": "lamp_03"}
    ]}
code: |
  import json
  from pathlib import Path

  def load_assets(path):
      data = json.loads(Path(path).read_text(encoding="utf-8"))
      assets = []
      for a in data["assets"]:
          assets.append({"name": a["name"], "tris": a.get("tris", 0)})
      return assets

  try:
      for a in load_assets("scene.json"):
          print(a["name"], "ok" if a["tris"] <= 9000 else "over")
  except ValueError as e:
      print("stopped:", e)
check: |
  try:
      load_assets("scene.json")
  except ValueError as e:
      assert "lamp_03" in str(e), f"The error should name lamp_03, but says: {e}"
  else:
      raise AssertionError("load_assets should raise ValueError for an asset with no tris.")
solution: |
  import json
  from pathlib import Path

  def load_assets(path):
      data = json.loads(Path(path).read_text(encoding="utf-8"))
      assets = []
      for a in data["assets"]:
          if "tris" not in a:
              raise ValueError(f"Asset {a['name']} is missing 'tris'")
          assets.append({"name": a["name"], "tris": a["tris"]})
      return assets

  try:
      for a in load_assets("scene.json"):
          print(a["name"], "ok" if a["tris"] <= 9000 else "over")
  except ValueError as e:
      print("stopped:", e)
cause:
  options:
    - { id: default, text: '`.get("tris", 0)` turned a missing count into a believable 0, which passes the budget' }
    - { id: budget, text: "The budget of 9000 is too high" }
    - { id: json, text: "`json.loads` drops keys it cannot read" }
  answer: default
explain: |
  A missing triangle count is a broken asset, not a light one. The default made up a value that looks real, so the report was confidently wrong. Checking at load time turns it into one clear error naming `lamp_03`.

  The solution stops at the first bad asset. A batch tool could instead collect every problem and report them all at once; either is honest.
```

---

Second, a test for "missing" that also catches a real value. In this robotics scene, a camera is a marker with no geometry, so 0 triangles is correct.

```exercise fix
id: io-08-fix-not-zero
symptom: '`missing` lists `camera_01`, which has a perfectly valid count of 0.'
files:
  robot_scene.csv: |
    name,kind,tris
    arm_02,robot,5400
    camera_01,sensor,0
    gripper_03,robot,
code: |
  import csv

  with open("robot_scene.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  missing = []
  for row in rows:
      tris = int(row["tris"]) if row["tris"] else None
      if not tris:
          missing.append(row["name"])
  print("missing:", missing)
check: |
  assert missing == ["gripper_03"], f"missing is {missing}; only gripper_03 has no count."
solution: |
  import csv

  with open("robot_scene.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  missing = []
  for row in rows:
      tris = int(row["tris"]) if row["tris"] else None
      if tris is None:
          missing.append(row["name"])
  print("missing:", missing)
cause:
  options:
    - { id: falsy, text: "`if not tris` is true for `None` and also for `0`" }
    - { id: int, text: '`int("0")` raises an error' }
    - { id: csv, text: "The CSV reader skips cells that hold 0" }
  answer: falsy
explain: |
  `not` treats `None`, `0`, `""` and `[]` all as "nothing". When 0 is a real answer, ask the exact question: `if tris is None`.

  Converting first and checking for `None` afterwards is also the right order. The empty cell became `None` once, at the door, and nothing later has to wonder about empty strings.
```

---

Third, a "robust" parser that swallows every error. The 09:05 reading from `t-02` in `sensors.csv` is `n/a`.

```exercise fix
id: io-08-fix-swallowed
symptom: "The average for sensor t-02 comes out at 13.3 °C. Its readings are around 20."
code: |
  import csv

  with open("sensors.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))
  rows = [r for r in rows if r["sensor"] == "t-02"]

  temps = []
  bad = []
  for row in rows:
      try:
          temps.append(float(row["temp_c"]))
      except Exception:
          temps.append(0.0)

  print(round(sum(temps) / len(temps), 2), "bad:", bad)
check: |
  average = round(sum(temps) / len(temps), 2)
  assert average == 19.95, f"The average is {average}; leaving out the bad reading gives 19.95."
  assert bad == ["09:05"], f"bad is {bad}; it should record the time of the unreadable row, 09:05."
solution: |
  import csv

  with open("sensors.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))
  rows = [r for r in rows if r["sensor"] == "t-02"]

  temps = []
  bad = []
  for row in rows:
      try:
          temps.append(float(row["temp_c"]))
      except ValueError:
          bad.append(row["time"])

  print(round(sum(temps) / len(temps), 2), "bad:", bad)
cause:
  options:
    - { id: zero, text: 'The broad `except` turned "n/a" into a real-looking reading of 0.0' }
    - { id: float, text: '`float` cannot read "19.8"' }
    - { id: filter, text: "The filter kept readings from the wrong sensor" }
  answer: zero
explain: |
  "No reading" and "0 °C" are different facts. Inventing a 0.0 dragged the average down by a third, and nothing on screen said so. Catching only `ValueError`, recording the row and leaving it out gives the true average and an honest report.

  The same pattern turns up in robotics training data and digital-twin feeds: a dropped sample must stay visibly missing, or a model learns from readings that never happened.
```
