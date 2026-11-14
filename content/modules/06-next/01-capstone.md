---
id: next-01
title: "Capstone: one pipeline, end to end"
minutes: 8
recap: |
  The capstone is one small, finished tool that uses all five modules: it loads and checks a manifest, generates each item through ComfyUI, brings the results into Blender or Unreal through the one module that knows about the host, and reports what was made, skipped and failed. A finished tool that handles ten rows well, kept in Git with a README, is worth more than an ambitious one that half works.
---

Build one small public project that uses all five modules. It is your portfolio piece, and it is the story you tell in an interview.

The point is not the size. The point is that every part of it is something you can read, explain and defend.

---

## The pipeline

1. A JSON manifest lists the items to make: name, prompt, target size.
2. Your tool loads and validates it (Modules 1 and 5).
3. It sends each item to ComfyUI through its API and saves the results (Module 5).
4. A separate module, the only one that knows about Blender or Unreal, brings the results in and applies them (Module 2).
5. It writes a report: made, skipped, failed, and why (Module 3).
6. The whole thing lives in Git with a README and a clean history (Module 4).

---

```exercise choice
id: next-01-host-module
question: Which part of the capstone should import `bpy` or `unreal`?
options:
  - { id: importer, text: "Only the module that brings the results into the scene" }
  - { id: every, text: "Every module that has anything to do with assets" }
  - { id: main, text: "The main script, so every module can use it" }
answer: importer
explain: |
  Keep the host at the edge, as in Module 2. If only the importer knows about Blender, then loading, checking, generating and reporting all run with Blender closed: on a build server, from a terminal, or with Unreal as the host instead. Swapping hosts then means rewriting one file.
```

---

## Keep it small

A finished tool that turns ten manifest rows into ten textured test assets beats an ambitious one that half works.

Small is also what makes it reviewable. You should be able to read every line of it, including the lines Claude wrote.

---

```exercise choice
id: next-01-scope
tag: Judgement call
question: Your tool now turns ten manifest rows into ten textured assets, with a report. You are tempted to add a web interface and support for three engines before publishing. What is the stronger move?
options:
  - { id: publish, text: "Publish it now with a README, then add features one at a time on branches" }
  - { id: features, text: "Add the features first, so the first version people see is impressive" }
  - { id: rewrite, text: "Ask Claude to rewrite it in a more scalable style before anyone sees it" }
answer: publish
explain: |
  A working, published tool is evidence. A half-built one is a promise. Branches from Module 4 let you try each feature without risking the version that works, and a history of small, clear steps is itself part of what a reviewer reads.
```

---

Here is a first draft of the core of the tool, the kind Claude might write in one go. `COMFY_URL` and `build_workflow` are defined elsewhere.

```exercise split
id: next-01-split-draft
prompt: Give each part of the draft to the function that should own it.
code: |
  import json
  import requests

  manifest = json.load(open("manifest.json"))
  items = [i for i in manifest["items"]
           if i.get("prompt") and i.get("size")]
  results = []
  for item in items:
      reply = requests.post(COMFY_URL,
                            json=build_workflow(item))
      results.append((item["name"], reply.status_code))
  lines = [f"{name}: {code}" for name, code in results]
  open("report.txt", "w").write("\n".join(lines))
  print(len(items), "sent")
jobs:
  - { id: load, name: load_manifest, description: "Read the manifest file and return its data" }
  - { id: check, name: validate, description: "Split the items into usable ones and skipped ones" }
  - { id: make, name: generate, description: "Send one item to ComfyUI and return the result" }
  - { id: report, name: write_report, description: "Write what was made, skipped and failed" }
  - { id: main, name: main, description: "Run the steps in order" }
answer:
  - { job: load, lines: "1-4" }
  - { job: check, lines: "5-6" }
  - { job: make, lines: "7-11" }
  - { job: report, lines: "12-13" }
  - { job: main, lines: "14" }
model: |
  def load_manifest(path):
      text = Path(path).read_text(encoding="utf-8")
      return json.loads(text)

  def validate(items):
      good, skipped = [], []
      for item in items:
          if item.get("prompt") and item.get("size"):
              good.append(item)
          else:
              skipped.append((item["name"], "no prompt or size"))
      return good, skipped

  def generate(item):  # in comfy_client.py
      reply = requests.post(COMFY_URL,
                            json=build_workflow(item))
      return reply.status_code

  def write_report(sent, skipped, path):
      lines = [f"{name}: {code}" for name, code in sent]
      lines += [f"{name}: skipped, {why}"
                for name, why in skipped]
      Path(path).write_text("\n".join(lines),
                            encoding="utf-8")

  def main():
      manifest = load_manifest("manifest.json")
      good, skipped = validate(manifest["items"])
      sent = [(i["name"], generate(i)) for i in good]
      write_report(sent, skipped, "report.txt")
      print(len(sent), "sent,", len(skipped), "skipped")
explain: |
  Splitting it exposes a real bug. The draft's comprehension in lines 5 and 6 drops items with no prompt and never mentions them, so the report cannot say what was skipped. In the model, `validate` returns the skipped items with a reason, and the report can list them.

  `generate` is the only function that talks to the network, so it can live in its own file and be swapped for a stand-in while you test the rest.
```

---

```exercise choice
id: next-01-report-line
question: One item failed overnight. Which report line lets you act on it in the morning?
options:
  - { id: specific, text: '`boat_01: failed, ComfyUI returned 400 (empty prompt)`' }
  - { id: count, text: '`9 made, 1 failed`' }
  - { id: done, text: '`Batch finished`' }
answer: specific
explain: |
  Which item, and why. The count is a useful summary line at the end, but on its own it sends you back through the logs. This is the honest batch from Module 3: carry on past a failure, and say exactly what it was.
```

---

```exercise choice
id: next-01-where-generate
tag: Judgement call
question: You want to test the validation and the report on your laptop without ComfyUI running. Which design makes that easy?
options:
  - { id: separate, text: "The ComfyUI call lives in one small function in its own module, and everything else takes plain data" }
  - { id: try, text: "Wrap every ComfyUI call in `try` / `except Exception` so nothing fails when it is not running" }
  - { id: flag, text: "Add a global `OFFLINE = True` that every function checks" }
answer: separate
explain: |
  When the network call is in one place, the rest of the tool only ever sees lists and dicts, which you can make by hand. A broad `except` would hide real failures, and a global flag spreads one concern into every function.
```
