---
id: bug-hunt-hard
title: Hard
minutes: 10
---

```exercise fix
id: bug-hunt-hard-swallowed
symptom: "The nightly budget report says 'none'. crane_02, at 18250 triangles, was added to the scene yesterday."
files:
  scene.json: |
    {"assets": [
      {"name": "rock_01", "tris": 4820},
      {"name": "crane_02", "tris": 18250},
    ]}
code: |
  import json
  from pathlib import Path

  BUDGET = 10000

  def load_assets(path):
      try:
          text = Path(path).read_text(encoding="utf-8")
          return json.loads(text)["assets"]
      except Exception:
          return []

  def over_budget(assets):
      return [a["name"] for a in assets
              if a["tris"] > BUDGET]

  try:
      found = over_budget(load_assets("scene.json"))
      print("over budget:", found or "none")
  except ValueError as e:
      print("stopped:", e)
check: |
  from pathlib import Path
  try:
      load_assets("scene.json")
  except ValueError:
      pass
  else:
      raise AssertionError("load_assets should raise an error for a file that is not valid JSON, not return an empty list.")
  Path("good.json").write_text('{"assets": [{"name": "crane_02", "tris": 18250}]}', encoding="utf-8")
  assert over_budget(load_assets("good.json")) == ["crane_02"], "A valid file should still load and report crane_02."
solution: |
  import json
  from pathlib import Path

  BUDGET = 10000

  def load_assets(path):
      text = Path(path).read_text(encoding="utf-8")
      return json.loads(text)["assets"]

  def over_budget(assets):
      return [a["name"] for a in assets
              if a["tris"] > BUDGET]

  try:
      found = over_budget(load_assets("scene.json"))
      print("over budget:", found or "none")
  except ValueError as e:
      print("stopped:", e)
cause:
  options:
    - { id: budget, text: "`>` should be `>=`, so crane_02 slips under the budget" }
    - { id: swallowed, text: "`except Exception: return []` turned a broken file into an empty, tidy scene" }
    - { id: path, text: "`Path.read_text` cannot read JSON files" }
  answer: swallowed
explain: |
  `scene.json` has a trailing comma after the last asset, which JSON does not allow. `json.loads` raised a clear `JSONDecodeError`, and the bare `except Exception` threw it away and reported an empty scene. An empty scene has nothing over budget, so the report looked healthy.

  The tell is a result that is too good: "none" on the day someone added an 18,250-triangle crane. Deleting the `try` lets the real error through, and since `JSONDecodeError` is a kind of `ValueError`, the existing handler prints it with the line and column. Catch only the errors you can genuinely handle, and never answer a failure with a made-up result.
```

---

```exercise fix
id: bug-hunt-hard-path-join
symptom: "The export check says rock_01 and crane_02 are missing from the manifest. Both are listed in it, under props."
code: |
  import json

  def asset_path(folder, name):
      return folder + "/" + name + ".fbx"

  def unlisted(manifest, folders):
      listed = {a["path"] for a in manifest["assets"]}
      bad = []
      for a in manifest["assets"]:
          p = asset_path(folders[a["type"]], a["name"])
          if p not in listed:
              bad.append(a["name"])
      return bad

  with open("manifest.json", encoding="utf-8") as f:
      manifest = json.load(f)
  folders = {"prop": "props/", "vehicle": "vehicles"}
  print("not in manifest:", unlisted(manifest, folders))
check: |
  from pathlib import Path
  result = unlisted(manifest, folders)
  assert result == [], f"unlisted reports {result}; every asset is in the manifest."
  got = str(asset_path("props/", "rock_01"))
  assert got == str(Path("props") / "rock_01.fbx"), f"asset_path gave {got!r}; a trailing slash on the folder should not double up."
solution: |
  import json
  from pathlib import Path

  def asset_path(folder, name):
      return Path(folder) / f"{name}.fbx"

  def unlisted(manifest, folders):
      listed = {Path(a["path"]) for a in manifest["assets"]}
      bad = []
      for a in manifest["assets"]:
          p = asset_path(folders[a["type"]], a["name"])
          if p not in listed:
              bad.append(a["name"])
      return bad

  with open("manifest.json", encoding="utf-8") as f:
      manifest = json.load(f)
  folders = {"prop": "props/", "vehicle": "vehicles"}
  print("not in manifest:", unlisted(manifest, folders))
cause:
  options:
    - { id: join, text: 'Joining by hand with `"/"` gave `props//rock_01.fbx`, which never matches `props/rock_01.fbx`' }
    - { id: type, text: "rock_01 and crane_02 have the wrong type in the manifest" }
    - { id: set, text: "A set cannot be searched with `in`" }
  answer: join
explain: |
  The folder for props was written as `"props/"`, with a trailing slash, so `folder + "/" + name` produced a double slash. As text, `props//rock_01.fbx` and `props/rock_01.fbx` are different, so the check failed for both props and passed for the boat, whose folder had no slash.

  The pattern in the symptom is the clue: every asset in one folder fails and the others pass. Printing `p` and the listed paths side by side shows the doubled slash at once. `Path(folder) / name` handles slashes for you, and comparing `Path` objects rather than strings means `props/` and `props` are treated as the same folder.
```

---

```exercise fix
id: bug-hunt-hard-timeout
symptom: "It runs in a second at your desk. On the drone test rig's nightly job it once sat for six hours, printing nothing, until someone stopped it."
code: |
  from simulated import requests

  URL = "https://weather.example/v1/current"

  def fetch_weather(city):
      reply = requests.get(URL, params={"city": city})
      reply.raise_for_status()
      return reply.json()

  def safe_to_fly(city, max_wind=15):
      weather = fetch_weather(city)
      return weather["wind_kph"] <= max_wind

  for city in ["Lisbon", "Leeds"]:
      print(city, "fly" if safe_to_fly(city) else "ground")
check: |
  seen = []
  real_get = requests.get
  def spy(url, params=None, timeout=None):
      seen.append(timeout)
      return real_get(url, params=params, timeout=timeout)
  requests.get = spy
  try:
      fetch_weather("Leeds")
  finally:
      requests.get = real_get
  assert seen and seen[0] is not None, "requests.get should be given a timeout, so a silent server cannot hang the job."
  assert safe_to_fly("Lisbon") is True, "Lisbon, at 9 km/h of wind, is safe to fly."
  assert safe_to_fly("Leeds") is False, "Leeds, at 18 km/h of wind, is not."
solution: |
  from simulated import requests

  URL = "https://weather.example/v1/current"

  def fetch_weather(city):
      reply = requests.get(URL, params={"city": city},
                           timeout=10)
      reply.raise_for_status()
      return reply.json()

  def safe_to_fly(city, max_wind=15):
      weather = fetch_weather(city)
      return weather["wind_kph"] <= max_wind

  for city in ["Lisbon", "Leeds"]:
      print(city, "fly" if safe_to_fly(city) else "ground")
cause:
  options:
    - { id: wind, text: "`<=` should be `<`, so a wind of exactly 15 km/h is treated as safe" }
    - { id: status, text: "`raise_for_status` waits for the server to recover" }
    - { id: timeout, text: "`requests.get` has no `timeout`, so it waits forever for a server that never answers" }
  answer: timeout
explain: |
  Without `timeout`, `requests.get` waits as long as it takes. A server that accepts the connection and then says nothing, which happens on flaky networks, leaves the job hanging with no error and no output. With `timeout=10`, the same situation raises `requests.Timeout` after ten seconds, and the job fails loudly.

  Nothing in a traceback can show this, because there is no traceback. The habit is the check: every network call in a script that runs unattended needs a `timeout`. This uses the course's simulated `requests`, which always answers; on a computer, `pip install requests` gives the real library with the same calls.
```

---

```exercise fix
id: bug-hunt-hard-empty-subfolder
symptom: "The ComfyUI job finished, but the script cannot find the image it made. ComfyUI saved it in the output folder."
code: |
  from pathlib import Path
  from simulated import requests

  COMFY = "http://127.0.0.1:8188"

  def first_image(prompt_id):
      url = f"{COMFY}/history/{prompt_id}"
      reply = requests.get(url, timeout=5)
      reply.raise_for_status()
      outputs = reply.json()[prompt_id]["outputs"]
      return outputs["9"]["images"][0]

  def image_path(image):
      sub = image["subfolder"]
      if not sub:
          sub = "temp"
      return Path("output") / sub / image["filename"]

  print(image_path(first_image("a1b2c3d4")))
check: |
  from pathlib import Path
  got = image_path(first_image("a1b2c3d4"))
  assert Path(got) == Path("output/ComfyUI_00001_.png"), f"image_path gave {got}; the image is directly in output."
  faces = image_path({"subfolder": "faces", "filename": "a.png"})
  assert Path(faces) == Path("output/faces/a.png"), "A real subfolder should still be used."
solution: |
  from pathlib import Path
  from simulated import requests

  COMFY = "http://127.0.0.1:8188"

  def first_image(prompt_id):
      url = f"{COMFY}/history/{prompt_id}"
      reply = requests.get(url, timeout=5)
      reply.raise_for_status()
      outputs = reply.json()[prompt_id]["outputs"]
      return outputs["9"]["images"][0]

  def image_path(image):
      sub = image["subfolder"]
      return Path("output") / sub / image["filename"]

  print(image_path(first_image("a1b2c3d4")))
cause:
  options:
    - { id: history, text: "The history request returns the wrong prompt" }
    - { id: images, text: "`[0]` picks the wrong image from the list" }
    - { id: empty, text: '`if not sub` treats the valid empty subfolder `""` as missing' }
  answer: empty
explain: |
  ComfyUI reports `"subfolder": ""` for an image saved directly in `output`. An empty string is a real answer meaning "no subfolder", but `if not sub` treats it as missing and swaps in `temp`, a folder the image was never in.

  Printing `image` from `first_image` shows `'subfolder': ''`, and the printed path shows the invented `temp`. `Path("output") / ""` is just `output`, so no special case is needed. If a key really could be absent, test for that exactly, with `is None` or `in`. This uses the course's simulated `requests`; on a computer, `pip install requests` gives the real library with the same calls.
```

---

```exercise fix
id: bug-hunt-hard-text-price
symptom: "The 'premium pick' banner features the wool rug at 89.50. The shop sells a chair that costs more."
code: |
  import csv

  def load(path):
      with open(path, newline="", encoding="utf-8") as f:
          return list(csv.DictReader(f))

  def priciest(rows):
      best = rows[0]
      for r in rows[1:]:
          if r["price"] > best["price"]:
              best = r
      return best

  rows = load("products.csv")
  top = priciest(rows)
  print("Premium pick:", top["name"], top["price"])
check: |
  top = priciest(load("products.csv"))
  assert top["sku"] == "CHAIR-OAK-120", f"priciest chose {top['sku']}; the oak chair, at 149.00, costs most."
  small = priciest([{"sku": "A", "price": "9.00"}, {"sku": "B", "price": "10.00"}])
  assert small["sku"] == "B", "10.00 is more than 9.00."
solution: |
  import csv

  def load(path):
      with open(path, newline="", encoding="utf-8") as f:
          return list(csv.DictReader(f))

  def priciest(rows):
      best = rows[0]
      for r in rows[1:]:
          if float(r["price"]) > float(best["price"]):
              best = r
      return best

  rows = load("products.csv")
  top = priciest(rows)
  print("Premium pick:", top["name"], top["price"])
cause:
  options:
    - { id: text, text: 'The prices are text, so `"89.50" > "149.00"` compares them letter by letter' }
    - { id: skip, text: "`rows[1:]` skips the chair" }
    - { id: newline, text: '`newline=""` drops the last row of the file' }
  answer: text
explain: |
  `csv` gives every value as a string. Strings compare character by character, like words in a dictionary: `"8"` comes after `"1"`, so `"89.50"` beats `"149.00"`. Convert with `float()` before comparing.

  The loop and the slice look right, which is why this survives a glance. The clue is that the winner is plausible but not the biggest. `print(repr(rows[0]["price"]))` shows the quotes. Better still, convert each column once, straight after loading, so no later function has to remember.
```

---

```exercise fix
id: bug-hunt-hard-early-return
symptom: "The pre-commit check says 'OK to commit' for the harbour scene. A reviewer then found an asset at 18250 triangles."
code: |
  import json

  BUDGET = 10000

  def load(path):
      with open(path, encoding="utf-8") as f:
          return json.load(f)["assets"]

  def all_within_budget(assets):
      for a in assets:
          if a["tris"] > BUDGET:
              return False
          else:
              return True

  if all_within_budget(load("manifest.json")):
      print("OK to commit")
  else:
      print("Over budget: fix before committing")
check: |
  assets = load("manifest.json")
  assert all_within_budget(assets) is False, "crane_02 is over budget, so the scene is not within budget."
  assert all_within_budget([{"tris": 100}, {"tris": 200}]) is True, "Two small assets are within budget."
  assert all_within_budget([]) is True, "An empty scene has nothing over budget."
solution: |
  import json

  BUDGET = 10000

  def load(path):
      with open(path, encoding="utf-8") as f:
          return json.load(f)["assets"]

  def all_within_budget(assets):
      for a in assets:
          if a["tris"] > BUDGET:
              return False
      return True

  if all_within_budget(load("manifest.json")):
      print("OK to commit")
  else:
      print("Over budget: fix before committing")
cause:
  options:
    - { id: load, text: "`load` reads only the first asset from the manifest" }
    - { id: early, text: "The `else: return True` ends the function after the first asset" }
    - { id: budget, text: "The budget should be compared with `>=`" }
  answer: early
explain: |
  `return` leaves the function at once. Whichever branch runs, the loop stops after the first asset, `rock_01`, which happens to be within budget. `crane_02` is never looked at. "All within budget" can only be known after the loop, so `return True` goes after it, outside the `for`.

  The if/else looks balanced, which is why it reads as correct. A quick test catches it: put the over-budget asset second. Printing each name inside the loop would also show only one name.
```

---

```exercise fix
id: bug-hunt-hard-frame-chunks
symptom: "The render farm reports every job done, but the shot ends one frame early."
code: |
  def chunks(first, last, size):
      """Split frames first..last (inclusive) into jobs."""
      jobs = []
      start = first
      while start < last:
          end = min(start + size - 1, last)
          jobs.append((start, end))
          start = end + 1
      return jobs

  def frame_count(jobs):
      return sum(e - s + 1 for s, e in jobs)

  jobs = chunks(1, 241, 60)
  print(jobs)
  print("frames:", frame_count(jobs))
check: |
  jobs = chunks(1, 241, 60)
  assert frame_count(jobs) == 241, f"The jobs cover {frame_count(jobs)} frames; 1 to 241 is 241."
  assert jobs[-1] == (241, 241), f"The last job is {jobs[-1]}; frame 241 needs a job of its own."
  assert chunks(5, 5, 10) == [(5, 5)], "A one-frame shot should still give one job."
solution: |
  def chunks(first, last, size):
      """Split frames first..last (inclusive) into jobs."""
      jobs = []
      start = first
      while start <= last:
          end = min(start + size - 1, last)
          jobs.append((start, end))
          start = end + 1
      return jobs

  def frame_count(jobs):
      return sum(e - s + 1 for s, e in jobs)

  jobs = chunks(1, 241, 60)
  print(jobs)
  print("frames:", frame_count(jobs))
cause:
  options:
    - { id: end, text: "`start + size - 1` makes each job one frame too short" }
    - { id: while, text: "`start < last` stops before a job that starts on the last frame" }
    - { id: count, text: "`frame_count` adds one frame too many to each job" }
  answer: while
explain: |
  The range is inclusive: frame 241 must be rendered. After four jobs of 60, `start` is 241, and `241 < 241` is false, so the loop ends without a job for it. `<=` keeps going while there is any frame left.

  Every job reported success, because every job that existed did succeed. Printing `jobs` shows the last one ending at 240, and `frame_count` gives 240 for a 241-frame shot. Inclusive ranges are where `<` and `<=` swap places most often. Test sizes that do not divide evenly, and the one-frame case.
```
