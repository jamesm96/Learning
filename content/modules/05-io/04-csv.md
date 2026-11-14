---
id: io-04
title: "CSV: tables"
minutes: 8
recap: |
  `csv.DictReader` turns each row of a spreadsheet export into a dictionary keyed by the column headings, and `DictWriter` writes rows back out. Everything read from a CSV is a string, including numbers and empty cells, so I convert each value to the right type at the moment I read it.
---

Spreadsheets export CSV, so it is how data reaches you from producers, clients and other departments: asset lists, product catalogues, sensor logs.

`csv.DictReader` turns each row into a dictionary keyed by the column headings, which puts you straight back in Module 1.

```python
import csv

with open("assets.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
```

`newline=""` lets the `csv` module handle line endings itself, which it needs to read cells that contain line breaks.

---

```exercise predict
id: io-04-predict-rows
code: |
  import csv

  with open("assets.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  print(len(rows))
  print(rows[0])
  print(repr(rows[3]["tris"]))
output: |
  4
  {'name': 'rock_01', 'type': 'prop', 'tris': '4820', 'material': 'stone'}
  ''
explain: |
  The heading line becomes the keys, so there are four rows of data, not five. Every value is a string, even `'4820'`. The lamp has no triangle count, and an empty cell arrives as an empty string, not `None` and not 0.
```

---

```exercise choice
id: io-04-why-int
question: 'In `[r["name"] for r in rows if int(r["tris"]) > 9000]`, why is `int(...)` needed?'
options:
  - { id: special, text: "CSV files store numbers in a special format" }
  - { id: strings, text: "Everything read from a CSV is a string" }
  - { id: faster, text: "It makes the comparison faster" }
answer: strings
explain: |
  CSV is plain text with no types. `"4820" > 9000` is an error, and `"4820" > "9000"` compares alphabetically. Convert at the moment you read the data.
```

---

Comparing strings that look like numbers does not fail. That is the danger.

```exercise predict
id: io-04-predict-compare
code: |
  print("4820" > "18250")
  print(int("4820") > int("18250"))
  print(sorted(["9100", "18250", "4820"]))
output: |
  True
  False
  ['18250', '4820', '9100']
explain: |
  Strings compare character by character, like words in a dictionary. `"4"` comes after `"1"`, so `"4820"` counts as bigger than `"18250"`. A "top ten heaviest assets" report built on strings is quietly wrong.
```

---

The stock report from the shop's catalogue fails on the first row.

```exercise fix
id: io-04-fix-prices
symptom: "`TypeError: can't multiply sequence by non-int of type 'str'`"
code: |
  import csv

  with open("products.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  total = 0
  for row in rows:
      total += row["price"] * row["stock"]
  print("stock value:", total)
check: |
  assert total == 1306.5, f"total is {total!r}; the stock is worth 1306.5."
solution: |
  import csv

  with open("products.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  total = 0
  for row in rows:
      total += float(row["price"]) * int(row["stock"])
  print("stock value:", total)
cause:
  options:
    - { id: strings, text: "Price and stock are both strings, so they need converting before the maths" }
    - { id: header, text: "The heading row is being read as a product" }
    - { id: total, text: "`total` should start as `0.0`" }
  answer: strings
explain: |
  `"39.00" * "14"` asks Python to repeat a string a string number of times, which makes no sense. Prices are decimals, so `float`; stock is a count, so `int`.

  Real money code often uses `decimal.Decimal` instead of `float`, because floats cannot hold every price exactly. For a stock report, `float` is fine.
```

---

## Writing a table

```python
with open("heavy.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "tris"])
    writer.writeheader()
    writer.writerow({"name": "crane_02", "tris": 18250})
```

`fieldnames` sets the columns and their order. `writeheader()` writes the heading line. Numbers are turned into text for you.

---

```exercise edit
id: io-04-write-heavy
goal: 'Write `heavy.csv` with columns `name` and `tris`, holding only the assets over 9000 triangles. Skip the asset with no count.'
code: |
  import csv

  with open("assets.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  heavy = []
  for row in rows:
      heavy.append({"name": row["name"], "tris": row["tris"]})
check: |
  import csv
  from pathlib import Path
  assert Path("heavy.csv").exists(), "heavy.csv has not been written yet."
  with open("heavy.csv", newline="", encoding="utf-8") as f:
      back = list(csv.DictReader(f))
  assert [r["name"] for r in back] == ["crane_02", "boat_01"], f"heavy.csv lists {[r['name'] for r in back]}; it should list crane_02 and boat_01."
  assert list(back[0]) == ["name", "tris"], "The columns should be name and tris, in that order."
solution: |
  import csv

  with open("assets.csv", newline="", encoding="utf-8") as f:
      rows = list(csv.DictReader(f))

  heavy = []
  for row in rows:
      if row["tris"] and int(row["tris"]) > 9000:
          heavy.append({"name": row["name"], "tris": row["tris"]})

  with open("heavy.csv", "w", newline="", encoding="utf-8") as f:
      writer = csv.DictWriter(f, fieldnames=["name", "tris"])
      writer.writeheader()
      writer.writerows(heavy)
explain: |
  `row["tris"] and ...` skips the empty string before `int` sees it, because `int("")` raises `ValueError`. `writerows` writes the whole list in one call.

  Skipping is fine for this report. In a tool that must handle every asset, a missing count should be reported, not dropped; that is the last lesson of this module.
```
