---
id: debugging-02
title: The errors you will meet every week
minutes: 8
---

A handful of error types cover most of what you will see. Each one points at a different first check. The table scrolls sideways.

| Error | Plain meaning | Check first |
|---|---|---|
| `NameError` | That name does not exist here | Spelling; was it defined before this line, in this scope? |
| `TypeError` | Wrong kind of value for this operation | Print the value and its `type()` |
| `KeyError` | Dictionary has no such key | Print the dictionary's keys |
| `IndexError` | List is shorter than you assumed | Print `len()` of the list |
| `AttributeError` | This object has no such property or method | If it mentions `NoneType`: something returned None earlier |
| `ValueError` | Right type, unusable content | e.g. `int("abc")`; print the raw value |
| `ModuleNotFoundError` | Import failed | Is the package installed in *this* Python? |
| `FileNotFoundError` | Path does not exist | Print the full path; where is the script running from? |
| `SyntaxError`, `IndentationError` | Python could not read the code | The line shown, and the one before it |

---

```exercise traceback
id: debugging-02-name-error
code: |
  nodes = ["KSampler", "VAEDecode", "SaveImage"]
  node_count = 0
  for node in nodes:
      node_count += 1
  print("Nodes:", node_cuont)
options:
  - { id: typo, text: "A spelling mistake in the variable name" }
  - { id: scope, text: "`node_count` only exists inside the loop" }
  - { id: list, text: "The list of nodes is empty" }
answer: typo
explain: |
  `NameError` means Python has never heard of `node_cuont`. Recent versions of Python also suggest the name you probably meant, which here gives the answer away. Read the whole last line: it often contains the fix.
```

---

```exercise traceback
id: debugging-02-type-error
code: |
  products = [
      {"sku": "LAMP-01", "price": 39.0},
      {"sku": "DESK-02", "price": "149.00"},
  ]
  total = 0
  for p in products:
      total += p["price"]
  print(total)
options:
  - { id: text-price, text: "One price is text, not a number" }
  - { id: total-zero, text: "`total` should start as `0.0`" }
  - { id: bad-key, text: 'One product has no "price" key' }
answer: text-price
explain: |
  `unsupported operand type(s) for +=: 'float' and 'str'`. By the second product `total` is a float, and Python will not add a string to it. `print(type(p["price"]))` would show `<class 'str'>` for DESK-02.

  Prices, counts and sensor values that came from a file or a web form are often text. Convert them where the data comes in.
```

---

```exercise traceback
id: debugging-02-attribute-none
code: |
  import re

  def lod_level(name):
      match = re.match(r"(\w+)_lod(\d)", name)
      return int(match.group(2))

  for name in ["rock_lod1", "rock_lod2", "rock_01"]:
      print(name, lod_level(name))
options:
  - { id: no-match, text: "One name did not match the pattern, so the match was None" }
  - { id: group, text: "`group(2)` should be `group(1)`" }
  - { id: int, text: "`int()` cannot read the digit" }
answer: no-match
explain: |
  `'NoneType' object has no attribute 'group'`. When `re.match` finds no match it returns `None`, and `None` has no methods. `"rock_01"` has no `_lod` part.

  Whenever an `AttributeError` mentions `NoneType`, look for the earlier line that returned `None` without anyone checking.
```

---

```exercise traceback
id: debugging-02-value-error
code: |
  def to_celsius(raw):
      return (float(raw) - 32) * 5 / 9

  readings = ["70.2", "71.0", "n/a", "69.8"]
  for r in readings:
      print(round(to_celsius(r), 1))
options:
  - { id: bad-text, text: "One reading is text that is not a number" }
  - { id: maths, text: "The conversion formula is wrong" }
  - { id: type, text: "The readings should be numbers, not strings" }
answer: bad-text
explain: |
  `ValueError` means the type was right, a string, but its content could not be used. The message even quotes the raw value: `'n/a'`. The other three readings are strings too and convert fine.

  Logged sensor data often marks gaps like this. Decide what a gap should mean, rather than letting it crash halfway through.
```

---

```exercise choice
id: debugging-02-module-not-found
tag: Judgement call
question: '`import numpy` works in your terminal, but the same line in Blender''s Python console gives `ModuleNotFoundError`. What is the most likely cause?'
options:
  - { id: other-python, text: "Blender runs its own bundled Python, and numpy is not installed there" }
  - { id: spelling, text: "The module name is misspelt" }
  - { id: broken, text: "The numpy install is broken" }
answer: other-python
explain: |
  One computer can have several Pythons, each with its own installed packages. Blender ships its own. Unreal, ComfyUI's portable build and most virtual environments do the same. "Installed" always means installed in a particular Python.
```

---

```exercise choice
id: debugging-02-file-not-found
question: '`open("textures/rock.png")` works when you run the script from the project folder, and raises `FileNotFoundError` when a render farm job runs it. Why?'
options:
  - { id: cwd, text: "A relative path is read from wherever the script is run, which is now somewhere else" }
  - { id: deleted, text: "The farm deleted the file" }
  - { id: slashes, text: "The farm needs backslashes" }
answer: cwd
explain: |
  `"textures/rock.png"` means "the textures folder inside the current folder". The current folder is wherever the program was started from, not where the script lives. Print the full path with `os.path.abspath(...)` and the mismatch is usually obvious.
```

---

```exercise choice
id: debugging-02-syntax-error
question: 'Python reports `SyntaxError: ''{'' was never closed` and points at line 1. Where is the mistake?'
code: |
  sizes = {"rock": 4820,
           "tree": 18250
  print(sizes)
options:
  - { id: line2, text: "Line 2 is missing its closing brace" }
  - { id: line3, text: "Line 3: `print` is misspelt" }
  - { id: line1, text: "Line 1 has a stray brace" }
answer: line2
explain: |
  Python reads on, looking for the `}`, and only gives up later. It then points at where the bracket opened. With syntax errors, check the line shown and the lines around it, especially the one before the line it complains about.
```
