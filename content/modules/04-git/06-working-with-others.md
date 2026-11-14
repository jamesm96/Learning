---
id: git-06
title: Working with others, and being seen
minutes: 8
recap: |
  On a team I push a branch and open a pull request, a page showing my diff where colleagues comment before it is merged, and reviewing others' changes is ordinary daily work. A public repository with a clear README and a tidy history shows how I think better than a line on a CV.
---

## Pull requests

On a team you push a branch and open a **pull request**: a page showing your diff, where colleagues comment before it is merged.

Giving and receiving that review is ordinary daily work for engineers, and it is where you will learn fastest. A good review comment names the line, says what it changes, and asks a question: "This drops the speed check. Was that intended?"

Never force-push a branch others are working on. It replaces their history with yours, and their commits can vanish from the server.

---

Four pull requests to review. First, a robot arm controller.

```exercise diff
id: git-06-type-hints
task: "Add type hints to `set_speed`."
diff: |
  --- a/arm.py
  +++ b/arm.py
  @@ -1,5 +1,3 @@
  -def set_speed(joint, speed):
  -    if speed > MAX_SPEED:
  -        raise ValueError(f"{speed} too fast")
  +def set_speed(joint: str, speed: float) -> None:
       motors[joint].speed = speed
       log(joint, speed)
flags:
  - '-    if speed > MAX_SPEED:'
  - '-        raise ValueError(f"{speed} too fast")'
explain: |
  The new signature is the task. Deleting the speed check is not, and on a physical arm it is a safety problem: any speed now goes straight to the motor.

  Deleted lines are the easiest to miss, because there is nothing new to read. Look at every `-` line and ask what it used to protect.
```

---

A ComfyUI batch script.

```exercise diff
id: git-06-seed-arg
task: "Let `run_batch` take an optional `seed` argument."
diff: |
  --- a/batch.py
  +++ b/batch.py
  @@ -1,6 +1,7 @@
   def run_batch(
       prompts,
  -    steps=20,
  +    steps=30,
  +    seed=None,
   ):
       for p in prompts:
  -        queue(p, steps=steps)
  +        queue(p, steps=steps, seed=seed)
flags:
  - '-    steps=20,'
  - '+    steps=30,'
explain: |
  Adding `seed=None` and passing it on is the task. Changing the default from 20 to 30 steps is not. Every caller that relied on the default now takes half as long again per image, and results no longer match earlier batches.

  Changed defaults are quiet: no caller's code changes, but every caller's behaviour does.
```

---

A sensor dashboard.

```exercise diff
id: git-06-decimals
task: "Show temperatures with one decimal place instead of two."
diff: |
  --- a/sensors.py
  +++ b/sensors.py
  @@ -1,4 +1,4 @@
   def reading_label(r):
  -    value = r["temp_c"]
  -    unit = "°C"
  -    return f"{value:.2f} {unit}"
  +    value = r["temp_c"] * 9 / 5 + 32
  +    unit = "°F"
  +    return f"{value:.1f} {unit}"
flags:
  - '-    value = r["temp_c"]'
  - '-    unit = "°C"'
  - '+    value = r["temp_c"] * 9 / 5 + 32'
  - '+    unit = "°F"'
explain: |
  `.2f` to `.1f` is the task. Converting to Fahrenheit is not. The label still looks reasonable, so nobody notices until a reading of 71.6 is compared with an alarm threshold set in Celsius.

  Units and rounding changes look like formatting. They are changes to what the number means.
```

---

An online shop's catalogue builder.

```exercise diff
id: git-06-in-stock
task: "Leave out products that are not in stock when building the catalogue."
diff: |
  --- a/catalogue.py
  +++ b/catalogue.py
  @@ -1,5 +1,7 @@
   def build(products):
       rows = []
       for p in products:
  +        if not p["in_stock"]:
  +            continue
           rows.append(to_row(p))
       return rows
flags: []
explain: |
  Exactly the task, and nothing else. `continue` skips to the next product, and every in-stock product is still added as before.

  You might still ask whether `in_stock` is always present. That is a question for the data, not a change beyond the task.
```

---

You have reviewed the branch and it is good. You are on main.

```exercise git
id: git-06-merge
task: "Bring the work on `fix-export-path` into main."
start:
  commits:
    - message: Add exporter
      files:
        export.py: "OUT = 'C:/temp/out'"
  branches:
    - name: fix-export-path
      commits:
        - message: Read export folder from settings
          files:
            export.py: "OUT = settings['out_dir']"
goal:
  - branch: main
  - merged: fix-export-path
  - committed: { export.py: "OUT = settings['out_dir']" }
solution:
  - git merge fix-export-path
explain: |
  Main had not moved since the branch was made, so Git simply moved main forward to the branch's latest commit. That is a fast-forward: no merge commit is needed.

  On a team this happens on the pull request page, with a button, once the review is approved. Afterwards `git branch -d fix-export-path` tidies up.
```

---

## Being seen

A public GitHub profile is also your proof. One small tool with a clear README (what it does, why it exists, how to run it) and a tidy commit history shows more than a line on a CV.

It lets someone who has never met you see how you think.

---

```exercise choice
id: git-06-profile
tag: Judgement call
question: Which public repository tells a hiring manager most about you?
options:
  - { id: small, text: "One small tool with a README and a history of clear, one-idea commits" }
  - { id: big, text: "A large project with one commit called \"initial upload\"" }
  - { id: many, text: "Twenty copies of other people's projects, unchanged" }
answer: small
explain: |
  A reader can open the README, see what problem you solved and why, then read the history to see how you worked. A single huge commit hides all of that, and unchanged copies say nothing about you.
```
