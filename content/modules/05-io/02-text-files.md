---
id: io-02
title: Reading and writing text
minutes: 7
recap: |
  `read_text` and `write_text` handle a whole file at once, and a `with open(...)` block opens a file and guarantees it is closed, with the mode saying read, write and replace, or add to the end. I always pass `encoding="utf-8"`, because otherwise the same file can read differently on someone else's computer.
---

The shortest way to read or write a whole text file is on `Path` itself.

```python
from pathlib import Path

notes = Path("notes.txt")
text = notes.read_text(encoding="utf-8")
Path("out.txt").write_text("done\n", encoding="utf-8")
```

`write_text` replaces whatever was in the file. `\n` is the end of a line; you add it yourself.

---

```exercise predict
id: io-02-predict-notes
code: |
  from pathlib import Path

  text = Path("notes.txt").read_text(encoding="utf-8")
  lines = text.splitlines()
  print(len(lines))
  print(lines[0])
  for line in lines[1:]:
      print(line.removeprefix("- ").split()[0])
output: |
  4
  Harbour level notes
  crane_02
  boat_01
  lamp_03
explain: |
  `splitlines()` cuts the text at each line break and drops the breaks. The first line is a heading; each later line starts with `- `, so removing that prefix and taking the first word gives the asset name.
hint: 'Try `print(repr(text))` to see the `\n` characters.'
```

---

## The `with` block

```python
with open("log.txt", "a", encoding="utf-8") as f:
    f.write("exported rock_01\n")
```

`with` opens the file and guarantees it is closed afterwards, even if an error happens inside. An unclosed file may not have all its data written yet.

The second argument is the mode: `"r"` read, `"w"` write and replace, `"a"` add to the end.

---

```exercise cloze
id: io-02-cloze-append
prompt: Add a line to the end of the log, keeping what is already there.
code: |
  with open("log.txt", ___, encoding="utf-8") as f:
      f.write("exported boat_01\n")
blanks:
  - { options: ['"a"', '"w"', '"r"'], answer: '"a"' }
explain: |
  `"a"` appends. `"w"` would wipe the log first, and `"r"` opens for reading only, so `write` would fail.
```

---

```exercise predict
id: io-02-predict-modes
code: |
  from pathlib import Path

  with open("log.txt", "w", encoding="utf-8") as f:
      f.write("exported rock_01\n")
  with open("log.txt", "w", encoding="utf-8") as f:
      f.write("exported crane_02\n")
  with open("log.txt", "a", encoding="utf-8") as f:
      f.write("exported boat_01\n")

  print(Path("log.txt").read_text(encoding="utf-8"), end="")
output: |
  exported crane_02
  exported boat_01
explain: |
  The second `"w"` replaced the file, so `rock_01` is gone. The `"a"` added to the end. A log opened with `"w"` by mistake keeps only the last run, which is easy to miss until you need the history.
```

---

## Always say the encoding

Pass `encoding="utf-8"` on every read and write. Without it, Python uses the computer's default, and on Windows that may not be UTF-8.

Plain English text survives either way, which is why the bug hides. Names with accents or non-Latin characters, such as `Café_Chair` or `椅子`, get corrupted on someone else's machine.

---

```exercise choice
id: io-02-encoding
question: 'Your tool on a Mac writes product names with `open(path, "w")`. A colleague''s tool on Windows reads the file with `open(path)`, and `Café` comes out as `CafÃ©`. What is the most likely cause?'
options:
  - { id: encoding, text: "No encoding was given, so the two computers used different defaults" }
  - { id: windows, text: "Windows cannot store accented letters in files" }
  - { id: mode, text: '`"w"` should have been `"a"`' }
answer: encoding
explain: |
  The file was written in one encoding and read in another. Saying `encoding="utf-8"` on both sides makes the bytes mean the same thing everywhere.
```

---

Write a small report file. The check reads it back.

```exercise edit
id: io-02-write-todo
goal: 'Write the asset names from `notes.txt` into `todo.txt`, one per line, each ending with a newline.'
code: |
  from pathlib import Path

  lines = Path("notes.txt").read_text(encoding="utf-8").splitlines()
  names = []
  for line in lines[1:]:
      names.append(line.removeprefix("- ").split()[0])

  print(names)
check: |
  from pathlib import Path
  assert Path("todo.txt").exists(), "todo.txt has not been written yet."
  written = Path("todo.txt").read_text(encoding="utf-8")
  assert written == "crane_02\nboat_01\nlamp_03\n", f"todo.txt holds {written!r}; it should hold one name per line, each ending with a newline."
solution: |
  from pathlib import Path

  lines = Path("notes.txt").read_text(encoding="utf-8").splitlines()
  names = []
  for line in lines[1:]:
      names.append(line.removeprefix("- ").split()[0])

  with open("todo.txt", "w", encoding="utf-8") as f:
      for name in names:
          f.write(name + "\n")
explain: |
  A `with` block in `"w"` mode, one `write` per name. `Path("todo.txt").write_text("\n".join(names) + "\n", encoding="utf-8")` does the same in one line. Either way, the file is the same on every run, which makes the tool safe to run twice.
```
