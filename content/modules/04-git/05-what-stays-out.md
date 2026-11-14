---
id: git-05
title: What stays out of the repository
minutes: 7
recap: |
  Secrets, generated files and large binaries stay out of Git, and a `.gitignore` file lists the patterns Git should skip. A key that was ever committed is in the history, so I treat it as leaked and replace it, and I check every diff for keys, tokens and personal paths.
---

## Three things to keep out

- **Secrets.** API keys and passwords never go in Git. Once committed they are in the history. Keep them in environment variables or a local file that Git ignores.
- **Generated files.** Caches, build output, `__pycache__`, virtual environments. They can be rebuilt, and they change on every run.
- **Large binaries.** Git is built for text. For `.blend` files, textures and models, use Git LFS, or keep them in Perforce and the code in Git, which is common in games.

---

## .gitignore

A file called `.gitignore` lists patterns Git should skip.

```text
__pycache__/
.venv/
*.blend1
.env
output/
```

A name ending in `/` means a folder. `*` matches any run of characters, so `*.blend1` matches every Blender backup file.

---

```exercise choice
id: git-05-ignored
question: With this `.gitignore`, which file will Git still offer to commit?
code: |
  __pycache__/
  .venv/
  *.blend1
  .env
  output/
options:
  - { id: backup, text: "`rock.blend1`" }
  - { id: env, text: "`.env`" }
  - { id: output, text: "`output/report.csv`" }
  - { id: blend, text: "`rock.blend`" }
answer: blend
explain: |
  `*.blend1` only matches Blender's backups. The `.blend` itself is still offered, and as a large binary it belongs in Git LFS or Perforce rather than plain Git.
```

---

This repository has no `.gitignore` yet, and a local key file has appeared. Run `git status` and look at the untracked files.

```exercise git
id: git-05-keep-env-out
task: "Commit the change to `upload.py`. The `.env` file holds a key and must not go in."
start:
  commits:
    - message: Add uploader
      files:
        upload.py: "def upload(path):\n    send(path)"
  working:
    upload.py: "def upload(path):\n    send(path, timeout=30)"
    .env: "ASSET_KEY=ak_local_only"
goal:
  - committed: { upload.py: "def upload(path):\n    send(path, timeout=30)" }
  - lastCommitFiles: [upload.py]
solution:
  - git add upload.py
  - 'git commit -m "Add a 30 second upload timeout"'
explain: |
  Naming the file kept `.env` out. `git add .` would have staged it with everything else.

  The lasting fix is a `.gitignore` with `.env` in it, committed first thing in every project. Then even `git add .` skips it.
```

---

```exercise choice
id: git-05-leaked-key
tag: Judgement call
question: A commit added an API key to the code. The next commit removed it. What now?
options:
  - { id: safe, text: "Nothing. The latest version has no key in it." }
  - { id: leaked, text: "Treat the key as leaked: revoke it and issue a new one. It is still in the history." }
  - { id: delete, text: "Delete the file and commit again" }
answer: leaked
explain: |
  Every commit is a full snapshot, and the one with the key is still in the history. Anyone with a copy of the repository can read it. If it was pushed, assume it has been seen.

  History can be rewritten, but that is fiddly and does not reach copies others already have. Replacing the key is the fix that always works.
```

---

```exercise diff
id: git-05-hard-path
task: "Save each generated image with its seed in the file name."
diff: |
  --- a/save_images.py
  +++ b/save_images.py
  @@ -4,5 +4,5 @@
   def save(image, seed, out_dir):
  -    name = "render.png"
  -    path = os.path.join(out_dir, name)
  +    name = f"render_{seed}.png"
  +    path = os.path.join("D:/ana/comfy/out", name)
       image.save(path)
       return path
flags:
  - '-    path = os.path.join(out_dir, name)'
  - '+    path = os.path.join("D:/ana/comfy/out", name)'
explain: |
  The new name is the task. The hard-coded path is not: `out_dir` is now ignored, and the node writes to a folder that exists on one machine only. On a render farm or a colleague's laptop it fails, or writes somewhere nobody looks.

  Personal paths in a diff are also a small leak: user names and drive layouts end up in the history.
```

---

```exercise diff
id: git-05-inline-key
task: "Add a 30 second timeout to the upload call."
diff: |
  --- a/upload.py
  +++ b/upload.py
  @@ -1,4 +1,5 @@
   import os
  +API_KEY = "ak_9f2c81d7e0b34a"
   def upload(path):
  -    key = os.environ["ASSET_KEY"]
  -    send(path, key)
  +    key = os.environ.get("ASSET_KEY", API_KEY)
  +    send(path, key, timeout=30)
flags:
  - '+API_KEY = "ak_9f2c81d7e0b34a"'
  - '-    key = os.environ["ASSET_KEY"]'
  - '+    key = os.environ.get("ASSET_KEY", API_KEY)'
explain: |
  Only the `timeout=30` was asked for. The diff also pastes a real-looking key into the code as a fallback. Commit this and the key is in the history for good, and a missing environment variable is now hidden instead of reported.

  Undo those lines before committing. If the key is real, replace it anyway: it has been in an AI session and on screen.
```
