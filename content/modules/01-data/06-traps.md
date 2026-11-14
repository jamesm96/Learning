---
id: data-06
title: Three traps worth knowing early
minutes: 8
---

## Trap 1: two names, one list

Assigning a list to a second name does not copy it. Both names point at the same list.

---

Predict all three lines first.

```exercise predict
id: data-06-predict-alias
code: |
  a = ["moss", "stone"]
  b = a
  b.append("lichen")
  print(a)

  c = a.copy()
  c.append("sand")
  print(a)
  print(c)
output: |
  ['moss', 'stone', 'lichen']
  ['moss', 'stone', 'lichen']
  ['moss', 'stone', 'lichen', 'sand']
explain: |
  `b` was the same list as `a`, so appending through `b` changed `a`. `.copy()` made a separate list.

  Lists and dictionaries behave this way. Strings and numbers cannot be changed in place, so they never surprise you like this.
```

---

```exercise choice
id: data-06-function-mutates
question: What does the last line print?
code: |
  def add_lod(names):
      names.append("lod1")
      return names

  mine = ["base"]
  result = add_lod(mine)
  print(mine)
options:
  - { id: changed, text: "`['base', 'lod1']`" }
  - { id: unchanged, text: "`['base']`" }
  - { id: none, text: "`None`" }
answer: changed
explain: |
  Inside the function, `names` is the same list as `mine`, so the append changes it. When a function quietly alters a list you handed it, this is why. If that is not intended, the function should work on a copy.
```

---

## Trap 2: empty counts as false

In an `if`, these are treated as false: `0`, `""`, `[]`, `{}`, `None`.

So `if not assets:` means "if the list is empty or missing". To test specifically for nothing, write `if x is None:`, because a triangle count of 0 is also false and may be a perfectly valid value.

---

```exercise predict
id: data-06-predict-truthy
code: |
  for value in [0, "", [], None, "0", [0]]:
      print(repr(value), bool(value))
output: |
  0 False
  '' False
  [] False
  None False
  '0' True
  [0] True
explain: |
  `bool()` shows how `if` would treat a value. `repr()` prints it with quotes, so you can see which are strings. `"0"` is a non-empty string and `[0]` is a list with one item, so both count as true.
```

---

```exercise choice
id: data-06-is-none
question: '`lod = 0`. Which test correctly tells "no LOD value was given" apart from "LOD is zero"?'
options:
  - { id: is-none, text: "`if lod is None:`" }
  - { id: not, text: "`if not lod:`" }
  - { id: equals-false, text: "`if lod == False:`" }
answer: is-none
explain: |
  `not lod` is true for 0 as well as `None`, so LOD 0 would be treated as missing. This exact mistake appears in generated code often, usually around numbers and empty strings.
```

---

```exercise cloze
id: data-06-cloze-is-none
prompt: Only use the default when no value was given. A price of 0 is valid.
code: |
  if price ___ None:
      price = default_price
blanks:
  - { options: ["is", "=", "in"], answer: "is" }
explain: |
  `is None` is true only for `None`, so a price of 0 is kept. A single `=` assigns rather than compares, and would be a `SyntaxError` here.
```

---

## Trap 3: two cousins of the list

A tuple, `(1.0, 2.0, 0.5)`, is a list that cannot be changed. It is used for fixed groups like a position.

A set, `{"moss", "stone"}`, holds unique items with no order. It is used to remove duplicates or compare groups.

Recognise them when you see them.

---

```exercise choice
id: data-06-set-duplicates
question: '`materials = ["moss", "stone", "moss", "metal", "stone"]`. What is `len(set(materials))`?'
options:
  - { id: three, text: "3" }
  - { id: five, text: "5" }
  - { id: two, text: "2" }
answer: three
explain: |
  A set keeps each item once, so the duplicates drop out, leaving moss, stone and metal. `len(set(x))` is a quick way to count distinct values.
```
