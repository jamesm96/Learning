---
id: bug-hunt-easy
title: Easy
minutes: 10
---

```exercise fix
id: bug-hunt-easy-first-three
symptom: "It should average the first three readings of the morning. The list it prints starts at 21.9, not 21.4."
code: |
  temps = [21.4, 21.9, 22.3, 22.8, 23.1]
  first_three = temps[1:4]
  print(first_three)
  average = sum(first_three) / len(first_three)
  print(round(average, 2))
check: |
  assert first_three == [21.4, 21.9, 22.3], f"first_three is {first_three}; it should be the first three readings."
  assert round(average, 2) == 21.87, f"The average is {round(average, 2)}; the first three readings average 21.87."
solution: |
  temps = [21.4, 21.9, 22.3, 22.8, 23.1]
  first_three = temps[0:3]
  print(first_three)
  average = sum(first_three) / len(first_three)
  print(round(average, 2))
cause:
  options:
    - { id: slice, text: "The slice starts at 1, but the first item is at index 0" }
    - { id: round, text: "`round` changes which readings are used" }
    - { id: len, text: "`len` counts one item too many" }
  answer: slice
explain: |
  Indexes start at 0, so `temps[1:4]` is the second, third and fourth readings. `temps[0:3]`, or just `temps[:3]`, is the first three. The slice stops before its end number, which is why `[:3]` gives exactly three items.

  The printed list gave it away: it did not start with the first value. Printing the slice before using it is the quickest check.
```

---

```exercise fix
id: bug-hunt-easy-free-delivery
symptom: "Delivery is free on orders of £50 or more. A basket of exactly £50.00 is still charged £4.95."
code: |
  FREE_FROM = 50.00

  def delivery(total):
      if total > FREE_FROM:
          return 0.00
      return 4.95

  print(delivery(39.00), delivery(50.00), delivery(89.50))
check: |
  assert delivery(50.00) == 0.00, "A £50.00 order qualifies for free delivery."
  assert delivery(49.99) == 4.95, "A £49.99 order is still charged £4.95."
  assert delivery(89.50) == 0.00, "A £89.50 order qualifies for free delivery."
solution: |
  FREE_FROM = 50.00

  def delivery(total):
      if total >= FREE_FROM:
          return 0.00
      return 4.95

  print(delivery(39.00), delivery(50.00), delivery(89.50))
cause:
  options:
    - { id: price, text: "The delivery charge of 4.95 is wrong" }
    - { id: operator, text: "`>` leaves out exactly £50; the rule needs `>=`" }
    - { id: float, text: "50.00 and 50.0 are different numbers in Python" }
  answer: operator
explain: |
  "£50 or more" includes £50 itself, so the test is `>=`. `>` and `>=` give the same answer for every value except the boundary, so a quick test with £39 and £89.50 looks fine.

  Whenever a rule says "or more", "up to" or "at least", test the boundary value itself. That one call, `delivery(50.00)`, shows the bug.
```

---

```exercise fix
id: bug-hunt-easy-text-stock
symptom: "Two warehouses hold 3 and 14 wool rugs. The total prints as 314."
code: |
  north = {"sku": "RUG-07", "stock": "3"}
  south = {"sku": "RUG-07", "stock": "14"}
  total = north["stock"] + south["stock"]
  print("RUG-07 in stock:", total)
check: |
  assert total == 17, f"total is {total!r}; 3 + 14 rugs is 17."
solution: |
  north = {"sku": "RUG-07", "stock": "3"}
  south = {"sku": "RUG-07", "stock": "14"}
  total = int(north["stock"]) + int(south["stock"])
  print("RUG-07 in stock:", total)
cause:
  options:
    - { id: text, text: "The counts are strings, so `+` joins them instead of adding" }
    - { id: sku, text: "Both rows have the same SKU, so one overwrites the other" }
    - { id: print, text: "`print` puts the two numbers side by side" }
  answer: text
explain: |
  `"3"` in quotes is text, and `+` on two strings joins them: `"3" + "14"` is `"314"`. Convert with `int()` before adding.

  This is what you get from a CSV file or a web form, where every value arrives as text. A total that is suspiciously long, or digits that look glued together, points straight at it. `print(repr(total))` would show the quotes.
```

---

```exercise fix
id: bug-hunt-easy-shadowed-sum
symptom: "TypeError: 'float' object is not callable, on the line that works out the average."
code: |
  prices = [39.00, 149.00, 89.50, 12.00]
  sum = 0
  for p in prices:
      sum += p
  average = sum(prices) / len(prices)
  print(sum, average)
check: |
  import builtins
  assert sum is builtins.sum, "The name sum should still mean Python's built-in sum function."
  assert average == 72.375, f"average is {average}; the four prices average 72.375."
solution: |
  prices = [39.00, 149.00, 89.50, 12.00]
  total = 0
  for p in prices:
      total += p
  average = sum(prices) / len(prices)
  print(total, average)
cause:
  options:
    - { id: len, text: "`len` cannot be used on a list of floats" }
    - { id: prices, text: "One of the prices is not a number" }
    - { id: shadow, text: "`sum = 0` replaced the built-in `sum` with a number" }
  answer: shadow
explain: |
  Naming a variable `sum` hides Python's own `sum` function for the rest of the file. By the average line, `sum` is the float 289.5, and `289.5(prices)` makes no sense, hence "not callable".

  The traceback points at the right line but not at the cause, which is three lines up. When a built-in suddenly "is not callable", look for a variable with the same name. `list`, `dict`, `id`, `type`, `max` and `input` get shadowed the same way.
```

---

```exercise fix
id: bug-hunt-easy-whole-division
symptom: "Average render time shows 44 seconds. Four frames took 177 seconds in all, which is 44.25 each."
code: |
  times = [42, 45, 44, 46]
  average = sum(times) // len(times)
  print("Average seconds per frame:", average)
check: |
  assert average == 44.25, f"average is {average}; 177 / 4 is 44.25."
solution: |
  times = [42, 45, 44, 46]
  average = sum(times) / len(times)
  print("Average seconds per frame:", average)
cause:
  options:
    - { id: floor, text: "`//` drops the remainder; an average needs `/`" }
    - { id: sum, text: "`sum` rounds whole numbers down" }
    - { id: ints, text: "The times must be written as 42.0, 45.0 and so on" }
  answer: floor
explain: |
  `//` is floor division: it divides and throws away the remainder, so `177 // 4` is 44. `/` is true division and gives 44.25, even when both numbers are whole.

  Over a 2,000-frame shot, losing a quarter of a second per frame hides more than eight minutes. A result that is always a suspiciously round number is the clue.
```

---

```exercise fix
id: bug-hunt-easy-zero-angle
symptom: "The robot's elbow is straight, at exactly 0.0 degrees. The report says the elbow has no reading."
code: |
  joints = {"shoulder": 35.0, "elbow": 0.0, "wrist": None}
  missing = []
  for name, angle in joints.items():
      if not angle:
          missing.append(name)
  print("no reading:", missing)
check: |
  assert missing == ["wrist"], f"missing is {missing}; only the wrist has no reading."
solution: |
  joints = {"shoulder": 35.0, "elbow": 0.0, "wrist": None}
  missing = []
  for name, angle in joints.items():
      if angle is None:
          missing.append(name)
  print("no reading:", missing)
cause:
  options:
    - { id: dict, text: "A dictionary cannot hold `None`" }
    - { id: falsy, text: "`not angle` is true for `None` and also for `0.0`" }
    - { id: order, text: "The loop visits the joints in the wrong order" }
  answer: falsy
explain: |
  `not` treats `None`, `0`, `0.0`, `""` and `[]` all as "nothing". An angle of zero is a real measurement, so ask the exact question: `if angle is None`.

  When a valid value of zero is reported as missing, look for a bare `if not x` or `if x:`. Generated code uses them often because they read naturally.
```

---

```exercise fix
id: bug-hunt-easy-json-mode
symptom: "FileNotFoundError: settings.json. The script is meant to create that file."
code: |
  import json

  data = {"project": "harbour", "version": 4}
  with open("settings.json") as f:
      json.dump(data, f, indent=2)
check: |
  import json
  with open("settings.json", encoding="utf-8") as f:
      saved = json.load(f)
  assert saved == {"project": "harbour", "version": 4}, "settings.json should hold the saved settings."
solution: |
  import json

  data = {"project": "harbour", "version": 4}
  with open("settings.json", "w", encoding="utf-8") as f:
      json.dump(data, f, indent=2)
cause:
  options:
    - { id: mode, text: "`open` without a mode opens for reading, which needs the file to exist" }
    - { id: indent, text: "`indent=2` is not allowed when writing" }
    - { id: dump, text: "`json.dump` can only write lists" }
  answer: mode
explain: |
  `open(path)` means `open(path, "r")`: read an existing file. To create or replace one, pass `"w"`. Had the file existed, the error would have been `UnsupportedOperation: not writable` instead.

  The traceback names the `open` line, which is the right place. Any `open` that writes needs a `"w"` or `"a"`, and `encoding="utf-8"` so the file reads the same on every machine.
```
