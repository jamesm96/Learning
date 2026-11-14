---
id: data-04
title: "Dictionaries: things by name"
minutes: 7
---

A dictionary stores values under keys. Where a list answers "what is third?", a dictionary answers "what is the triangle count?".

This is the single most important structure in pipeline work.

```python
asset = {"name": "rock_01", "tris": 4820}
```

---

```exercise predict
id: data-04-predict-asset
code: |
  asset = {"name": "rock_01", "tris": 4820, "materials": ["moss", "stone"]}

  print(asset["tris"])
  print(asset.get("lod", 0))

  asset["tris"] = 2400
  asset["exported"] = True

  for key, value in asset.items():
      print(key, "->", value)
output: |
  4820
  0
  name -> rock_01
  tris -> 2400
  materials -> ['moss', 'stone']
  exported -> True
explain: |
  `.get("lod", 0)` found no `"lod"` key and returned the fallback, 0. Setting `"tris"` replaced its value; setting `"exported"` added a new key at the end. Dictionaries keep the order keys were added.
hint: Try `print(asset["lod"])`.
```

---

## Two ways to read a key

`asset["lod"]` raises `KeyError` if the key is missing.

`asset.get("lod", 0)` returns the fallback instead.

The difference matters. Use square brackets when a missing key means something is broken and you want to know. Use `.get()` when missing is normal.

---

```exercise choice
id: data-04-get-hides
tag: Judgement call
question: 'An exporter reads `asset.get("path", "")` and then writes the file. One asset has no path. What happens?'
options:
  - { id: keyerror, text: "It stops with a clear KeyError" }
  - { id: skips, text: "It skips that asset" }
  - { id: later, text: "It carries on with an empty path and fails later, somewhere confusing" }
answer: later
explain: |
  The fallback hid the real problem. Here a missing path is a broken asset, so square brackets (or an explicit check with a clear message) is the better choice.

  Watch for `.get()` with a made-up default in AI-written code: it often trades a clear early error for a strange late one.
```

---

```exercise choice
id: data-04-missing-key
question: '`product = {"sku": "LAMP-01", "price": 39.0}`. What does `product["stock"]` do?'
options:
  - { id: keyerror, text: "Raises a KeyError" }
  - { id: none, text: "Gives `None`" }
  - { id: zero, text: "Gives `0`" }
answer: keyerror
explain: |
  Square brackets demand the key exists. Python never invents a value for you; that only happens when you ask for one with `.get()`.
```

---

```exercise cloze
id: data-04-cloze-items
prompt: Loop over both the keys and the values.
code: |
  for key, value in asset.___():
      print(key, value)
blanks:
  - { options: ["items", "keys", "values"], answer: "items" }
explain: |
  `.items()` gives each key and value as a pair, which the loop splits into `key` and `value`. `.keys()` gives only the keys, and `.values()` only the values.
```

---

Here `.get()` with a default is exactly right, because a material not seen yet is normal.

```exercise predict
id: data-04-predict-count
code: |
  counts = {}
  for material in ["metal", "wood", "metal"]:
      counts[material] = counts.get(material, 0) + 1
  print(counts)
output: |
  {'metal': 2, 'wood': 1}
explain: |
  The first time a material appears, `.get()` returns 0, so it is stored as 1. The second `"metal"` finds 1 and stores 2. Counting with a dictionary like this is one of the most common patterns you will read.
```
