---
id: debugging-01
title: Read the traceback from the bottom
minutes: 6
recap: |
  Read a traceback from the bottom: the last line says what went wrong, the entry above it says where, and the entries above that show how the program got there. The line that crashed is often correct code that received bad data, so the cause can be far from where the error appears.
---

When Python fails it prints a traceback. It looks hostile and is in fact a precise report.

Read it bottom-up. The last line is the most important one, and the top is the least.

---

An exporter that builds a file path for each asset, and the traceback it printed.

```traceback
root = "D:/exports"
def build_path(asset):
    return root + "/" + asset["folder"] + "/" + asset["name"]

def export_all(assets):
    for asset in assets:
        path = build_path(asset)
        print("exporting", path)

assets = [
    {"name": "rock_01", "folder": "props"},
    {"name": "crane_02"},
]
export_all(assets)
```

---

## Three things, bottom to top

1. **Last line: what went wrong.** `KeyError: 'folder'`. A dictionary was asked for a key it does not have.
2. **The entry just above: where.** Line 3, inside `build_path`, and it shows you the line. The `~~~^^^` marks underline the exact part that failed.
3. **The entries above that: how the program got there.** The main script called `export_all`, which called `build_path`.

---

```exercise choice
id: debugging-01-which-called
question: In that traceback, which function called `build_path`?
options:
  - { id: export-all, text: "`export_all`, on line 7" }
  - { id: module, text: "The main script, on line 14" }
  - { id: itself, text: "`build_path` called itself" }
answer: export-all
explain: |
  Each entry is called by the one above it. The main script called `export_all` on line 14, and `export_all` called `build_path` on line 7. Reading upwards tells you the route the program took.
```

---

```exercise choice
id: debugging-01-where-cause
tag: Judgement call
question: Line 3 is where it crashed. Where is the cause most likely to be?
options:
  - { id: typo, text: "Line 3 itself has a typo" }
  - { id: python, text: "In Python's dictionary code" }
  - { id: data, text: 'Wherever that asset''s data was created without a "folder"' }
answer: data
explain: |
  Line 3 is correct code that received incomplete data. The place an error appears and the place it was caused are often far apart.

  The useful next question is "which asset, and why does it have no folder?". The quick patch, `.get("folder", "")`, would hide the answer.
```

---

Your turn. Tap the line where it failed, then name the cause.

```exercise traceback
id: debugging-01-sensor-mean
code: |
  def mean(values):
      return sum(values) / len(values)

  def summarise(sensor):
      avg = mean(sensor["temps"])
      return sensor["id"], round(avg, 1)

  sensors = [
      {"id": "t-01", "temps": [21.4, 21.9]},
      {"id": "t-02", "temps": []},
  ]
  for s in sensors:
      print(summarise(s))
options:
  - { id: empty, text: "Sensor t-02 has no readings, so its list is empty" }
  - { id: mean-wrong, text: "`mean` is written wrongly" }
  - { id: round, text: "`round` cannot handle this number" }
answer: empty
explain: |
  The last line says `ZeroDivisionError`, and the entry above it is inside `mean`: `len(values)` was 0. `mean` works for t-01, so it is not wrong in general. The cause is the data: t-02 has an empty list.

  Whether `mean` should refuse an empty list loudly or the caller should skip silent sensors is a design choice. Either way, the traceback has told you where to look.
```

---

```exercise traceback
id: debugging-01-robot-camera
code: |
  def first_camera(scene):
      return scene["cameras"][0]

  def camera_fov(scene):
      cam = first_camera(scene)
      return cam["fov"]

  scene = {
      "name": "warehouse_07",
      "robots": ["arm_a", "arm_b"],
      "cameras": [],
  }
  print(camera_fov(scene))
options:
  - { id: no-cameras, text: "The scene's camera list is empty" }
  - { id: no-key, text: 'The scene has no "cameras" key' }
  - { id: no-fov, text: 'The camera has no "fov" key' }
answer: no-cameras
explain: |
  `IndexError: list index out of range` on the line `scene["cameras"][0]`. The key exists, or it would be a `KeyError`. The list under it is empty, so there is no item 0. The code never reached the `"fov"` line.

  The error type alone rules out two of the three guesses. That is why the last line comes first.
```
