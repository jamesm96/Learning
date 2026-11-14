---
id: bug-hunt-medium
title: Medium
minutes: 10
---

```exercise fix
id: bug-hunt-medium-get-default
symptom: "The shop's 'lowest price' banner shows CHAIR-OAK-120 at £0.00. The oak chair costs £149."
code: |
  catalogue = [
      {"sku": "LAMP-01", "price": 39.00},
      {"sku": "CHAIR-OAK-120", "cost": 149.00},
      {"sku": "MUG-02", "price": 12.00},
  ]

  def price_of(item):
      return item.get("price", 0.0)

  try:
      cheapest = min(catalogue, key=price_of)
      print(cheapest["sku"], price_of(cheapest))
  except ValueError as e:
      print("stopped:", e)
check: |
  try:
      price_of({"sku": "CHAIR-OAK-120", "cost": 149.00})
  except ValueError as e:
      assert "CHAIR-OAK-120" in str(e), f"The error should name the item, but says: {e}"
  else:
      raise AssertionError("price_of should raise ValueError for an item with no price.")
  assert price_of({"sku": "MUG-02", "price": 12.00}) == 12.00, "price_of should still return a real price."
solution: |
  catalogue = [
      {"sku": "LAMP-01", "price": 39.00},
      {"sku": "CHAIR-OAK-120", "cost": 149.00},
      {"sku": "MUG-02", "price": 12.00},
  ]

  def price_of(item):
      if "price" not in item:
          raise ValueError(f"{item['sku']} has no price")
      return item["price"]

  try:
      cheapest = min(catalogue, key=price_of)
      print(cheapest["sku"], price_of(cheapest))
  except ValueError as e:
      print("stopped:", e)
cause:
  options:
    - { id: min, text: "`min` compares the SKUs instead of the prices" }
    - { id: default, text: '`.get("price", 0.0)` turned a missing price into a believable £0' }
    - { id: float, text: "149.00 is too large for a float" }
  answer: default
explain: |
  The chair's record says `cost`, not `price`. Without the default, `item["price"]` would have failed with `KeyError: 'price'` right away. With it, the chair quietly became free and won the "lowest price" banner.

  The symptom showed up in `min`, but the cause was in `price_of`. A suspicious round 0 is the clue: print the item that produced it and the missing key is obvious. Use `.get` with a default only when the default is a true answer, not a guess.
```

---

```exercise fix
id: bug-hunt-medium-mutable-default
symptom: "rock_01 was tagged once, but its tags show needs_review twice."
code: |
  def tag_asset(name, tags=[]):
      tags.append("needs_review")
      return {"name": name, "tags": tags}

  rock = tag_asset("rock_01")
  boat = tag_asset("boat_01", ["vehicle"])
  lamp = tag_asset("lamp_03")
  print(rock["tags"])
  print(lamp["tags"])
check: |
  assert rock["tags"] == ["needs_review"], f"rock_01 tags are {rock['tags']}; it was tagged once."
  assert lamp["tags"] == ["needs_review"], f"lamp_03 tags are {lamp['tags']}; it was tagged once."
  assert boat["tags"] == ["vehicle", "needs_review"], f"boat_01 tags are {boat['tags']}."
  assert rock["tags"] is not lamp["tags"], "Each asset should get its own list of tags."
solution: |
  def tag_asset(name, tags=None):
      if tags is None:
          tags = []
      tags.append("needs_review")
      return {"name": name, "tags": tags}

  rock = tag_asset("rock_01")
  boat = tag_asset("boat_01", ["vehicle"])
  lamp = tag_asset("lamp_03")
  print(rock["tags"])
  print(lamp["tags"])
cause:
  options:
    - { id: default, text: "The default `[]` is made once and shared by every call that leaves `tags` out" }
    - { id: append, text: "`append` adds the tag twice" }
    - { id: boat, text: "Passing a list for boat_01 changed rock_01" }
  answer: default
explain: |
  A default value is created once, when Python reads the `def`, not on each call. So rock_01 and lamp_03 share the very same list, and the second call's tag shows up in both.

  The symptom appears only after a later call, which makes it look random. Printing `rock["tags"]` straight after the first call shows one tag; printing it again at the end shows two. Use `None` as the default and make a fresh list inside the function.
```

---

```exercise fix
id: bug-hunt-medium-aliasing
symptom: "The median is right, but 'first reading' shows 21.4. The first reading of the day was 21.9."
code: |
  def median(values):
      values.sort()
      mid = len(values) // 2
      return values[mid]

  log = [21.9, 22.8, 21.4, 23.1, 22.3]  # time order
  m = median(log)
  print("median:", m)
  print("first reading:", log[0])
  print("last reading:", log[-1])
check: |
  assert m == 22.3, f"The median is {m}; it should be 22.3."
  assert log == [21.9, 22.8, 21.4, 23.1, 22.3], f"log is {log}; median should not reorder it."
solution: |
  def median(values):
      values = sorted(values)
      mid = len(values) // 2
      return values[mid]

  log = [21.9, 22.8, 21.4, 23.1, 22.3]  # time order
  m = median(log)
  print("median:", m)
  print("first reading:", log[0])
  print("last reading:", log[-1])
cause:
  options:
    - { id: mid, text: "`len(values) // 2` picks the wrong middle index" }
    - { id: index, text: "`log[0]` reads the last item, not the first" }
    - { id: alias, text: "`values.sort()` reorders the caller's own list, so `log` is changed" }
  answer: alias
explain: |
  Passing a list to a function does not copy it. `values` and `log` are two names for one list, so `values.sort()` put the whole sensor log into temperature order. `sorted(values)` makes a sorted copy and leaves the original alone.

  The wrong value appeared two lines after the call, in code that never touched the list. Printing `log` before and after `median(log)` shows it changing. A function that only reads its input should never call `.sort()`, `.append()` or `.remove()` on it.
```

---

```exercise fix
id: bug-hunt-medium-renamed-key
symptom: "KeyError: 'stock' inside out_of_stock. products.csv definitely has a stock column."
code: |
  import csv

  def load_products(path):
      with open(path, newline="", encoding="utf-8") as f:
          rows = list(csv.DictReader(f))
      return [{"sku": r["sku"], "qty": int(r["stock"])}
              for r in rows]

  def out_of_stock(products):
      return [p["sku"] for p in products
              if p["stock"] == 0]

  print(out_of_stock(load_products("products.csv")))
check: |
  result = out_of_stock(load_products("products.csv"))
  assert result == ["CHAIR-OAK-120"], f"out_of_stock found {result}; only the oak chair has none left."
solution: |
  import csv

  def load_products(path):
      with open(path, newline="", encoding="utf-8") as f:
          rows = list(csv.DictReader(f))
      return [{"sku": r["sku"], "stock": int(r["stock"])}
              for r in rows]

  def out_of_stock(products):
      return [p["sku"] for p in products
              if p["stock"] == 0]

  print(out_of_stock(load_products("products.csv")))
cause:
  options:
    - { id: renamed, text: "`load_products` stores the count as `qty`, but `out_of_stock` reads `stock`" }
    - { id: csv, text: "`csv.DictReader` drops the last column" }
    - { id: int, text: '`int("0")` fails, so the chair has no count' }
  answer: renamed
explain: |
  The CSV column is `stock`, and `load_products` reads it correctly, then saves it under a new name, `qty`. Every later function has to use the new name. One was missed.

  The traceback points at `out_of_stock`, but that line is fine on its own terms. Print one product from `load_products` and the key list shows `qty`. When Claude renames a field, search for every place the old name is still used.
```

---

```exercise fix
id: bug-hunt-medium-last-pair
symptom: "The spike detector finds nothing. The last reading jumps 2.6 °C in five minutes."
code: |
  temps = [21.4, 21.9, 22.3, 24.9]

  def jumps(values, limit=1.0):
      found = []
      for i in range(len(values) - 2):
          change = values[i + 1] - values[i]
          if abs(change) > limit:
              found.append(i + 1)
      return found

  print(jumps(temps))
check: |
  assert jumps(temps) == [3], f"jumps(temps) is {jumps(temps)}; the spike is at index 3."
  assert jumps([20.0, 25.0]) == [1], "Two readings make one pair, and this pair is a spike."
  assert jumps([20.0, 25.0, 20.5]) == [1, 2], "Both pairs in this list are spikes."
solution: |
  temps = [21.4, 21.9, 22.3, 24.9]

  def jumps(values, limit=1.0):
      found = []
      for i in range(len(values) - 1):
          change = values[i + 1] - values[i]
          if abs(change) > limit:
              found.append(i + 1)
      return found

  print(jumps(temps))
cause:
  options:
    - { id: limit, text: "The limit of 1.0 is too high to catch the spike" }
    - { id: range, text: "`range(len(values) - 2)` stops one pair early, so the last pair is never checked" }
    - { id: abs, text: "`abs` hides changes that go upwards" }
  answer: range
explain: |
  Four readings make three pairs, so `i` must run 0, 1, 2: that is `range(len(values) - 1)`. With `- 2` it runs 0, 1 and never compares the last two readings, which is exactly where the spike was.

  Nothing crashed, because the loop stayed inside the list. Off-by-one errors at the end of a range are easiest to see with a tiny input: two readings should give one pair, and `range(0)` gives none.
```

---

```exercise fix
id: bug-hunt-medium-append-mode
symptom: "load_state fails with JSONDecodeError: Extra data. Both saves seemed to work."
code: |
  import json

  def save_state(state, path="sim_state.json"):
      with open(path, "a", encoding="utf-8") as f:
          json.dump(state, f)

  def load_state(path="sim_state.json"):
      with open(path, encoding="utf-8") as f:
          return json.load(f)

  save_state({"step": 0, "x": 0.0})
  save_state({"step": 100, "x": 2.5})
  print(load_state())
check: |
  state = load_state()
  assert state == {"step": 100, "x": 2.5}, f"load_state gave {state}; it should be the latest save."
solution: |
  import json

  def save_state(state, path="sim_state.json"):
      with open(path, "w", encoding="utf-8") as f:
          json.dump(state, f)

  def load_state(path="sim_state.json"):
      with open(path, encoding="utf-8") as f:
          return json.load(f)

  save_state({"step": 0, "x": 0.0})
  save_state({"step": 100, "x": 2.5})
  print(load_state())
cause:
  options:
    - { id: append, text: '`"a"` adds each save to the end, so the file holds two JSON objects' }
    - { id: load, text: "`json.load` needs the file opened in binary mode" }
    - { id: float, text: "JSON cannot store the float 2.5" }
  answer: append
explain: |
  `"a"` (append) keeps what is already in the file and writes after it. After two saves the file reads `{"step": 0, ...}{"step": 100, ...}`, and a JSON file must hold exactly one value, hence "Extra data". `"w"` replaces the file each time.

  The error came from `load_state`, but the reading code was fine; the file was wrong. Opening `sim_state.json` and looking at it, or `print(open(path).read())`, shows both objects side by side. Append mode suits a log, one line per entry, not a single JSON document.
```

---

```exercise fix
id: bug-hunt-medium-status
symptom: "KeyError: 'name' for the second SKU. The script was meant to skip products the shop does not know."
code: |
  from simulated import requests

  def fetch(sku):
      url = "https://shop.example/api/products/" + sku
      reply = requests.get(url, timeout=5)
      return reply.json()

  for sku in ["LAMP-01", "CHAIR-OAK-12"]:
      try:
          p = fetch(sku)
          print(p["name"], p["price"])
      except requests.HTTPError as e:
          print("skipped:", e)
check: |
  assert fetch("LAMP-01")["price"] == 39.0, "fetch should still return a product that exists."
  try:
      fetch("CHAIR-OAK-12")
  except requests.HTTPError:
      pass
  else:
      raise AssertionError("fetch should raise HTTPError when the shop replies 404.")
solution: |
  from simulated import requests

  def fetch(sku):
      url = "https://shop.example/api/products/" + sku
      reply = requests.get(url, timeout=5)
      reply.raise_for_status()
      return reply.json()

  for sku in ["LAMP-01", "CHAIR-OAK-12"]:
      try:
          p = fetch(sku)
          print(p["name"], p["price"])
      except requests.HTTPError as e:
          print("skipped:", e)
cause:
  options:
    - { id: status, text: "`fetch` never calls `raise_for_status`, so a 404 reply is treated as a product" }
    - { id: timeout, text: "A timeout of 5 seconds is too short" }
    - { id: except, text: "`except requests.HTTPError` catches the wrong kind of error" }
  answer: status
explain: |
  The SKU is mistyped (`CHAIR-OAK-12`, not `-120`), so the shop replies 404 with a body of `{"error": "not found", ...}`. A reply is not an error in Python unless you ask: without `raise_for_status()`, the error body comes back as if it were a product, and the failure surfaces later as a `KeyError`.

  The `except HTTPError` was waiting for an error that was never raised. Printing `reply.status_code` inside `fetch` shows the 404. This uses the course's simulated `requests`; on a computer, `pip install requests` gives the real library with the same calls.
```
