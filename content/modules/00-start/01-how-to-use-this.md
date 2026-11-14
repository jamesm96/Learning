---
id: start-01
title: How to use this
minutes: 4
---

Writing code is getting cheap. Knowing whether code is right is getting more valuable.

Every lesson here trains that second skill. You read real code, predict what it does, find what is wrong with it, and decide how it should be organised.

---

The five modules are the same five fundamentals in every language and every industry: data, structure, debugging, Git, and getting data in and out.

Python is the vehicle because it runs inside Blender, Maya, Unreal, ComfyUI and nearly all AI tooling. Each module ends with a short note on how the same idea looks in C# and C++, so the knowledge carries over when you need it.

---

## Two ways to use it

**On your phone, relaxed.** Work through a lesson. At each piece of code, stop and predict what it does before you check. Answer the questions. That alone builds reading fluency, which is most of the skill.

**At your desk.** Do the Apply tasks at the end of each module. They come in three tiers: one in Blender, one for pipeline work in general, and one that has nothing to do with games.

---

## Four habits that do most of the work

1. **Predict before you run.** Say what you expect, then check. Every wrong prediction shows you a gap you can fix.
2. **Read the change before you accept it.** When Claude edits your code, read every changed line. If you cannot explain a line, ask before keeping it.
3. **Explain it back.** After a lesson, describe the idea in two sentences. If you can't, reread.
4. **Break it on purpose.** Change a working example until it fails, and read the error. You learn the error messages while the cause is obvious.

---

```exercise choice
id: start-01-habit-change
question: Claude has rewritten your export function. The tests pass and it looks fine at a glance. Which habit applies now?
options:
  - { id: read, text: "Read every changed line, and ask about any you can't explain" }
  - { id: trust, text: "Keep it, because the tests pass" }
  - { id: rerun, text: "Ask Claude whether its change is correct" }
answer: read
explain: |
  Passing tests only prove what the tests check. A change can pass and still alter behaviour nobody asked for. Reading the diff is how you catch that, and it is the skill Module 4 trains directly.
```

---

```exercise choice
id: start-01-habit-predict
question: Why predict the output before you run a piece of code?
options:
  - { id: gap, text: A wrong prediction shows you exactly what you misunderstood }
  - { id: speed, text: It makes you faster at typing code }
  - { id: memory, text: It helps you memorise the syntax }
answer: gap
explain: |
  Running code without a prediction tells you what happened. Predicting first tells you whether your mental model was right. The gap between the two is what you learn from.
```

---

```exercise choice
id: start-01-habit-break
question: What is the point of breaking a working example on purpose?
options:
  - { id: errors, text: You learn what each error message means while you already know the cause }
  - { id: robust, text: It makes the example more robust }
  - { id: bugs, text: It finds bugs in the example }
answer: errors
explain: |
  When you broke it yourself, you know exactly what changed. Reading the error then teaches you what that message means. Later, when the same message appears in code you didn't write, you'll recognise it.
```
