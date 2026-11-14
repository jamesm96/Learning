---
id: debugging-03
title: Three bugs
minutes: 8
---

Three short bugs, each a different kind. For each one: read what Python tells you, name the cause, then fix it.

The first two fail loudly. The third does not fail at all, which makes it the worst of the three.

---

## Bug A

```exercise traceback
id: debugging-03-bug-a
code: |
  assets = ["rock_01", "tree_02", "bush_01"]
  for i in range(4):
      print(assets[i])
options:
  - { id: range, text: "`range(4)` asks for one index more than the list has" }
  - { id: name, text: "One of the asset names is invalid" }
  - { id: start, text: "Lists start at 1, so index 0 is wrong" }
answer: range
explain: |
  `IndexError`. The list has three items, at indexes 0 to 2, and `range(4)` asks for index 3. The three names printed before it failed, which is a clue: the problem is at the end.
```

---

## The better fix

Changing `range(4)` to `range(3)` works until someone adds a fourth asset. The better fix removes the index entirely, so the mistake cannot happen:

```python
for a in assets:
    print(a)
```

Off-by-one errors are common in generated code. When you see `range(len(...))`, or a number typed into a `range`, ask whether a plain `for` loop would do.

---

## Bug B

```exercise traceback
id: debugging-03-bug-b
code: |
  def find(assets, name):
      for a in assets:
          if a["name"] == name:
              return a

  assets = [{"name": "rock_01", "tris": 4820}]
  hit = find(assets, "rock_1")
  print(hit["tris"])
options:
  - { id: none, text: '"rock_1" matches nothing, so `find` returns None' }
  - { id: last-line, text: "The last line uses the wrong key" }
  - { id: dict, text: "Assets cannot be stored as dictionaries in a list" }
answer: none
explain: |
  A `TypeError` on the last line: a `NoneType` object is not subscriptable, meaning `None` cannot be read with square brackets. The last line is fine. The cause is one line up: `"rock_1"` matches nothing, so `find` falls off the end of its loop.

  A function that reaches its end without a `return` gives back `None`. Nothing warned anyone.
```

---

Fixing the typo makes it run. The real improvement is to decide what `find` should do when nothing matches, and make that loud.

```exercise edit
id: debugging-03-loud-find
goal: Make `find` raise a `ValueError` that names the missing asset when nothing matches.
code: |
  def find(assets, name):
      for a in assets:
          if a["name"] == name:
              return a

  assets = [{"name": "rock_01", "tris": 4820}]
  print(find(assets, "rock_01")["tris"])
check: |
  assert find(assets, "rock_01")["tris"] == 4820, "find should still return a matching asset."
  try:
      find(assets, "rock_1")
  except ValueError as e:
      assert "rock_1" in str(e), "The error message should include the name that was not found."
  else:
      raise AssertionError("find(assets, 'rock_1') should raise a ValueError, not return None.")
solution: |
  def find(assets, name):
      for a in assets:
          if a["name"] == name:
              return a
      raise ValueError(f"No asset named {name!r}")

  assets = [{"name": "rock_01", "tris": 4820}]
  print(find(assets, "rock_01")["tris"])
explain: |
  The `raise` goes after the loop, at the same indent as `for`, so it only runs when no asset matched. Now the error names the actual problem, at the place it happened: `ValueError: No asset named 'rock_1'`.

  `{name!r}` puts quotes around the name, so a stray space or an empty string is visible in the message.
```

---

## Bug C

```exercise fix
id: debugging-03-bug-c
symptom: 'It prints `Total: 9100`. The three counts add up to 32170.'
code: |
  tris = [4820, 18250, 9100]
  total = 0
  for t in tris:
      total = t
  print("Total:", total)
check: |
  assert total == 32170, f"total is {total}, but 4820 + 18250 + 9100 is 32170."
solution: |
  tris = [4820, 18250, 9100]
  total = 0
  for t in tris:
      total += t
  print("Total:", total)
cause:
  options:
    - { id: replaces, text: "`total = t` replaces the total each time instead of adding to it" }
    - { id: start, text: "`total` should start at the first item" }
    - { id: loop, text: "The loop skips the first two items" }
  answer: replaces
explain: |
  No error at all, and the answer is wrong. `total = t` throws away the running total on every pass, so only the last count survives. `total += t` adds to it.
```

---

## Silent wrong answers

Silent wrong answers are the most expensive bugs, because nothing tells you to look.

The defence is knowing the right answer for a small example before you run the code. That is exactly what a test is.

---

One more silent bug, of a kind AI-written code produces often: a comparison that is almost right.

```exercise fix
id: debugging-03-budget-boundary
symptom: 'The budget is "up to 5000 triangles". The 5000-triangle asset is flagged as over budget.'
code: |
  BUDGET = 5000

  def over_budget(tris):
      return tris >= BUDGET

  flagged = [t for t in [4800, 5000, 5200] if over_budget(t)]
  print(flagged)
check: |
  assert over_budget(5000) is False, "An asset with exactly 5000 triangles is within budget."
  assert over_budget(5001) is True, "An asset with 5001 triangles is over budget."
  assert flagged == [5200], f"Only 5200 should be flagged, not {flagged}."
solution: |
  BUDGET = 5000

  def over_budget(tris):
      return tris > BUDGET

  flagged = [t for t in [4800, 5000, 5200] if over_budget(t)]
  print(flagged)
cause:
  options:
    - { id: operator, text: "`>=` counts exactly 5000 as over; it should be `>`" }
    - { id: budget, text: "The budget constant is wrong" }
    - { id: list, text: "The list comprehension keeps the wrong items" }
  answer: operator
explain: |
  "Up to 5000" includes 5000, so only counts strictly greater are over. `>=` and `>` differ only at the boundary, which is why this bug survives casual testing. Test the boundary value itself.
```
