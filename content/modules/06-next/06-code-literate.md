---
id: next-06
title: You are code-literate when you can
minutes: 10
recap: |
  Code literacy means I can read any function and say what it does in a sentence, find a value in any JSON, name the likely cause of a traceback, spot an unrequested change in a diff, and propose a better split for a file. It also means I can write a fifty-line tool without AI help and walk an engineer through my own tools.
---

## The self-test

You are code-literate when you can:

1. Read any function Claude writes and say what it does in a sentence.
2. Describe the shape of any JSON data and write the path to a value in it.
3. Read a traceback and name the likely cause before asking for help.
4. Read a diff and spot a change that was not asked for.
5. Explain why a file is structured the way it is, and propose a better split.
6. Write a fifty-line tool with no AI help: read a file, transform data, write a result.
7. Walk an engineer through one of your tools and answer their questions.

The next five steps test the first five.

---

**1. Say what it does in a sentence.**

```exercise choice
id: next-06-one-sentence
question: Which sentence describes this function?
code: |
  def stale(jobs, now, limit=3600):
      return [j["id"] for j in jobs
              if j["status"] == "running"
              and now - j["started"] > limit]
options:
  - { id: right, text: "Return the ids of running jobs that started more than an hour ago" }
  - { id: stops, text: "Stop every job that has run for more than an hour" }
  - { id: finished, text: "Return the jobs that finished within the last hour" }
answer: right
explain: |
  It returns a list and changes nothing, so it cannot stop anything. It keeps jobs that are `"running"` and whose start time is more than `limit` seconds before `now`; 3600 seconds is an hour. The values it keeps are the ids, not the whole jobs.
```

---

**2. Find a value in JSON you have not seen.** This is a reply from an AI model's API, trimmed down.

```exercise shape
id: next-06-shape-reply
question: Find the text the model wrote.
name: reply
data: |
  {
    "id": "msg_01",
    "role": "assistant",
    "content": [
      {"type": "text",
       "text": "A weathered oak crate, top lit"}
    ],
    "stop_reason": "end_turn",
    "usage": {"input_tokens": 18, "output_tokens": 9}
  }
answer: 'reply["content"][0]["text"]'
explain: |
  A dict with a list of content blocks under `content`. The text is inside the first block, so the path needs an index before the last key. The list is there because a reply can hold several blocks of different types, which is why code that assumes `reply["content"]` is a string fails.
```

---

**3. Name the cause before asking for help.**

```exercise traceback
id: next-06-traceback-sizes
code: |
  def texture_sizes(rows):
      return {r["name"]: int(r["size"]) for r in rows}

  rows = [
      {"name": "crate", "size": "512"},
      {"name": "barrel", "size": "1k"},
  ]
  print(texture_sizes(rows))
options:
  - { id: text, text: 'One size is written as "1k", which is not a whole number' }
  - { id: key, text: 'One row has no "size" key' }
  - { id: dict, text: "A dict comprehension cannot call `int`" }
answer: text
explain: |
  `ValueError: invalid literal for int()`, and the message quotes the value: `'1k'`. The type was right, a string, but its content cannot be read as a number. The fix is a decision: reject the row with a clear message, or teach the loader what `k` means.
```

---

**4. Spot a change that was not asked for.**

```exercise diff
id: next-06-diff-scope
task: Fix the crash when an asset has no `"materials"` key.
diff: |
  --- a/checks.py
  +++ b/checks.py
  @@ -1,7 +1,7 @@
   def find_problems(assets, budget=9000):
       problems = []
       for a in assets:
  -        if a["tris"] > budget:
  +        if a["tris"] >= budget:
               problems.append(f"{a['name']}: over budget")
  -        if not a["materials"]:
  +        if not a.get("materials"):
               problems.append(f"{a['name']}: no materials")
       return problems
flags: ['+        if a["tris"] >= budget:']
explain: |
  The `.get("materials")` change is the fix: a missing key now counts as no materials and is reported, rather than crashing. The `>=` change was not asked for. It quietly flags every asset that sits exactly on the budget.
```

---

**5. Propose a better split.**

```exercise choice
id: next-06-better-split
tag: Judgement call
question: A 400-line Blender add-on mixes a UI panel, naming rules, budget checks and FBX export, with `bpy` used throughout. Which split would you propose first?
options:
  - { id: rules, text: "Move the naming rules and budget checks into a module that does not import `bpy`" }
  - { id: classes, text: "Turn every function into a method on one large `AddonManager` class" }
  - { id: files, text: "Cut the file into four files of 100 lines each" }
answer: rules
explain: |
  The rules are the part with decisions in them, and they need no Blender. Moved out, they can be tested from a terminal and reused in Unreal or on a build server. Cutting by line count, or wrapping everything in a manager class, moves code around without separating the jobs.
```

---

## The last two happen at your desk

**Write a fifty-line tool with no AI help.** Read a file, transform the data, write a result. The warm-up in lesson 2 is a good start: do it again from a blank file, without looking.

**Walk an engineer through one of your tools.** Explain why it is structured as it is and what happens when an input is broken. The second prompt in this module lets Claude play the sceptical engineer for practice.
