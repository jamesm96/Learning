---
id: structure-01
title: "Functions: a named step with inputs and an output"
minutes: 7
---

A function takes values in through its parameters and hands one back with `return`.

```python
def over_budget(assets, budget=9000):
    """Return the names of assets above budget."""
    return [a["name"] for a in assets
            if a["tris"] > budget]
```

`budget=9000` is a default. Callers can leave it out, or pass it by name: `over_budget(assets, budget=4000)`.

---

Predict both lines.

```exercise predict
id: structure-01-predict-budget
code: |
  def over_budget(assets, budget=9000):
      """Return the names of assets above budget."""
      return [a["name"] for a in assets
              if a["tris"] > budget]

  assets = [
      {"name": "rock_01", "tris": 4820},
      {"name": "crane_02", "tris": 18250},
  ]

  print(over_budget(assets))
  print(over_budget(assets, budget=4000))
output: |
  ['crane_02']
  ['rock_01', 'crane_02']
explain: |
  The first call uses the default of 9000, so only the crane is over. The second passes `budget=4000` by name, and both assets are over that.
hint: Change `return` to `print` and run it.
```

---

## Printing is not returning

Printing shows a value to a person. Returning gives it to the rest of the program.

A function with no `return` hands back `None`. Tools need the returned value, because the next step has to do something with it.

---

Here is the same function with `print` where `return` was.

```exercise predict
id: structure-01-predict-print-none
code: |
  def over_budget(assets, budget=9000):
      print([a["name"] for a in assets
             if a["tris"] > budget])

  assets = [{"name": "crane_02", "tris": 18250}]
  print(over_budget(assets))
output: |
  ['crane_02']
  None
explain: |
  The call prints its list inside the function. Then the outer `print` shows what the function handed back, and with no `return` that is `None`. On screen it looks as if it worked. Any code that tries to use the result gets `None`.
```

---

```exercise choice
id: structure-01-no-return
question: 'A helper ends without a `return` line. What does `result = helper()` store in `result`?'
options:
  - { id: none, text: "`None`" }
  - { id: last, text: "The value of the last line in the function" }
  - { id: error, text: "Nothing; Python raises an error" }
answer: none
explain: |
  Every function returns something. If it never reaches a `return`, Python returns `None` for it. When `None` turns up where a list was expected, a missing `return` is the first thing to look for.
```

---

This helper filters sensor readings, but the next step gets nothing back.

```exercise edit
id: structure-01-edit-return
goal: Make `spikes` hold the list of readings above the limit, `[85.2, 90.1]`.
code: |
  def find_spikes(readings, limit=50):
      found = [r for r in readings if r > limit]
      print(found)

  spikes = find_spikes([21.5, 85.2, 22.0, 90.1])
check: |
  assert spikes == [85.2, 90.1], "spikes should be the list the function hands back, so the function needs to return it"
solution: |
  def find_spikes(readings, limit=50):
      found = [r for r in readings if r > limit]
      return found

  spikes = find_spikes([21.5, 85.2, 22.0, 90.1])
explain: |
  `return found` hands the list to whoever called the function, and `spikes` keeps it. With `print`, `spikes` was `None`, and the readings were only visible on screen.
```

---

```exercise cloze
id: structure-01-cloze-keyword
prompt: Call the function with a stock threshold of 10, passing it by name.
code: |
  def low_stock(products, threshold=5):
      return [p["sku"] for p in products
              if p["stock"] < threshold]

  print(low_stock(products, ___=10))
blanks:
  - { options: ["threshold", "stock", "limit"], answer: "threshold" }
explain: |
  A keyword argument uses the parameter's own name, `threshold`. Passing by name makes the call readable without looking up the definition, and it keeps working if someone later adds another parameter in the middle.
```

---

```exercise predict
id: structure-01-predict-defaults
code: |
  def scene_name(room, index, prefix="sim"):
      return f"{prefix}_{room}_{index:03d}"

  print(scene_name("kitchen", 7))
  print(scene_name("warehouse", 12, prefix="robot"))
  print(scene_name(index=3, room="lab"))
output: |
  sim_kitchen_007
  robot_warehouse_012
  sim_lab_003
explain: |
  `{index:03d}` pads the number to three digits with zeros. The second call replaces the default prefix. The third passes everything by name, so the order no longer matters.
```
