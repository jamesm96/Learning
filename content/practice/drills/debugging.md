---
id: drills-debugging
title: Errors and debugging
minutes: 5
---

```exercise traceback
id: drills-debugging-traceback-missing-key
code: |
  def price_label(product):
      return f"£{product['price']:.2f}"

  catalogue = [
      {"sku": "LAMP-01", "price": 39.0},
      {"sku": "RUG-07", "cost": 89.5},
  ]
  for p in catalogue:
      print(price_label(p))
options:
  - { id: key, text: 'The rug stores its price under "cost", not "price"' }
  - { id: format, text: "The `:.2f` format cannot handle 89.5" }
  - { id: list, text: "The catalogue list is too short" }
answer: key
explain: |
  `KeyError: 'price'` names the key that was missing. The lamp printed first, so the function works; the second product's data is shaped differently. Fix the data, or decide deliberately what a product without a price should do.
```

---

```exercise traceback
id: drills-debugging-traceback-str-plus-int
code: |
  def total_stock(rows):
      total = 0
      for row in rows:
          total += row["stock"]
      return total

  rows = [{"sku": "LAMP-01", "stock": 14},
          {"sku": "MUG-02", "stock": "41"}]
  print(total_stock(rows))
options:
  - { id: text, text: 'The mug''s stock is the text "41", not a number' }
  - { id: zero, text: "`total` should start at 0.0" }
  - { id: key, text: 'The mug has no "stock" key' }
answer: text
explain: |
  `TypeError: unsupported operand type(s) for +=: 'int' and 'str'` says what met what. A number cannot be added to text. Values that came from a CSV file or a form often arrive as strings; convert them with `int()` where they enter the program.
```

---

```exercise traceback
id: drills-debugging-traceback-none-attribute
code: |
  def find(objects, name):
      for obj in objects:
          if obj["name"] == name:
              return obj

  scene = [{"name": "gripper"}, {"name": "table"}]
  target = find(scene, "Gripper")
  print(target.get("name"))
options:
  - { id: none, text: '`find` returned `None` because no name matched "Gripper"' }
  - { id: get, text: "Dicts do not have a `get` method" }
  - { id: list, text: "`scene` should be a dict, not a list" }
answer: none
explain: |
  `AttributeError: 'NoneType' object has no attribute 'get'` means the value was `None`. The search is case-sensitive, so `"Gripper"` matched nothing and the function fell off the end, which returns `None`. The real fault is one line earlier than the one in the traceback.
```

---

```exercise traceback
id: drills-debugging-traceback-value-error
code: |
  readings = ["21.4", "19.8", "n/a", "22.3"]
  temps = []
  for r in readings:
      temps.append(float(r))
  print(sum(temps) / len(temps))
options:
  - { id: na, text: 'One reading is the text "n/a", which is not a number' }
  - { id: float, text: "`float` cannot convert text with a decimal point" }
  - { id: zero, text: "The list is empty, so the division fails" }
answer: na
explain: |
  `ValueError: could not convert string to float: 'n/a'` quotes the bad value. The type was right, a string, but its content could not be read as a number. Sensors that drop out often write placeholders like this; decide whether to skip them or stop.
```

---

```exercise traceback
id: drills-debugging-traceback-index
code: |
  def lowest_lod(asset):
      return asset["lods"][-1]

  def report(assets):
      for a in assets:
          print(a["name"], lowest_lod(a))

  report([
      {"name": "rock_01", "lods": ["lod0", "lod1"]},
      {"name": "lamp_03", "lods": []},
  ])
options:
  - { id: empty, text: "lamp_03 has an empty list of LODs" }
  - { id: negative, text: "`-1` is never a valid index" }
  - { id: name, text: 'lamp_03 has no "name" key' }
answer: empty
explain: |
  `IndexError: list index out of range`, raised inside `lowest_lod`, called from `report`. `[-1]` means "the last item" and worked for the rock. An empty list has no last item, so the cause is lamp_03's data.
```

---

```exercise traceback
id: drills-debugging-traceback-name-typo
code: |
  def summarise(products):
      in_stock = [p for p in products if p["stock"] > 0]
      return len(in_stok)

  print(summarise([{"stock": 3}, {"stock": 0}]))
options:
  - { id: typo, text: "`in_stok` is misspelt, so that name was never defined" }
  - { id: scope, text: "List comprehensions cannot be used inside functions" }
  - { id: stock, text: 'A product is missing its "stock" key' }
answer: typo
explain: |
  `NameError: name 'in_stok' is not defined`. Python usually adds a suggestion such as "Did you mean: 'in_stock'?". A `NameError` is almost always a typo, a name used before it is assigned, or a name that only existed inside another function.
```

---

```exercise traceback
id: drills-debugging-traceback-json-file
code: |
  import json

  with open("workflow_api.json", encoding="utf-8") as f:
      workflow = json.load(f)
  print(len(workflow))
options:
  - { id: missing, text: "There is no file called workflow_api.json in the working folder" }
  - { id: json, text: "The JSON inside the file is broken" }
  - { id: encoding, text: "UTF-8 is the wrong encoding for JSON" }
answer: missing
explain: |
  `FileNotFoundError` with "No such file or directory" stops at `open`, before any JSON is read, so the content cannot be the problem. Check the name and the folder the script runs from: relative paths start from the current working folder, not from the script.
```

---

```exercise choice
id: drills-debugging-choice-dict-index
question: Which error does this raise?
code: |
  scene = {"assets": [{"name": "rock_01"}]}
  print(scene["assets"]["name"])
options:
  - { id: type, text: "`TypeError`: list indices must be integers or slices, not str" }
  - { id: key, text: "`KeyError: 'name'`" }
  - { id: attr, text: "`AttributeError`" }
answer: type
explain: |
  `scene["assets"]` is a list, and lists are indexed by position. Asking a list for `"name"` is the wrong kind of index, so it is a `TypeError`, not a `KeyError`. The fix is an index first: `scene["assets"][0]["name"]`.
```

---

```exercise choice
id: drills-debugging-choice-int-text
question: Which error does `int("12.5")` raise?
options:
  - { id: value, text: "`ValueError`" }
  - { id: type, text: "`TypeError`" }
  - { id: none, text: "None: it returns 12" }
answer: value
explain: |
  `int()` accepts a string, so the type is fine; it is the content that cannot be read as a whole number. Wrong type gives `TypeError`, right type with a bad value gives `ValueError`. Use `int(float("12.5"))` if you really want 12.
```

---

```exercise choice
id: drills-debugging-choice-zero-division
question: 'A sensor report divides by `len(readings)`. The night shift logged no readings. Which error appears?'
options:
  - { id: zero, text: "`ZeroDivisionError`" }
  - { id: index, text: "`IndexError`" }
  - { id: value, text: "`ValueError`" }
answer: zero
explain: |
  An empty list has length 0, and dividing by 0 raises `ZeroDivisionError`. The code is fine for normal days; the empty case was never considered. Ask what a mean of no readings should be, often `None`, and handle it before dividing.
```

---

```exercise choice
id: drills-debugging-choice-module
question: 'A script starts `import bpy` and you run it with plain Python outside Blender. What happens?'
options:
  - { id: module, text: "`ModuleNotFoundError: No module named 'bpy'`" }
  - { id: name, text: "`NameError: name 'bpy' is not defined`" }
  - { id: works, text: "It runs, but nothing appears in Blender" }
answer: module
explain: |
  `bpy` exists only inside Blender's own Python. Outside it, the import itself fails. The same error appears when a package such as `requests` is not installed in the Python you are using; check which Python runs the script.
```

---

```exercise predict
id: drills-debugging-predict-try-skip
code: |
  rows = ["21.4", "n/a", "22.3"]
  good = []
  for r in rows:
      try:
          good.append(float(r))
      except ValueError:
          print("skipped", r)
  print(good)
output: |
  skipped n/a
  [21.4, 22.3]
explain: |
  Only the bad row raises, and only `ValueError` is caught, so the loop carries on and says what it skipped. Other mistakes, such as a typo raising `NameError`, would still stop the program, which is what you want.
```

---

```exercise predict
id: drills-debugging-predict-swallowed
code: |
  def load_seed(settings):
      try:
          return settings["seed"]
      except Exception:
          return 0

  print(load_seed({"seed": 42}))
  print(load_seed({"Seed": 42}))
output: |
  42
  0
explain: |
  The capital S means the key is missing, and `except Exception` turns that into a seed of 0 with no message. The render runs with the wrong seed and nobody knows. A broad `except` that returns a normal-looking value hides the very error you need to see.
```

---

```exercise predict
id: drills-debugging-predict-not-caught
code: |
  try:
      stock = {"LAMP-01": 14}
      print(stock["LAMP-01"])
      print(stock["RUG-07"])
      print("done")
  except ValueError:
      print("bad value")
  except KeyError as e:
      print("missing", e)
output: |
  14
  missing 'RUG-07'
explain: |
  The first lookup works. The second raises `KeyError`, so Python jumps straight to the matching `except`, skipping `print("done")`. The `ValueError` handler is passed over because the error is of a different type.
```

---

```exercise predict
id: drills-debugging-predict-finally
code: |
  def export(name):
      try:
          if not name:
              raise ValueError("empty name")
          return f"exported {name}"
      finally:
          print("closing", repr(name))

  print(export("boat_01"))
output: |
  closing 'boat_01'
  exported boat_01
explain: |
  `finally` runs on the way out of the `try`, whether it returns or raises. So the closing line prints before the caller gets the return value and prints it. It is the place for clean-up such as closing a file or a connection.
```
