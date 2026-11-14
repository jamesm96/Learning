---
id: structure-06
title: "Type hints and docstrings: notes that pay rent"
minutes: 7
---

```python
def over_budget(
    assets: list[dict], budget: int = 9000
) -> list[str]:
    """Return the names of assets over budget."""
    return [a["name"] for a in assets
            if a["tris"] > budget]
```

The parts after the colons and the arrow are **type hints**. `assets` should be a list of dicts, `budget` an int, and the function returns a list of strings.

---

## Python does not enforce them

Type hints tell a reader, your editor and an AI what goes in and what comes out. Editors use them to underline mistakes as you type, and AI writes better code against functions that have them.

Ask for them by default. But know that Python itself ignores them when the code runs.

---

```exercise predict
id: structure-06-predict-not-enforced
code: |
  def double(count: int) -> int:
      return count * 2

  print(double(21))
  print(double("ab"))
output: |
  42
  abab
explain: |
  The hint says `int`, but Python runs the function on a string anyway, and `*` repeats it. Hints are notes for tools and people. A checker such as an editor or `mypy` would flag the second call before it runs; Python does not.
```

---

```exercise choice
id: structure-06-read-optional
question: 'A function is declared as `def find_sensor(name: str) -> dict[str, float] | None:`. What can it hand back?'
options:
  - { id: either, text: "A dict with string keys and float values, or `None`" }
  - { id: both, text: "A dict and `None` together" }
  - { id: floats, text: "A list of floats" }
answer: either
explain: |
  `|` in a hint means "or". So the caller must handle the case where nothing was found. That one line of signature tells you to check for `None` before using the result, without reading the body.
```

---

```exercise cloze
id: structure-06-cloze-return-hint
prompt: Complete the return hint. The function gives back the average reading.
code: |
  def mean_reading(values: list[float]) -> ___:
      return sum(values) / len(values)
blanks:
  - { options: ["float", "list[float]", "None"], answer: "float" }
explain: |
  It takes a list of floats and returns one number, so `-> float`. Hints that describe a list going in and a single value coming out tell you the function's job at a glance.
```

---

## Docstrings

The text in triple quotes straight after the `def` line is a **docstring**. Editors show it when you hover over the function, and `help()` prints it.

One line saying what the function does is enough. If you cannot write that line, the function is doing too much.

---

```exercise choice
id: structure-06-docstring-too-much
tag: Judgement call
question: 'A function''s docstring reads: "Load the catalogue, fix the prices, resize the photos and upload everything." What does it tell you?'
options:
  - { id: split, text: "The function has four jobs and should be split" }
  - { id: good, text: "It is a thorough, well-documented function" }
  - { id: hints, text: "It needs type hints instead" }
answer: split
explain: |
  A docstring that needs "and" three times describes four functions. Each could be named, tested and reused on its own, and a fifth short function could call them in order.
```

---

```exercise edit
id: structure-06-edit-hints
goal: Add type hints for both parameters and the return value, and a one-line docstring.
code: |
  def scene_id(room, index):
      return f"{room}_{index:03d}"

  print(scene_id("kitchen", 7))
check: |
  hints = scene_id.__annotations__
  assert "room" in hints and "index" in hints, "both parameters, room and index, need a type hint"
  assert "return" in hints, "add a return hint with -> before the colon"
  assert scene_id.__doc__, "add a one-line docstring in triple quotes under the def line"
  assert scene_id("kitchen", 7) == "kitchen_007", "the function should still return the same name"
solution: |
  def scene_id(room: str, index: int) -> str:
      """Return a scene id such as kitchen_007."""
      return f"{room}_{index:03d}"

  print(scene_id("kitchen", 7))
explain: |
  `room` is text and `index` a whole number, and the result is text, so `(room: str, index: int) -> str`. The docstring says what comes back in one line. The behaviour did not change at all; only what a reader can learn without reading the body.
```
