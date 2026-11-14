---
id: data-03
title: "Lists: things in order"
minutes: 7
---

A list holds items in a fixed order. Counting starts at 0.

- add an item with `.append()`
- count items with `len()`
- test membership with `in`
- walk through them with `for`

---

## Reading a list comprehension

```python
rocks = [a for a in assets if a.startswith("rock")]
```

Square brackets around a `for` make a list comprehension. Read it in three parts: take each `a` in `assets`, keep it `if` the test passes, and put `a` in the new list.

Claude writes these all the time, so being able to read one matters more than being able to write one.

---

```exercise predict
id: data-03-predict-assets
code: |
  assets = ["rock_01", "tree_02", "rock_03", "bush_01"]

  rocks = [a for a in assets if a.startswith("rock")]
  print(rocks)
  print(len(assets), assets[0], assets[-1])

  assets.append("fern_01")
  print("fern_01" in assets, len(assets))
  print(assets[1:3])
output: |
  ['rock_01', 'rock_03']
  4 rock_01 bush_01
  True 5
  ['tree_02', 'rock_03']
explain: |
  A slice `[1:3]` starts at index 1 and stops before index 3, so you get two items. Note that `len(assets)` was 4 before the append and 5 after.
hint: Try `assets[10]`.
```

---

Asking for an index that does not exist raises `IndexError`.

Slices are more forgiving: `assets[1:10]` just gives you everything from index 1 to the end, with no error.

---

```exercise choice
id: data-03-slice
question: '`frames = [10, 20, 30, 40]`. What is `frames[1:3]`?'
options:
  - { id: right, text: "`[20, 30]`" }
  - { id: inclusive, text: "`[20, 30, 40]`" }
  - { id: from-zero, text: "`[10, 20, 30]`" }
answer: right
explain: |
  Index 1 is `20`. The slice stops before index 3, so `40` is left out. "Start included, end excluded" is the rule for slices and for `range()`, and it is the source of many off-by-one bugs.
```

---

```exercise cloze
id: data-03-cloze-comprehension
prompt: Keep only the sensor readings above 50.
code: |
  readings = [21.5, 22.0, 85.2, 21.9]
  spikes = [r for r ___ readings ___ r > 50]
  print(spikes)
blanks:
  - { options: ["in", "of", "from"], answer: "in" }
  - { options: ["if", "when", "where"], answer: "if" }
explain: |
  The shape is always `[item for item in list if test]`. This prints `[85.2]`. The same line works on temperatures, frame times or prices.
```

---

```exercise choice
id: data-03-index-error
question: A list has five items. What happens with `items[5]`?
options:
  - { id: error, text: "An IndexError" }
  - { id: last, text: "You get the last item" }
  - { id: none, text: "You get `None`" }
answer: error
explain: |
  Five items have indexes 0 to 4. Index 5 does not exist, so Python stops with `IndexError: list index out of range`. Use `items[-1]` for the last item.
```

---

```exercise predict
id: data-03-predict-scenes
code: |
  scenes = ["warehouse", "kitchen"]
  scenes.append("loading_bay")
  print(len(scenes), scenes[-1])
  print("kitchen" in scenes, "garden" in scenes)
output: |
  3 loading_bay
  True False
explain: |
  `.append()` adds to the end, so the last item is now `"loading_bay"`. `in` checks for an exact match among the items. This is the same code whether the list holds game levels or the scenes a robot is trained in.
```
