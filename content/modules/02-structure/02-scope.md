---
id: structure-02
title: Scope, and why hidden state causes trouble
minutes: 8
recap: |
  Names made inside a function are local to it, so it cannot disturb the rest of the program, and its own names vanish when it ends. Functions that use only their inputs are easy to test, and a changeable default like `[]` is shared by every call, so use `None` and build a fresh list inside.
---

Names created inside a function exist only inside it. That region is the function's scope.

Predict both lines.

```exercise predict
id: structure-02-predict-scope
code: |
  count = 0

  def add_one():
      count = 10
      return count + 1

  print(add_one())
  print(count)
output: |
  11
  0
explain: |
  The `count` inside the function is a different name from the one outside. Assigning to it created a new local name. This is a feature: a function cannot accidentally disturb the rest of the program.
```

---

It works the other way too. A name made inside a function is gone once the function finishes.

```exercise traceback
id: structure-02-traceback-local
code: |
  def load_scene():
      objects = ["table", "mug", "shelf"]
      return len(objects)

  count = load_scene()
  print(count)
  print(objects)
question: Why does the last line fail?
options:
  - { id: local, text: "`objects` only existed inside `load_scene`" }
  - { id: order, text: "`load_scene` ran after the `print`" }
  - { id: typo, text: "The list was spelt differently" }
answer: local
explain: |
  `count` printed fine because the function returned a value. `objects` was a local name and disappeared when the function ended. If the caller needs the list, the function should return it.
```

---

## Pure functions and side effects

A function that only uses its inputs and only produces its return value is called **pure**. You can test it in isolation and trust it anywhere.

Functions that write files, change the scene or call a server have **side effects**.

Good tools keep most logic pure and push the side effects to a few obvious places at the edges.

---

```exercise choice
id: structure-02-which-pure
question: Which of these functions is pure?
options:
  - { id: mean, text: "`mean(readings)` returns the average of a list of numbers" }
  - { id: save, text: "`save_report(lines)` writes the lines to a file" }
  - { id: move, text: "`place_robot(scene)` moves the robot in the open scene" }
  - { id: log, text: "`check(asset)` appends to a global `problems` list" }
answer: mean
explain: |
  `mean` reads only its input and changes nothing outside itself, so the same list always gives the same answer. The others write a file, change a scene or change a shared list. Those effects are needed somewhere, but they make a function harder to test.
```

---

## A well-known trap

This breaks the rule by accident. Predict the second line.

```exercise predict
id: structure-02-predict-default-list
code: |
  def tag(asset, tags=[]):
      tags.append(asset)
      return tags

  print(tag("rock"))
  print(tag("tree"))
output: |
  ['rock']
  ['rock', 'tree']
explain: |
  The default list is created once, when the function is defined, and shared by every call. It is the "two names, one list" trap from Module 1 again.
```

---

## The standard fix

Use `None` as the default and make a new list inside the function, so each call gets its own.

```python
def tag(asset, tags=None):
    if tags is None:
        tags = []
    tags.append(asset)
    return tags
```

The same applies to a default `{}`. Numbers, strings and `None` are safe defaults, because they cannot be changed in place.

---

Rebuild the fixed version from memory. Watch the indent of the `append` line.

```exercise parsons
id: structure-02-parsons-none-default
prompt: Order the lines so that each call to `tag` without a list gets a fresh one, and a list passed in is added to.
code: |
  def tag(asset, tags=None):
      if tags is None:
          tags = []
      tags.append(asset)
      return tags
check: |
  assert tag("rock") == ["rock"], "the first call with no list should return ['rock']"
  assert tag("tree") == ["tree"], "a second call with no list should get its own fresh list"
  assert tag("tree", ["rock"]) == ["rock", "tree"], "a list passed in should have the asset added to it"
explain: |
  Only `tags = []` belongs inside the `if`. If `append` were indented under it too, a list passed in by the caller would come back unchanged. The new list is made during the call, so no two calls share it.
```

---

```exercise fix
id: structure-02-fix-default
symptom: Each training scene should start empty, but the second scene also contains the first scene's objects.
code: |
  def build_scene(objects, scene=[]):
      for obj in objects:
          scene.append(obj)
      return scene

  kitchen = build_scene(["table", "mug"])
  garage = build_scene(["car", "toolbox"])
check: |
  assert kitchen == ["table", "mug"], "the kitchen scene should hold only the kitchen objects"
  assert garage == ["car", "toolbox"], "the garage scene should hold only the garage objects"
solution: |
  def build_scene(objects, scene=None):
      if scene is None:
          scene = []
      for obj in objects:
          scene.append(obj)
      return scene

  kitchen = build_scene(["table", "mug"])
  garage = build_scene(["car", "toolbox"])
cause:
  options:
    - { id: shared, text: "The default list is made once and shared by every call" }
    - { id: loop, text: "The loop runs twice for each object" }
    - { id: return, text: "`return` sends back a copy of the list" }
  answer: shared
explain: |
  Both calls used the one default list, so `kitchen` and `garage` were the same list. With `None` as the default, each call that leaves `scene` out builds a fresh one.
```

---

```exercise choice
id: structure-02-hidden-global
tag: Judgement call
question: Why is this harder to trust than passing `budget` in as a parameter?
code: |
  budget = 9000

  def over(asset):
      return asset["tris"] > budget
options:
  - { id: hidden, text: "Its answer depends on a value that any other code can change" }
  - { id: slow, text: "Reading a global name is slow" }
  - { id: error, text: "It raises an error, because functions cannot read outside names" }
answer: hidden
explain: |
  Functions can read outside names, and this works. But the result now depends on hidden state: if anything sets `budget` elsewhere, `over` quietly changes behaviour. `def over(asset, budget=9000)` puts everything it needs in plain sight.
```
