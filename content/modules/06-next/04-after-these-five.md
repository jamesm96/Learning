---
id: next-04
title: What to learn after these five
minutes: 8
recap: |
  After these five, learn testing with `pytest` so you can accept AI changes knowing when behaviour moved, type checking with mypy or Pyright, and virtual environments with `pyproject.toml` so others can install your tools. Learn C# when the work needs it, and know the names of databases, web services, job queues and containers now, because that is how AI pipelines run at scale in any industry.
---

## Testing

A test is a small function that checks your code gives a known answer for a known input. The usual tool is `pytest`: it finds files named `test_*.py`, runs every function in them whose name starts with `test_`, and reports which ones failed.

Tests are what let you accept AI changes with confidence, because they tell you when behaviour moved.

---

Claude has made a "small tidy-up" to a budget check. The test was written before the change. Predict what it prints.

```exercise predict
id: next-04-predict-test
code: |
  def over_budget(tris, budget=9000):
      return tris >= budget

  def test_over_budget():
      assert over_budget(9001) is True
      assert over_budget(9000) is False

  try:
      test_over_budget()
      print("passed")
  except AssertionError:
      print("failed: behaviour moved")
output: |
  failed: behaviour moved
explain: |
  `9001 >= 9000` is true, so the first assert passes. `9000 >= 9000` is also true, so the second fails: an asset exactly on budget is now flagged. The boundary test caught a one-character change that a quick read of the diff could miss. `pytest` does the `try` part for you and reports which assert failed.
```

---

## Type checking, environments and packaging

**Type checking.** A tool such as `mypy` or Pyright reads your type hints and finds mismatches without running the code. It brings Python closer to C#.

**Environments and packaging.** A virtual environment per project, and a `pyproject.toml` that lists the name, version and dependencies, so someone else can install and run your tool.

---

```exercise choice
id: next-04-type-checker
question: '`def double(count: int) -> int` is called as `double("ab")` deep inside a tool. What finds the mistake before the tool runs?'
options:
  - { id: checker, text: "A type checker such as mypy or Pyright" }
  - { id: python, text: "Python itself, when it loads the file" }
  - { id: pytest, text: "pytest, even if no test calls that line" }
answer: checker
explain: |
  Python ignores hints when it runs, as Module 2 showed. A type checker reads them without running anything and flags the string passed where an `int` was promised. A test only finds the mistake if it runs that line.
```

---

## Further out

**C#, when your work needs it.** With these five in place, you are learning new spelling for ideas you already hold, plus static typing.

**Later, for the wider horizon:** SQL and databases, how web services are built, job queues for long-running work, and containers. These are how AI pipelines run at scale in any industry. Know the names now, and learn each when a project calls for it.

---

```exercise choice
id: next-04-queue
tag: Judgement call
question: You lead an AI pipeline that must run three thousand ComfyUI jobs overnight on several machines, and retry the ones that fail. Which later topic is most directly about that?
options:
  - { id: queue, text: "Job queues for long-running work" }
  - { id: sql, text: "SQL and databases" }
  - { id: csharp, text: "C#" }
answer: queue
explain: |
  A queue holds the jobs, lets several workers take them one at a time, and records which failed so they can be retried. A database often sits beside it to keep the results, and containers make every worker machine identical. The capstone's manifest and report are the same idea at the size of one laptop.
```

---

```exercise choice
id: next-04-synthetic
tag: Judgement call
question: A robotics company is building a digital twin of a warehouse and needs thousands of synthetic training images. Which of your skills carries over most directly?
options:
  - { id: pipeline, text: "The capstone's shape: a manifest of scenes in, generation, checks, and a report of what was made" }
  - { id: modelling, text: "Only your modelling and lighting skills" }
  - { id: none, text: "Very little, since robotics work is all C++" }
answer: pipeline
explain: |
  Synthetic data is a pipeline problem: describe each scene as data, generate it in a simulator or a 3D package, check the output, and report. Robotics simulators are commonly scripted in Python. Your eye for scenes matters too, but the code skills are what let you run it at scale.
```

---

```exercise choice
id: next-04-lead
tag: Judgement call
question: For a move into lead or principal tech art, which piece of evidence carries the most weight?
options:
  - { id: tool, text: "A tool other people install and use, with tests and a README, that you can walk an engineer through" }
  - { id: lines, text: "The number of lines of code you have produced with AI" }
  - { id: languages, text: "A list of every language you have tried" }
answer: tool
explain: |
  Leads are trusted with other people's time. A tool others rely on, that you can explain and defend line by line, shows judgement as well as output. That is exactly what the capstone is for.
```
