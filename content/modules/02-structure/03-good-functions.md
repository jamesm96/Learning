---
id: structure-03
title: What a good function looks like
minutes: 8
recap: |
  A good function does one job, which a verb name and one sentence without "and" can describe, takes what it needs as parameters and returns its result. Splitting a script into load, check and write keeps the checks pure, so they can be tested with a hand-made list and a new rule touches one place.
---

Four tests for a good function:

- It does one job, and its name says what, as a verb: `load_manifest`, `find_over_budget`, `export_asset`.
- You can describe it in one sentence without the word "and".
- Everything it needs comes in through parameters. Its result goes out through `return`.
- It fits on a screen. Past about thirty lines, look for a second job hiding inside.

---

```exercise choice
id: structure-03-one-job
question: Which function description passes the "no and" test?
options:
  - { id: one, text: "Return the SKUs of products with no stock" }
  - { id: two, text: "Load the catalogue and remove products with no stock" }
  - { id: three, text: "Resize the images, rename them and upload them" }
answer: one
explain: |
  The first does one thing. The second loads data and also filters it, which is two jobs with two reasons to change: the file format, and the stock rule. Splitting them means the stock rule can be tested with a hand-made list.
```

---

## A first draft

This script works, and it is how a first draft often looks. Read it and decide where you would cut it into functions.

```python
import json

data = json.load(open("D:/harbour/manifest.json"))
bad = []
for a in data["assets"]:
    if not a["name"].startswith("SM_"):
        bad.append(a["name"] + ": bad prefix")
    if a["tris"] > 9000:
        bad.append(a["name"] + ": over budget")
f = open("D:/harbour/report.txt", "w")
for line in bad:
    f.write(line + "\n")
f.close()
print(len(bad), "problems")
```

---

```exercise choice
id: structure-03-jobs
tag: Judgement call
question: Which part of the draft could you test with a hand-made list and no files at all?
options:
  - { id: loop, text: 'The loop over `data["assets"]` that builds `bad`' }
  - { id: load, text: "The `json.load(open(...))` line" }
  - { id: write, text: "The lines that open and write the report" }
  - { id: none, text: "None of it; it all needs the manifest file" }
answer: loop
explain: |
  The checks only need a list of asset dictionaries. Loading and writing touch the disk. Right now the checks are tangled between the two, so testing them means preparing real files. That is the seam to cut along.
```

---

```exercise split
id: structure-03-split-draft
prompt: Give each part of the draft to the function that should own it. Then compare with one way to split it.
code: |
  import json

  data = json.load(open("D:/harbour/manifest.json"))
  bad = []
  for a in data["assets"]:
      if not a["name"].startswith("SM_"):
          bad.append(a["name"] + ": bad prefix")
      if a["tris"] > 9000:
          bad.append(a["name"] + ": over budget")
  f = open("D:/harbour/report.txt", "w")
  for line in bad:
      f.write(line + "\n")
  f.close()
  print(len(bad), "problems")
jobs:
  - { id: load, name: load_manifest, description: "Read the manifest file and return its data" }
  - { id: check, name: find_problems, description: "Return a list of problems for a list of assets" }
  - { id: write, name: write_report, description: "Write the problems to a report file" }
  - { id: main, name: main, description: "Run the steps in order and say how it went" }
answer:
  - { job: load, lines: "1-3" }
  - { job: check, lines: "4-9" }
  - { job: write, lines: "10-13" }
  - { job: main, lines: "14" }
model: |
  import json
  from pathlib import Path

  TRI_BUDGET = 9000

  def load_manifest(path):
      text = Path(path).read_text(encoding="utf-8")
      return json.loads(text)

  def find_problems(assets, budget=TRI_BUDGET):
      problems = []
      for a in assets:
          if not a["name"].startswith("SM_"):
              problems.append(f"{a['name']}: bad prefix")
          if a["tris"] > budget:
              problems.append(f"{a['name']}: over budget")
      return problems

  def write_report(problems, path):
      text = "\n".join(problems)
      Path(path).write_text(text, encoding="utf-8")

  def main():
      manifest = load_manifest("D:/harbour/manifest.json")
      problems = find_problems(manifest["assets"])
      write_report(problems, "D:/harbour/report.txt")
      print(len(problems), "problems")
explain: |
  Each job touches one kind of thing: the disk going in, the rules, the disk going out, and the order of the steps. The checks in lines 4 to 9 are the only part with real decisions in them, and once they are a function of their own they need no files at all. Small differences from the model are fine as long as no function does two of these jobs.
```

---

## One way to split it, part 1

```python
import json
from pathlib import Path

TRI_BUDGET = 9000

def load_manifest(path):
    text = Path(path).read_text(encoding="utf-8")
    return json.loads(text)

def find_problems(assets, budget=TRI_BUDGET):
    problems = []
    for a in assets:
        if not a["name"].startswith("SM_"):
            problems.append(f"{a['name']}: bad prefix")
        if a["tris"] > budget:
            problems.append(f"{a['name']}: over budget")
    return problems
```

---

## Part 2

```python
def write_report(problems, path):
    text = "\n".join(problems)
    Path(path).write_text(text, encoding="utf-8")

def main():
    manifest = load_manifest("D:/harbour/manifest.json")
    problems = find_problems(manifest["assets"])
    write_report(problems, "D:/harbour/report.txt")
    print(len(problems), "problems")

main()
```

Same behaviour, three gains. `find_problems` is pure, so you can test it with a hand-made list and no files. The budget has a name and one home. And `main` now reads like a description of the tool: load, check, report.

---

Because `find_problems` is pure, you can try it right here.

```exercise predict
id: structure-03-predict-problems
code: |
  def find_problems(assets, budget=9000):
      problems = []
      for a in assets:
          if not a["name"].startswith("SM_"):
              problems.append(f"{a['name']}: bad prefix")
          if a["tris"] > budget:
              problems.append(f"{a['name']}: over budget")
      return problems

  assets = [
      {"name": "SM_Rock_01", "tris": 4820},
      {"name": "crane_02", "tris": 18250},
  ]
  print(find_problems(assets))
output: |
  ['crane_02: bad prefix', 'crane_02: over budget']
explain: |
  The rock passes both checks. The crane fails both, so it appears twice. No manifest, no report file and no Blender were needed to find that out.
```

---

```exercise choice
id: structure-03-how-many-change
tag: Judgement call
question: You want to add a check for missing materials. In the split version, how many functions change?
options:
  - { id: all, text: "All four" }
  - { id: one, text: "One: `find_problems`" }
  - { id: two, text: "Two: `find_problems` and `main`" }
answer: one
explain: |
  That is the practical test of structure: a new requirement should touch one place. If a small change forces edits all over a file, the code is telling you its pieces are in the wrong places.
```

---

Now make that change.

```exercise edit
id: structure-03-edit-materials
goal: 'Add a check so an asset with an empty `"materials"` list gets the problem `"<name>: no materials"`.'
code: |
  def find_problems(assets, budget=9000):
      problems = []
      for a in assets:
          if not a["name"].startswith("SM_"):
              problems.append(f"{a['name']}: bad prefix")
          if a["tris"] > budget:
              problems.append(f"{a['name']}: over budget")
      return problems
check: |
  result = find_problems([
      {"name": "SM_Rock_01", "tris": 4820, "materials": ["moss"]},
      {"name": "SM_Crate_03", "tris": 1200, "materials": []},
  ])
  assert result == ["SM_Crate_03: no materials"], "only the crate has no materials, so it should be the one problem reported"
solution: |
  def find_problems(assets, budget=9000):
      problems = []
      for a in assets:
          if not a["name"].startswith("SM_"):
              problems.append(f"{a['name']}: bad prefix")
          if a["tris"] > budget:
              problems.append(f"{a['name']}: over budget")
          if not a["materials"]:
              problems.append(f"{a['name']}: no materials")
      return problems
explain: |
  One new `if` inside the loop, in one function. `not a["materials"]` is true for an empty list. Loading, writing and `main` did not need to know.
```
