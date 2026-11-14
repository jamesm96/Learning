---
id: data-01
title: Values, names and types
minutes: 6
recap: |
  Every value has a type, such as `str`, `int`, `float`, `bool` or `None`, and the type decides what an operator does: `*` doubles a number but repeats a string. Numbers read from files arrive as text, so convert them with `int()` or `float()` before any maths.
---

A variable is a name attached to a value. Every value has a type, and the type decides what you are allowed to do with it.

The five you will see constantly:

- text: `str`
- whole numbers: `int`
- decimals: `float`
- true or false: `bool`
- "nothing here": `None`

---

Predict all three lines, especially the last two, before you reveal the output.

```exercise predict
id: data-01-predict-types
code: |
  asset = "rock_large_01"
  tri_count = 4820
  scale = 1.5
  is_exported = False
  lod_parent = None

  print(type(asset), type(tri_count), type(scale))
  print(tri_count * 2)
  print(asset * 2)
output: |
  <class 'str'> <class 'int'> <class 'float'>
  9640
  rock_large_01rock_large_01
explain: |
  The same `*` doubles a number and repeats a string. The operator did not change. The type did.
hint: Try changing `asset * 2` to `asset + 2`.
```

---

`asset + 2` fails with a `TypeError`, because Python will not guess whether you meant maths or text.

A large share of real bugs are exactly this: a value is not the type the code assumed. A number arrives as the text `"4820"`, or a function hands back `None` where a list was expected.

---

```exercise choice
id: data-01-join-strings
question: 'What does `"12" + "3"` give you?'
options:
  - { id: fifteen, text: "15" }
  - { id: joined, text: '"123"' }
  - { id: error, text: "An error" }
answer: joined
explain: |
  Both sides are strings, so `+` joins them. Numbers read from a file or a text field arrive as strings. Convert with `int("12")` or `float("1.5")` before doing maths.
```

---

```exercise choice
id: data-01-csv-number
question: 'A triangle count was read from a CSV file, so `tris = "4820"`. What does `print(tris * 2)` show?'
options:
  - { id: doubled, text: "9640" }
  - { id: repeated, text: "48204820" }
  - { id: error, text: "A TypeError" }
answer: repeated
explain: |
  `"4820"` is a string, and `*` on a string repeats it. There is no error, so nothing warns you. The wrong number simply flows on into the next step. This is why numbers from files need `int()` or `float()` straight away.
```

---

```exercise cloze
id: data-01-cloze-convert
prompt: Make this add up to 5000.
code: |
  tris = "4820"
  total = ___(tris) + 180
  print(total)
blanks:
  - { options: ["int", "str", "len"], answer: "int" }
explain: |
  `int("4820")` turns the text into the number 4820, so adding 180 gives 5000. `str()` would leave it as text and `+ 180` would fail. `len()` would give 4, the number of characters.
```

---

```exercise choice
id: data-01-which-float
question: Which of these values is a `float`?
options:
  - { id: int, text: "`4820`" }
  - { id: str, text: '`"1.5"`' }
  - { id: float, text: "`1.5`" }
  - { id: bool, text: "`True`" }
answer: float
explain: |
  `1.5` is a float. `"1.5"` looks like a number but the quotes make it a string. `4820` has no decimal point, so it is an `int`.
```
