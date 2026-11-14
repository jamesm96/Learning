---
id: start-02
title: Set up once, and pace
minutes: 4
---

## Set up once

These are for your desk sessions. The lessons on your phone need nothing installed.

- Install Python 3.12 or newer from python.org, and VS Code with its Python extension.
- Install Git. Make a folder called `code-literacy` and run `git init` in it.
- Save every exercise there and commit as you go. Module 4 explains what you are doing; start the habit now.

---

Here is the first piece of code. Read it and decide what it prints before you reveal the answer.

```exercise predict
id: start-02-predict-first
code: |
  print("Python is working.")
  print(2 + 3 * 4)
output: |
  Python is working.
  14
explain: |
  Python follows the usual order of operations: multiplication before addition. So `3 * 4` is 12, then `2 + 12` is 14. Write `(2 + 3) * 4` if you want 20.
```

---

```exercise predict
id: start-02-predict-division
code: |
  print(10 / 4)
  print(10 // 4)
  print(8 / 4)
output: |
  2.5
  2
  2.0
explain: |
  `/` always gives a decimal (a `float`), even when the answer is whole: `8 / 4` is `2.0`, not `2`. `//` divides and drops the remainder, giving a whole number. If a count of frames or files suddenly shows `.0`, a `/` is usually the reason.
```

---

## Pace

At about ten hours a week this is eight weeks: two for data, two for structure, one each for debugging, Git, and data in and out, then one for a capstone project.

On your phone, aim for a lesson or a short review a day. Five to twenty minutes is enough.

---

```exercise choice
id: start-02-precedence
question: What does `print((2 + 3) * 4)` show?
options:
  - { id: twenty, text: '20' }
  - { id: fourteen, text: '14' }
  - { id: text, text: '(2 + 3) * 4' }
answer: twenty
explain: |
  Brackets are worked out first, so `2 + 3` is 5, then `5 * 4` is 20. `print` shows the result of the expression, not the expression itself. To print the text, it would need quotes: `print("(2 + 3) * 4")`.
```
