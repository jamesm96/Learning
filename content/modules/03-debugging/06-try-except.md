---
id: debugging-06
title: try / except, used honestly
minutes: 8
recap: |
  A `try` / `except` should catch one named error you expect, do something sensible with it, and let every other failure stop the program. `except Exception: pass` hides real bugs, so a batch that keeps going should record which item failed and why, and report it at the end.
---

`try` runs code that might fail. `except` says what to do for one specific kind of failure.

Anything else that goes wrong is not caught, and stops the program as usual. That is a feature.

---

Predict all three lines.

```exercise predict
id: debugging-06-predict-budget
code: |
  def tri_budget(settings):
      try:
          return int(settings["budget"])
      except KeyError:
          print("No budget set, using 9000")
          return 9000

  print(tri_budget({"budget": "12000"}))
  print(tri_budget({}))
output: |
  12000
  No budget set, using 9000
  9000
explain: |
  The first call finds the key and converts `"12000"` to a number. The second has no `"budget"` key, so `settings["budget"]` raises `KeyError`, and the `except` block prints its message and returns the fallback.
hint: 'Try adding `print(tri_budget({"budget": "lots"}))`.'
```

---

Now with a nonsense budget.

```exercise traceback
id: debugging-06-not-caught
code: |
  def tri_budget(settings):
      try:
          return int(settings["budget"])
      except KeyError:
          print("No budget set, using 9000")
          return 9000

  print(tri_budget({"budget": "lots"}))
question: Why did the `except` not catch this?
options:
  - { id: different, text: "The failure is a ValueError, and the code only handles KeyError" }
  - { id: outside, text: "The failing line is outside the try block" }
  - { id: broken, text: "try/except does not work inside functions" }
answer: different
explain: |
  The key exists, so there is no `KeyError`. `int("lots")` raises `ValueError` instead, which this handler does not mention, so it passes straight through.

  That is correct behaviour. The code only promised to handle a missing budget. A nonsense budget is a different problem and should stop the program with a clear message.
```

---

## The pattern to distrust on sight

```python
try:
    export(asset)
except Exception:
    pass
```

This catches every possible failure and does nothing. The export fails and nobody is told. It makes errors disappear from the screen while the tool stays broken.

Generated code reaches for this when asked to "make it more robust". A good handler names the specific error, does something sensible, and tells someone.

---

A broad `except` can also hide a plain bug in your own code.

```exercise fix
id: debugging-06-swallowed
symptom: "Every product in the catalogue comes out with a price of 0.0. No error appears."
code: |
  def parse_price(row):
      try:
          return float(row["prise"].lstrip("£"))
      except Exception:
          return 0.0

  row = {"sku": "LAMP-01", "price": "£39.00"}
  print(parse_price(row))
check: |
  assert parse_price(row) == 39.0, f"parse_price returned {parse_price(row)}; LAMP-01 costs 39.0."
solution: |
  def parse_price(row):
      try:
          return float(row["price"].lstrip("£"))
      except ValueError:
          return 0.0

  row = {"sku": "LAMP-01", "price": "£39.00"}
  print(parse_price(row))
cause:
  options:
    - { id: typo-hidden, text: 'The key is misspelt "prise", and `except Exception` hides the KeyError' }
    - { id: pound, text: "`lstrip` cannot remove the £ sign" }
    - { id: float, text: '`float` cannot read "39.00"' }
  answer: typo-hidden
explain: |
  Delete the `try` and run it, and Python says `KeyError: 'prise'` straight away. The broad `except` turned a typo into a silent wrong price for every product.

  Narrowing it to `except ValueError` keeps the intended fallback for unreadable prices, and lets real bugs through. Whether 0.0 is a sensible price for an unreadable row is a separate question worth asking.
```

---

```exercise choice
id: debugging-06-honest-batch
question: A batch tool should keep going when one asset fails. Which is the honest version?
options:
  - { id: pass, text: "Catch everything and `pass`" }
  - { id: record, text: "Catch the failure, record the asset name and error, continue, and print a summary of failures at the end" }
  - { id: stop, text: "Remove the try/except so the batch stops at the first failure" }
answer: record
explain: |
  Continuing is fine. Continuing silently is the problem.

  Stopping at the first failure is also a legitimate design, and far better than hiding failures. Which you choose depends on the tool; what matters is that every failure is reported.
```

---

`except KeyError as e:` gives the error a name, `e`, so you can record it.

```exercise edit
id: debugging-06-record-failures
goal: 'Instead of `pass`, add each failure to `failed` as a pair: the asset name and the error. Then print how many failed.'
code: |
  assets = [
      {"name": "rock_01", "tris": 4820},
      {"name": "tree_02"},
      {"name": "bush_01", "tris": 900},
  ]
  done = []
  failed = []
  for a in assets:
      try:
          done.append((a["name"], a["tris"]))
      except KeyError:
          pass
  print(len(done), "exported")
check: |
  assert len(done) == 2, "rock_01 and bush_01 should still be exported."
  assert len(failed) == 1, f"failed should hold one entry, not {len(failed)}."
  assert failed[0][0] == "tree_02", "The failure should record the name tree_02."
  assert isinstance(failed[0][1], KeyError), "The failure should record the KeyError itself."
solution: |
  assets = [
      {"name": "rock_01", "tris": 4820},
      {"name": "tree_02"},
      {"name": "bush_01", "tris": 900},
  ]
  done = []
  failed = []
  for a in assets:
      try:
          done.append((a["name"], a["tris"]))
      except KeyError as e:
          failed.append((a["name"], e))
  print(len(done), "exported")
  print(len(failed), "failed:", failed)
explain: |
  The batch still finishes, and now the summary says `1 failed: [('tree_02', KeyError('tris'))]`. Which asset, and why, in one line. That is the difference between a robust tool and one that hides its failures.
```
