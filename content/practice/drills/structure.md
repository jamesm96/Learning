---
id: drills-structure
title: Structure
minutes: 5
---

```exercise predict
id: drills-structure-predict-print-return
code: |
  def label(sku, price):
      print(f"{sku} £{price:.2f}")

  result = label("RUG-07", 89.5)
  print(result)
output: |
  RUG-07 £89.50
  None
explain: |
  `label` prints, but it has no `return`, so calling it gives back `None`. The first line comes from inside the function; the second is the value stored in `result`. Printing shows a value to a person; returning hands it to the code that called.
```

---

```exercise predict
id: drills-structure-predict-early-return
code: |
  def first_heavy(assets, budget):
      for name, tris in assets:
          if tris > budget:
              return name
      return "none"

  scene = [("rock", 4820), ("crane", 18250), ("boat", 9100)]
  print(first_heavy(scene, 9000))
  print(first_heavy(scene, 20000))
output: |
  crane
  none
explain: |
  `return` ends the function at once, so the loop never looks at the boat once the crane is found. The final `return "none"` only runs when the loop finishes without finding anything.
```

---

```exercise predict
id: drills-structure-predict-scope-shadow
code: |
  speed = 1.0

  def boost(speed):
      speed = speed * 2
      return speed

  print(boost(3.0))
  print(speed)
output: |
  6.0
  1.0
explain: |
  The parameter `speed` is a new local name inside `boost`. Changing it does not touch the `speed` outside. The function receives its input as an argument and hands its result back, so the outer value is safe.
```

---

```exercise predict
id: drills-structure-predict-mutable-default
code: |
  def log_event(event, history=[]):
      history.append(event)
      return history

  print(log_event("grasp"))
  print(log_event("lift"))
output: |
  ['grasp']
  ['grasp', 'lift']
explain: |
  The default list is made once, when the function is defined, and every call without a `history` shares it. So the second episode remembers the first. The fix is `history=None`, then `if history is None: history = []` inside.
```

---

```exercise predict
id: drills-structure-predict-dataclass
code: |
  from dataclasses import dataclass

  @dataclass
  class Product:
      sku: str
      price: float
      stock: int = 0

  lamp = Product("LAMP-01", 39.0)
  print(lamp)
  print(lamp.stock > 0)
output: |
  Product(sku='LAMP-01', price=39.0, stock=0)
  False
explain: |
  `@dataclass` writes `__init__` and a readable printout from the annotated fields. `stock` has a default, so the call can leave it out. The type hints describe the fields; they are not checked when the object is made.
```

---

```exercise predict
id: drills-structure-predict-hints-ignored
code: |
  def scale(value: float, factor: float) -> float:
      return value * factor

  print(scale(2.0, 1.5))
  print(scale("ab", 3))
output: |
  3.0
  ababab
explain: |
  Python does not enforce type hints when the code runs. Passing a string still works, because `*` on a string repeats it. Hints are for people and for checking tools such as mypy, which would flag the second call.
```

---

```exercise predict
id: drills-structure-predict-self-state
code: |
  class Battery:
      def __init__(self, level):
          self.level = level

      def drain(self, amount):
          self.level -= amount

  a = Battery(80)
  b = Battery(80)
  a.drain(30)
  print(a.level, b.level)
output: |
  50 80
explain: |
  Each object keeps its own `level` on `self`. Draining `a` changes only `a`. That is the main reason to use a class: data and the methods that change it travel together, one copy per thing.
```

---

```exercise parsons
id: drills-structure-parsons-mean-temp
prompt: Build `mean_temp`, which returns the average of a list of readings, or `None` when the list is empty.
code: |
  def mean_temp(readings):
      if not readings:
          return None
      total = sum(readings)
      return total / len(readings)
check: |
  assert mean_temp([20.0, 22.0]) == 21.0, "the mean of 20.0 and 22.0 is 21.0"
  assert mean_temp([]) is None, "an empty list should give None, not an error"
explain: |
  The empty check comes first, so the division never sees a length of 0. `return None` sits inside the `if`; the sum and the division sit at the function's own level, so they run for every non-empty list.
```

---

```exercise parsons
id: drills-structure-parsons-dataclass-pose
prompt: Build a `Pose` dataclass with `x` and `y`, and a method `moved` that returns a new pose shifted by `dx`.
code: |
  from dataclasses import dataclass

  @dataclass
  class Pose:
      x: float
      y: float

      def moved(self, dx):
          return Pose(self.x + dx, self.y)
check: |
  p = Pose(1.0, 2.0)
  q = p.moved(0.5)
  assert q == Pose(1.5, 2.0), "moved(0.5) should return Pose(1.5, 2.0)"
  assert p == Pose(1.0, 2.0), "the original pose should not change"
explain: |
  The decorator sits directly above `class`. Fields and the method are one level in, and the method body one level further. `moved` returns a new pose instead of changing `self`, so the original stays as it was.
```

---

```exercise parsons
id: drills-structure-parsons-main-guard
prompt: Order the module so `report` can be imported without printing anything, and running the file directly prints the report.
code: |
  def report(names):
      return ", ".join(sorted(names))

  def main():
      print(report(["rock_01", "boat_01"]))

  if __name__ == "__main__":
      main()
check: |
  assert report(["b", "a"]) == "a, b", "report should sort the names and join them with a comma"
  assert callable(main), "main should be a function"
explain: |
  Both functions are defined before the guard runs `main()`. `__name__` is `"__main__"` only when the file is run directly; when another script imports it, the guard is skipped and nothing prints.
```

---

```exercise choice
id: drills-structure-choice-pure
question: Which function is pure?
options:
  - { id: pure, text: "`def tax(price): return round(price * 1.2, 2)`" }
  - { id: prints, text: "`def tax(price): print(price * 1.2)`" }
  - { id: global, text: "`def tax(price): return price * RATE` where `RATE` is changed elsewhere" }
  - { id: mutates, text: "`def tax(item): item['price'] *= 1.2`" }
answer: pure
explain: |
  A pure function depends only on its arguments and only produces its return value. Printing is a side effect, a changing global makes the answer depend on hidden state, and changing the dict passed in alters the caller's data.
```

---

```exercise choice
id: drills-structure-choice-name-guard
question: '`tools.py` ends with `if __name__ == "__main__": main()`. Another script runs `import tools`. What happens?'
options:
  - { id: skipped, text: "The functions are defined and `main()` does not run" }
  - { id: runs, text: "`main()` runs once, during the import" }
  - { id: error, text: "The import fails because `__name__` is not defined" }
answer: skipped
explain: |
  When a file is imported, its `__name__` is the module name, `"tools"`. Only when you run the file directly is it `"__main__"`. The guard lets one file be both a library and a script.
```

---

```exercise choice
id: drills-structure-choice-optional-hint
question: 'What does `def find_camera(scene: dict) -> Camera | None:` tell you?'
options:
  - { id: maybe-none, text: "It may return `None`, so the caller must check before using the result" }
  - { id: always, text: "It always returns a `Camera`" }
  - { id: enforced, text: "Python will raise an error if it returns anything else" }
answer: maybe-none
explain: |
  `Camera | None` says the function can return either. Code that does `find_camera(scene).fov` without checking will fail with `AttributeError` on a scene with no camera. Python does not enforce the hint; it is a promise to read.
```

---

```exercise cloze
id: drills-structure-cloze-none-default
prompt: Give each call its own fresh list when no list is passed in.
code: |
  def collect(item, bucket=___):
      if bucket ___ None:
          bucket = []
      bucket.append(item)
      return bucket
blanks:
  - { options: ["None", "[]", "list"], answer: "None" }
  - { options: ["is", "==", "in"], answer: "is" }
explain: |
  A default of `[]` would be made once and shared by every call. `None` is a safe marker, and `is None` is the standard test for it. The new list is then made inside the call, so each call gets its own.
```

---

```exercise cloze
id: drills-structure-cloze-return-hint
prompt: Complete the hints for a function that takes a list of prices and gives back their total.
code: |
  def basket_total(prices: list[float]) -> ___:
      return sum(prices)
blanks:
  - { options: ["float", "list[float]", "None", "str"], answer: "float" }
explain: |
  The part after `->` describes what the function returns. Adding up a list of floats gives one float, not a list. `None` would mean the function returns nothing useful.
```

---

```exercise edit
id: drills-structure-edit-return-not-print
goal: '`over_budget` should **return** the list of names, not print it. Change it so `heavy` holds `["crane_02"]`.'
code: |
  def over_budget(assets, budget):
      names = [a["name"] for a in assets if a["tris"] > budget]
      print(names)

  scene = [{"name": "rock_01", "tris": 4820},
           {"name": "crane_02", "tris": 18250}]
  heavy = over_budget(scene, 9000)
check: |
  assert heavy == ["crane_02"], "over_budget should return the list, so heavy holds ['crane_02']"
solution: |
  def over_budget(assets, budget):
      names = [a["name"] for a in assets if a["tris"] > budget]
      return names

  scene = [{"name": "rock_01", "tris": 4820},
           {"name": "crane_02", "tris": 18250}]
  heavy = over_budget(scene, 9000)
explain: |
  A printed list is gone once it is on the screen; the caller receives `None`. Returning it lets other code filter it, save it or test it. Print at the edges of a program, return everywhere else.
```

---

```exercise edit
id: drills-structure-edit-pure-discount
goal: '`discounted` changes the product passed in. Make it return a new dict instead, leaving `lamp` at 39.0.'
code: |
  def discounted(product, percent):
      product["price"] = product["price"] * (1 - percent / 100)
      return product

  lamp = {"sku": "LAMP-01", "price": 39.0}
  sale = discounted(lamp, 10)
check: |
  assert lamp["price"] == 39.0, "the original lamp should still cost 39.0"
  assert round(sale["price"], 2) == 35.1, "the sale copy should cost 35.10"
  assert sale["sku"] == "LAMP-01", "the copy should keep the SKU"
solution: |
  def discounted(product, percent):
      new = dict(product)
      new["price"] = product["price"] * (1 - percent / 100)
      return new

  lamp = {"sku": "LAMP-01", "price": 39.0}
  sale = discounted(lamp, 10)
explain: |
  A dict passed into a function is the caller's dict, not a copy, so changing it changes the catalogue. Copying first with `dict(product)` keeps the function pure: same input, same output, nothing else touched.
```
