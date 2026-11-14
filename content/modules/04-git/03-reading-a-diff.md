---
id: git-03
title: "Reading a diff: your review skill"
minutes: 8
recap: |
  A diff marks removed lines with `-`, added lines with `+`, and leaves context unmarked, so I can see every line an AI changed. I read it against the task I gave and question anything else: a changed comparison, a broadened `except`, a new default, a renamed key or a tidy-up nobody asked for.
---

## How to read a diff

```diff
--- a/checks.py
+++ b/checks.py
@@ -1,2 +1,5 @@
 def over_budget(assets, budget=9000):
-    return [...]
+    try:
```

- `---` is the file before, `+++` the file after.
- `@@ -1,2 +1,5 @@`: from line 1, two lines before became five after.
- `-` lines were removed, `+` lines added. Unmarked lines are context.

In these exercises, tap every changed line that is not needed for the task. Some diffs do exactly what was asked.

---

The source of most review practice: you asked an AI to make a function more robust. List every change in behaviour before you tap.

```exercise diff
id: git-03-robust-budget
task: "Make `over_budget` more robust."
diff: |
  --- a/checks.py
  +++ b/checks.py
  @@ -1,2 +1,5 @@
   def over_budget(assets, budget=9000):
  -    return [a["name"] for a in assets if a["tris"] > budget]
  +    try:
  +        return [a["name"] for a in assets if a["tris"] >= budget]
  +    except Exception:
  +        return []
flags:
  - '+        return [a["name"] for a in assets if a["tris"] >= budget]'
  - '+    except Exception:'
  - '+        return []'
explain: |
  1. **`>` became `>=`.** An asset exactly on budget is now reported as over. Nobody asked for that.
  2. **Every error now returns an empty list.** If the data is broken, the function reports "nothing is over budget". A failed check now looks like a pass, which is the worst outcome a check can have.

  The `try:` and the removed line are just the reshaping. Neither change above would be visible from running the tool on good data. Both are obvious in the diff. This is why you read diffs.
```

---

See both changes happen. One asset sits exactly on the budget, one has no triangle count at all.

```exercise predict
id: git-03-predict-budget
code: |
  def old(assets, budget=9000):
      return [a["name"] for a in assets if a["tris"] > budget]

  def new(assets, budget=9000):
      try:
          return [a["name"] for a in assets if a["tris"] >= budget]
      except Exception:
          return []

  on_budget = [{"name": "rock_01", "tris": 9000}]
  broken = [{"name": "tree_02"}]
  print(old(on_budget))
  print(new(on_budget))
  print(new(broken))
output: |
  []
  ['rock_01']
  []
explain: |
  The old version leaves `rock_01` alone, because 9000 is not greater than 9000. The new one flags it.

  For `broken`, `a["tris"]` raises `KeyError`, and the new version answers `[]`: the same as a clean pass. The old version would have stopped with the error, which is what you want from a check.
hint: Try `print(old(broken))` to see what the old version does with broken data.
```

---

```exercise choice
id: git-03-fourteen-files
tag: Judgement call
question: An AI session changed 14 files to add one feature. What do you do before committing?
options:
  - { id: run, text: "Run it once; if it works, commit everything" }
  - { id: read, text: "Read the diff file by file, and question or undo changes unrelated to the feature" }
  - { id: later, text: "Commit now and review later if something breaks" }
answer: read
explain: |
  Unrequested changes are where surprises live. `git diff` shows everything; `git restore path/to/file` throws away changes to a file you did not want touched.
```

---

```exercise diff
id: git-03-docstring
task: "Add a docstring to `total_tris`."
diff: |
  --- a/report.py
  +++ b/report.py
  @@ -1,5 +1,6 @@
   def total_tris(assets):
  +    """Add up the triangles of every asset."""
       total = 0
       for a in assets:
  -        total += a["tris"]
  +        total += a.get("tris", 0)
       return total
flags:
  - '-        total += a["tris"]'
  - '+        total += a.get("tris", 0)'
explain: |
  The docstring is the task. The `.get("tris", 0)` is not. Before, an asset with no triangle count stopped the report with a `KeyError`. Now it counts as zero, so a broken asset quietly lowers the total.

  `.get()` with a default is right when missing is normal. For a triangle count, missing means the data is broken, and you want to know.
```

---

```exercise diff
id: git-03-currency
task: "Show the £ sign in front of every price label."
diff: |
  --- a/catalogue.py
  +++ b/catalogue.py
  @@ -1,2 +1,2 @@
   def price_label(product):
  -    return f"{product['price']:.2f}"
  +    return f"£{product['price']:.2f}"
  @@ -4,5 +4,5 @@
   def to_row(product):
       return {
  -        "sku": product["sku"],
  +        "id": product["sku"],
           "label": price_label(product),
       }
flags:
  - '-        "sku": product["sku"],'
  - '+        "id": product["sku"],'
explain: |
  The first hunk is the task. The second renames the `"sku"` key to `"id"`. Anything that reads `row["sku"]`, such as the shop's stock sync or a CSV with a `sku` column, now fails or silently loses the column.

  A renamed key is a change to a contract other code depends on. It needs its own reason and its own commit.
```

---

```exercise diff
id: git-03-battery
task: "Print a warning when the rover's battery drops below 20 per cent."
diff: |
  --- a/rover.py
  +++ b/rover.py
  @@ -1,4 +1,6 @@
   def check_battery(level):
  +    if level < 20:
  +        print(f"Warning: battery at {level}%")
       if level < 5:
           return "return_to_dock"
       return "continue"
flags: []
explain: |
  This one does exactly what was asked. "Below 20" means `< 20`, the warning only prints, and the existing return-to-dock rule is untouched.

  Saying "this is fine" is part of reviewing too. Not every diff hides something, and a clean diff is quick to approve.
```

---

```exercise diff
id: git-03-while-here
task: "Fix the typo in the panel label: Exprot should read Export."
diff: |
  --- a/panel.py
  +++ b/panel.py
  @@ -3,7 +3,7 @@
   class EXPORT_PT_main(bpy.types.Panel):
  -    bl_label = "Exprot"
  +    bl_label = "Export"
       bl_space_type = "VIEW_3D"
       def draw(self, context):
  -        col = self.layout.column()
  -        col.prop(context.scene, "lod")
  -        col.operator("export.run")
  +        for name in ("lod", "path"):
  +            self.layout.prop(context.scene, name)
  +        self.layout.operator("export.run")
flags:
  - '-        col = self.layout.column()'
  - '-        col.prop(context.scene, "lod")'
  - '-        col.operator("export.run")'
  - '+        for name in ("lod", "path"):'
  - '+            self.layout.prop(context.scene, name)'
  - '+        self.layout.operator("export.run")'
explain: |
  The typo fix is one line. The rest is a "while I was here" rewrite of `draw`, and it is not neutral: it drops the column layout and adds a `path` field that was never on the panel.

  Even a harmless tidy-up makes the diff harder to review and mixes two ideas in one commit. Ask for it separately, or undo it.
```
