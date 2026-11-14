---
id: data-02
title: "Strings: taking names apart"
minutes: 6
recap: |
  `.split()` cuts a string into a list, and indexes such as `[0]` and `[-1]` pick out the parts, which may still need `int()` before maths. String methods never change a string in place, so keep the result under a name, and check that an f-string really has its `f`.
---

Asset names, file names, product codes and prompts are all strings. Most tools spend their time splitting and rebuilding them.

The pieces to recognise:

- `.split("_")` cuts a string into a list at each `_`
- `[0]` takes the first item, `[-1]` the last
- an `f"..."` string drops values into text: `f"{prefix} asset"`

---

```exercise predict
id: data-02-predict-split
code: |
  name = "SM_Rock_Large_01"
  parts = name.split("_")
  print(parts)

  prefix = parts[0]
  index = int(parts[-1])
  print(f"{prefix} asset, variant {index + 1}")
  print(name.lower().startswith("sm_"))
output: |
  ['SM', 'Rock', 'Large', '01']
  SM asset, variant 2
  True
explain: |
  `parts[-1]` is the string `'01'`. `int()` turns it into the number 1, so adding 1 gives 2. Without `int()` you get a `TypeError`, the same one as the last lesson.
hint: Remove `int(...)` and see what breaks.
```

---

Strings never change in place. `name.lower()` returns a new string and leaves `name` as it was.

To keep the result, give it a name: `lower_name = name.lower()`.

---

```exercise choice
id: data-02-lower-in-place
question: What does this print?
code: |
  name = "SM_Rock"
  name.lower()
  print(name)
options:
  - { id: original, text: "`SM_Rock`" }
  - { id: lowered, text: "`sm_rock`" }
  - { id: none, text: "`None`" }
answer: original
explain: |
  `name.lower()` made a new string, `"sm_rock"`, and nothing kept it. `name` still points at the original. You'd need `name = name.lower()` to change what `name` refers to.
```

---

```exercise cloze
id: data-02-cloze-filename
prompt: Get the file name, `crate_01.fbx`, from the path.
code: |
  path = "assets/props/crate_01.fbx"
  parts = path.___("/")
  filename = parts[___]
blanks:
  - { options: ["split", "strip", "join"], answer: "split" }
  - { options: ["0", "1", "-1"], answer: "-1" }
explain: |
  `.split("/")` gives `['assets', 'props', 'crate_01.fbx']`, and `[-1]` takes the last item. Counting from the end with `-1` works however deep the folder is. (Module 5 shows a sturdier way to handle paths, with `pathlib`.)
```

---

The same moves work on any coded name. Here is a product code from an online shop.

```exercise predict
id: data-02-predict-sku
code: |
  sku = "CHAIR-OAK-120"
  parts = sku.split("-")
  print(len(parts))
  print(parts[1].title())
  width_cm = int(parts[-1])
  print(f"{width_cm / 100} m")
output: |
  3
  Oak
  1.2 m
explain: |
  Three parts, so `len` is 3. `.title()` capitalises the first letter of each word. `int("120")` is 120, and `/` always gives a decimal, so `120 / 100` is `1.2`.
```

---

```exercise choice
id: data-02-missing-f
question: 'What does this print? `count = 3`, then `print("{count} assets exported")`'
options:
  - { id: literal, text: "`{count} assets exported`" }
  - { id: filled, text: "`3 assets exported`" }
  - { id: error, text: "A NameError" }
answer: literal
explain: |
  Without the `f` before the opening quote, the braces are just characters. It needs to be `f"{count} assets exported"`. It is an easy slip to miss in a log message, because nothing fails.
```
