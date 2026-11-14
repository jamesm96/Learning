---
id: debugging-04
title: The method
minutes: 8
recap: |
  Debugging is a method: reproduce the bug with the smallest input, read the message, narrow it down by checking the data at a midpoint, and state a guess you can test. Change one thing per run, fix the cause rather than the symptom, then confirm with the failing case and one that used to work.
---

## Six steps, in order

1. **Reproduce it.** Make it fail on demand, with the smallest input you can. A bug you cannot trigger you cannot confirm fixed.
2. **Read what it says.** The whole message, slowly. It usually names the problem.
3. **Narrow it.** Halve the search space: does the data look right at the midpoint? If yes, the problem is after it. Repeat.

---

4. **State a guess you can test.** "I think `asset` is None here because the lookup failed."
5. **Test one thing.** One change, one run. Several changes at once tell you nothing.
6. **Fix the cause, then confirm.** Run the failing case again, and one case that used to work.

If you are stuck, explain the problem aloud from the start, line by line, to anyone or to nobody. You will often hear the mistake as you say it.

---

```exercise choice
id: debugging-04-one-of-200
tag: Judgement call
question: An export works for 199 assets and fails on one. What is the best first move?
options:
  - { id: isolate, text: "Run the export on only that asset and compare its data with a working one" }
  - { id: robust, text: "Ask Claude to make the exporter more robust" }
  - { id: try, text: "Wrap the export in try/except so the batch finishes" }
answer: isolate
explain: |
  Isolate and compare. The difference between a working case and a failing one is the fastest route to a cause. The other two options change code before anyone knows what is wrong.
```

---

Reproducing sometimes means running the same thing twice. This bug only shows on the second call.

```exercise fix
id: debugging-04-mutable-default
symptom: "The second scene comes out with two `synthetic` tags. Each scene should have one."
code: |
  def tag_scene(name, tags=[]):
      tags.append("synthetic")
      return {"name": name, "tags": tags}

  a = tag_scene("warehouse_01")
  b = tag_scene("warehouse_02")
  print(b["tags"])
check: |
  assert a["tags"] == ["synthetic"], f"Scene a has tags {a['tags']}."
  assert b["tags"] == ["synthetic"], f"Scene b has tags {b['tags']}; it should be ['synthetic']."
  assert tag_scene("x", ["real"])["tags"] == ["real", "synthetic"], "Tags passed in should be kept."
solution: |
  def tag_scene(name, tags=None):
      if tags is None:
          tags = []
      tags.append("synthetic")
      return {"name": name, "tags": tags}

  a = tag_scene("warehouse_01")
  b = tag_scene("warehouse_02")
  print(b["tags"])
cause:
  options:
    - { id: shared-default, text: "The default `[]` is made once and shared by every call" }
    - { id: append, text: "`append` adds the tag twice" }
    - { id: names, text: "Both scenes have the same name" }
  answer: shared-default
explain: |
  A default value is created once, when the function is defined, not on each call. So every call that leaves out `tags` appends to the same list. Both `a` and `b` end up holding it, which is why `a` is wrong too.

  The standard fix is `tags=None` and a fresh list inside. Generated code makes this mistake often, and it only shows up from the second call onwards.
```

---

To narrow a bug, print the data at the midpoint. If it looks right there, the problem is later.

```exercise fix
id: debugging-04-narrow-units
symptom: "Sensor heights come from the logger in millimetres. The average should be about 1.2 metres; it prints 12.0."
code: |
  raw_mm = [1180, 1220, 1200]

  def to_metres(values):
      return [v / 100 for v in values]

  def average(values):
      return sum(values) / len(values)

  metres = to_metres(raw_mm)
  print(f"{metres=}")
  height = average(metres)
  print(height)
check: |
  assert abs(height - 1.2) < 1e-9, f"height is {height}; it should be 1.2 metres."
solution: |
  raw_mm = [1180, 1220, 1200]

  def to_metres(values):
      return [v / 1000 for v in values]

  def average(values):
      return sum(values) / len(values)

  metres = to_metres(raw_mm)
  print(f"{metres=}")
  height = average(metres)
  print(height)
cause:
  options:
    - { id: conversion, text: "`to_metres` divides by 100, which gives centimetres-sized numbers" }
    - { id: average, text: "`average` divides by the wrong count" }
    - { id: data, text: "The raw readings are wrong" }
  answer: conversion
explain: |
  The midpoint print shows `metres=[11.8, 12.2, 12.0]`, already ten times too big before `average` runs. So the bug is in `to_metres`, and `average` can be left alone. There are 1000 millimetres in a metre.
```

---

```exercise choice
id: debugging-04-testable-guess
question: A scene import produces no objects. Which is a guess you can test?
options:
  - { id: specific, text: '"The file list is empty because the folder path is wrong"' }
  - { id: vague, text: '"Something is wrong with the importer"' }
  - { id: blame, text: '"Blender is being weird today"' }
answer: specific
explain: |
  A testable guess names a value and a reason. You can check it with one print: print the folder path and the length of the file list. The other two give you nothing to look at.
```

---

```exercise choice
id: debugging-04-one-change
tag: Judgement call
question: You changed three things at once and the bug went away. What do you know?
options:
  - { id: little, text: "Not which change fixed it, or whether the other two broke something else" }
  - { id: all, text: "All three changes were needed" }
  - { id: done, text: "The bug is understood and fixed" }
answer: little
explain: |
  Several changes at once tell you nothing about cause. Undo two, keep one, run again. Then confirm with the failing case and one case that used to work.
```
