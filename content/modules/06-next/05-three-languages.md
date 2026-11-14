---
id: next-05
title: One idea, three languages
minutes: 8
recap: |
  Python, C# and C++ share the same ideas, but C# and C++ declare types and check them before the program runs, and use braces where Python uses indentation. The real new subject in C++ is memory: Python and C# free it automatically, while in C++ you manage who owns each piece.
---

The ideas in this course are the same in every language. What changes is the spelling, and when mistakes are found.

| | Types | Blocks |
|---|---|---|
| Python | Checked when the line runs; hints optional | Indentation |
| C# | Declared; checked before running | Braces `{ }` |
| C++ | Declared; checked before running | Braces `{ }` |

---

```exercise choice
id: next-05-compile-time
question: 'In C#, a line reads `int tris = "4820";`. When is the mistake found?'
options:
  - { id: before, text: "Before the program runs: the compiler refuses to build it" }
  - { id: line, text: "When that line runs, as in Python" }
  - { id: never, text: "Never; C# converts the text to a number for you" }
answer: before
explain: |
  The variable is declared as `int`, and `"4820"` is a string, so the compiler stops with an error before anything runs. In Python the same mistake would only show when the line runs, or as a silent wrong value, like `"4820" * 2`.
```

---

In Python, indentation is the structure. Predict the output.

```exercise predict
id: next-05-predict-blocks
code: |
  for tris in [4820, 18250]:
      if tris > 9000:
          print("over", tris)
      print("checked", tris)
  print("done")
output: |
  checked 4820
  over 18250
  checked 18250
  done
explain: |
  `print("checked", ...)` is indented once, so it belongs to the loop and runs for both counts. `print("over", ...)` is indented twice, so it belongs to the `if`. `print("done")` has no indent, so it runs once, after the loop. In C# or C++ the same structure is marked with braces, and the indents are only for people.
```

---

| | Function | Nothing |
|---|---|---|
| Python | `def f(x):` | `None` |
| C# | `int F(int x) { }`, inside a class | `null` |
| C++ | `int f(int x) { }` | `nullptr` |

---

```exercise cloze
id: next-05-cloze-python
prompt: 'This C# method returns the matching asset or `null`. Complete the Python version.'
code: |
  ___ find(assets, name):
      for a in assets:
          if a["name"] == name:
              return a
      return ___
blanks:
  - { options: ["def", "int", "void"], answer: "def" }
  - { options: ["None", "null", "nullptr"], answer: "None" }
explain: |
  Python starts a function with `def` and writes no return type, where C# would write the type first. Python's "nothing" is `None`; `null` is C#'s and `nullptr` is C++'s. All three mean the same thing, and all three need checking before use.
```

---

| | Errors | Memory |
|---|---|---|
| Python | `try` / `except` | Automatic |
| C# | `try` / `catch` | Automatic |
| C++ | `try` / `catch` | You manage ownership |

---

The shape of error handling is the same in all three. Predict the output.

```exercise predict
id: next-05-predict-except
code: |
  sizes = {"rock": 4820}
  try:
      print(sizes["tree"])
  except KeyError as e:
      print("missing:", e)
  print("carried on")
output: |
  missing: 'tree'
  carried on
explain: |
  The lookup raises `KeyError`, the handler names it, and the program carries on. In C# this would be `catch (KeyNotFoundException e)`; in C++, reading a `std::unordered_map` with `.at("tree")` throws `std::out_of_range`. Printing a `KeyError` shows the missing key in quotes.
```

---

## Where you meet each one

| | Where |
|---|---|
| Python | Blender, Maya, Unreal scripting, ComfyUI, AI tooling |
| C# | Unity, Windows tools |
| C++ | Unreal engine code, plug-ins, performance work |

---

```exercise choice
id: next-05-which-language
question: Which of these jobs would most likely be in C++?
options:
  - { id: cpp, text: "Writing an Unreal engine plug-in that speeds up a heavy step" }
  - { id: python, text: "A Blender add-on that checks naming and budgets" }
  - { id: csharp, text: "A Unity script that moves a character" }
answer: cpp
explain: |
  Unreal's engine and plug-ins are written in C++. Blender add-ons are Python, and Unity scripts are C#. Unreal also has Python for editor scripting, which is where most pipeline work starts.
```
