---
id: debugging-05
title: Tools for looking inside
minutes: 8
recap: |
  A labelled print such as `print(f"{price=}")` shows a value the way Python writes it, so text keeps its quotes, and logging gives each message a level so it can stay in the code. A debugger pauses on a breakpoint so you can see every variable, then step over or into each line.
---

## Print, with labels

```python
print(f"{asset=}")   # shows: asset={'name': 'rock_01', ...}
print(type(value), len(items))
```

The `=` inside the braces prints the name with the value. It is quick and it is fine. Remove the prints when you are done.

---

```exercise predict
id: debugging-05-predict-labels
code: |
  price = "39.00"
  sizes = [512, 1024, 2048]
  print(f"{price=}")
  print(f"{sizes=}")
  print(type(price), len(sizes))
output: |
  price='39.00'
  sizes=[512, 1024, 2048]
  <class 'str'> 3
explain: |
  The `=` form shows the value as Python would write it, so a string keeps its quotes. That is the useful part: `price='39.00'` tells you at a glance that the price is text, not a number. A plain `print(price)` would show `39.00` and hide it.
```

---

A labelled print is often enough to find a bug. Run this, read the print, then fix it.

```exercise fix
id: debugging-05-seed-zero
symptom: "The workflow asks for seed 0, but the image is generated with seed 42."
code: |
  def pick_seed(settings):
      seed = settings.get("seed")
      print(f"{seed=}")
      if not seed:
          seed = 42
      return seed

  print(pick_seed({"seed": 0}))
check: |
  assert pick_seed({"seed": 0}) == 0, "A seed of 0 was given, so it should be used."
  assert pick_seed({"seed": 7}) == 7, "A seed of 7 was given, so it should be used."
  assert pick_seed({}) == 42, "With no seed given, the default 42 should be used."
solution: |
  def pick_seed(settings):
      seed = settings.get("seed")
      print(f"{seed=}")
      if seed is None:
          seed = 42
      return seed

  print(pick_seed({"seed": 0}))
cause:
  options:
    - { id: falsy, text: "`if not seed` treats 0 as missing, because 0 counts as false" }
    - { id: get, text: '`.get("seed")` does not find the key' }
    - { id: return, text: "The function returns before using the seed" }
  answer: falsy
explain: |
  The print shows `seed=0`, so the value arrived. Then `not 0` is true, and the default replaced it. `if seed is None:` only fires when no seed was given. Here `.get()` is the right choice: a missing seed is normal, and `None` marks it.
```

---

## Logging, for tools other people run

```python
import logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("exporter")

log.info("Exporting %s", asset["name"])
log.warning("No LODs found for %s", asset["name"])
log.error("Export failed for %s", asset["name"])
```

Logging gives messages a level, so you can leave them in and choose how much to see. When a colleague reports a problem, the log is your evidence.

---

The level you set is the lowest one shown.

```exercise predict
id: debugging-05-predict-levels
code: |
  import logging
  logging.basicConfig(level=logging.WARNING, force=True)
  log = logging.getLogger("exporter")

  for name, lods in [("rock_01", 3), ("tree_02", 0)]:
      log.info("Exporting %s", name)
      if lods == 0:
          log.warning("No LODs found for %s", name)
  log.error("Export failed for %s", "bush_01")
output: |
  WARNING:exporter:No LODs found for tree_02
  ERROR:exporter:Export failed for bush_01
explain: |
  The order of levels is DEBUG, INFO, WARNING, ERROR, CRITICAL. With the level set to WARNING, the two INFO messages are dropped. The default format is level, logger name, message.

  Set the level to INFO when you are investigating and you get every line, with no code removed. `force=True` is only here because this app reuses one Python session; a normal script leaves it out.
```

---

```exercise choice
id: debugging-05-why-logging
question: A batch tool your team runs overnight prints its progress. Why switch it to logging?
options:
  - { id: levels, text: "Messages get a level, so you can keep them in the code and choose how much to see" }
  - { id: faster, text: "Logging makes the tool run faster" }
  - { id: fixes, text: "Logging catches errors so the tool does not stop" }
answer: levels
explain: |
  Logging records what happened, it does not change what happens. Its value is control: quiet by default, detailed when you need it, and often written to a file you can ask a colleague for.
```

---

## The debugger

A debugger pauses the program on a line you choose and lets you look at every variable at that moment.

In VS Code: click left of a line number to set a breakpoint, press F5, and the program stops there. Then:

- **Step over** runs the current line and stops on the next.
- **Step into** goes inside the function being called on this line.
- **Variables** shows everything in scope. **Watch** tracks an expression as you step.

One hour learning this replaces many hours of adding prints. Blender scripts can be attached to the VS Code debugger too; ask Claude to walk you through setting up `debugpy` with Blender when you get there.

---

```exercise choice
id: debugging-05-step-into
question: 'The program is paused on `path = build_path(asset)`. You want to see what happens inside `build_path`. Which do you press?'
options:
  - { id: into, text: "Step into" }
  - { id: over, text: "Step over" }
  - { id: continue, text: "Continue (F5)" }
answer: into
explain: |
  Step into enters the function called on this line and stops at its first line. Step over would run all of `build_path` and stop on the next line of the current function, which is what you want when you trust the function.
```
