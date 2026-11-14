---
id: next-02
title: "Capstone warm-up: load, check, report"
minutes: 12
recap: |
  The warm-up builds the first and last stages of the capstone on a real file: load `manifest.json`, check each asset with a pure function, and write a report that a check can read back. A missing value should become a line in the report, not a silent default, so every asset ends up either fine or listed with a reason.
---

Before the capstone talks to ComfyUI or Blender, it has to load a manifest, check it, and write a report. You can build those stages here, on your phone.

Every run in this app starts with a file called `manifest.json` in the working folder. It describes the harbour level from earlier lessons.

---

Here is its contents. Say its shape in one sentence first, then find the value.

```exercise shape
id: next-02-shape-manifest
question: Find the crane's triangle count.
name: manifest
data: |
  {
    "project": "harbour",
    "version": 3,
    "assets": [
      {"name": "rock_01", "type": "prop", "tris": 4820,
       "materials": ["moss", "stone"],
       "path": "props/rock_01.fbx"},
      {"name": "crane_02", "type": "prop", "tris": 18250,
       "materials": ["metal"],
       "path": "props/crane_02.fbx"},
      {"name": "boat_01", "type": "vehicle", "tris": 9100,
       "materials": ["wood", "rope", "metal"],
       "path": "vehicles/boat_01.fbx"}
    ]
  }
answer: 'manifest["assets"][1]["tris"]'
explain: |
  A dict with a project name, a version and a list of asset dicts under `assets`. The crane is the second asset, so index 1, and its count is under the key `"tris"`: 18250.
```

---

This reads the real file. Predict all three lines.

```exercise predict
id: next-02-predict-load
code: |
  import json
  from pathlib import Path

  text = Path("manifest.json").read_text(encoding="utf-8")
  manifest = json.loads(text)
  print(manifest["project"], manifest["version"])
  print([a["name"] for a in manifest["assets"]])
  print(len(manifest["assets"][2]["materials"]))
output: |
  harbour 3
  ['rock_01', 'crane_02', 'boat_01']
  3
explain: |
  `read_text` gives the whole file as one string, and `json.loads` turns it into the dict you just explored. From there it is ordinary Python: a key, a comprehension, a path ending in a list whose length is 3.
```

---

The check itself should be pure: one asset in, a list of problems out. No files.

```exercise parsons
id: next-02-parsons-check
prompt: Build `check_asset`, which returns a list of problems for one asset.
code: |
  def check_asset(asset, budget=9000):
      problems = []
      if asset["tris"] > budget:
          problems.append("over budget")
      if not asset["materials"]:
          problems.append("no materials")
      return problems
check: |
  ok = {"tris": 4820, "materials": ["moss"]}
  bad = {"tris": 18250, "materials": []}
  assert check_asset(ok) == [], "the rock is within budget and has materials, so it has no problems"
  assert sorted(check_asset(bad)) == ["no materials", "over budget"], "an asset over budget with no materials has both problems"
  assert check_asset(bad, budget=20000) == ["no materials"], "with a budget of 20000, only the missing materials remain"
explain: |
  The two `if` checks are independent, so either can come first. Each `append` sits one level inside its own `if`, and `return` comes last, at the level of the function body, so both checks always run.
```

---

Now the report. `write_report` does nothing yet.

```exercise edit
id: next-02-edit-report
goal: 'Make `write_report` write one problem per line to the file at `path`. The check opens `report.txt` and reads it back.'
code: |
  import json
  from pathlib import Path

  def load_manifest(path):
      return json.loads(Path(path).read_text())

  def find_problems(assets, budget=9000):
      return [f"{a['name']}: over budget"
              for a in assets if a["tris"] > budget]

  def write_report(problems, path):
      pass

  manifest = load_manifest("manifest.json")
  write_report(find_problems(manifest["assets"]), "report.txt")
check: |
  from pathlib import Path
  assert Path("report.txt").exists(), "write_report should create report.txt"
  lines = Path("report.txt").read_text(encoding="utf-8").splitlines()
  assert lines == ["crane_02: over budget", "boat_01: over budget"], f"report.txt holds {lines}; it should list the crane and the boat, one per line"
solution: |
  import json
  from pathlib import Path

  def load_manifest(path):
      return json.loads(Path(path).read_text())

  def find_problems(assets, budget=9000):
      return [f"{a['name']}: over budget"
              for a in assets if a["tris"] > budget]

  def write_report(problems, path):
      text = "\n".join(problems)
      Path(path).write_text(text, encoding="utf-8")

  manifest = load_manifest("manifest.json")
  write_report(find_problems(manifest["assets"]), "report.txt")
explain: |
  `"\n".join(problems)` puts a line break between the problems, and `write_text` creates the file or replaces it. The check reads the file back from disk, which is the honest test of a tool that writes files: not what the code meant to write, but what is really there.
```

---

A new manifest arrives with a lamp that has no triangle count yet. The tool says the lamp is fine.

```exercise fix
id: next-02-fix-missing-tris
symptom: 'The lamp has no `"tris"` value, but `report.txt` only mentions the crane.'
files:
  manifest.json: |
    {"project": "harbour", "version": 4, "assets": [
      {"name": "crane_02", "tris": 18250},
      {"name": "lamp_03"}
    ]}
code: |
  import json
  from pathlib import Path

  text = Path("manifest.json").read_text()
  problems = []
  for a in json.loads(text)["assets"]:
      if a.get("tris", 0) > 9000:
          problems.append(f"{a['name']}: over budget")
  Path("report.txt").write_text("\n".join(problems))
check: |
  from pathlib import Path
  lines = Path("report.txt").read_text().splitlines()
  assert "crane_02: over budget" in lines, "the crane is still over budget and should be reported"
  assert "lamp_03: no triangle count" in lines, f"report.txt holds {lines}; the lamp should be listed as 'lamp_03: no triangle count'"
solution: |
  import json
  from pathlib import Path

  text = Path("manifest.json").read_text()
  problems = []
  for a in json.loads(text)["assets"]:
      if "tris" not in a:
          problems.append(f"{a['name']}: no triangle count")
      elif a["tris"] > 9000:
          problems.append(f"{a['name']}: over budget")
  Path("report.txt").write_text("\n".join(problems))
cause:
  options:
    - { id: default, text: '`.get("tris", 0)` turns a missing count into 0, which passes the budget check' }
    - { id: budget, text: "The budget of 9000 is too high" }
    - { id: write, text: "`write_text` only writes the first problem" }
  answer: default
explain: |
  The made-up default from Module 1 again: a missing count became 0, and 0 is within budget, so the lamp looked fine. Checking for the key first turns it into a line in the report. In the capstone, the same rule decides whether an item is made or skipped with a reason.
```

---

```exercise choice
id: next-02-test-without-files
question: In the edit exercise, which function could you test with a hand-made list and no manifest file at all?
options:
  - { id: find, text: "`find_problems`" }
  - { id: load, text: "`load_manifest`" }
  - { id: write, text: "`write_report`" }
answer: find
explain: |
  `find_problems` takes a list and returns a list. The other two touch the disk. Keeping the rules in pure functions is what lets the capstone's checks be tested in seconds, long before ComfyUI or Blender is involved.
```

---

## Where this goes next

You have the first and last stages. The capstone adds two in the middle: a module that sends each item to ComfyUI and saves the result, and a module, the only one that imports the host, that brings the results into the scene.

The report grows too: made, skipped, failed, and why.
