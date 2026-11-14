---
id: io-07
title: Queueing a ComfyUI workflow
minutes: 8
recap: |
  To drive ComfyUI from Python I load a workflow saved in API format, change a value such as the sampler's seed, post it to `/prompt`, and keep the `prompt_id` from the reply. Then I fetch `/history/<prompt_id>` and follow the path through `outputs` to the image file names, remembering that node ids are strings and differ in every workflow.
---

ComfyUI running on your own machine has an API at `http://127.0.0.1:8188`. This queues a workflow with a new seed:

```python
import json
from pathlib import Path
import requests

text = Path("workflow_api.json").read_text(encoding="utf-8")
workflow = json.loads(text)
workflow["3"]["inputs"]["seed"] = 42

response = requests.post(
    "http://127.0.0.1:8188/prompt",
    json={"prompt": workflow},
    timeout=30,
)
response.raise_for_status()
print(response.json()["prompt_id"])
```

Every exercise in this lesson uses the simulated `requests` again, with canned replies shaped like ComfyUI's.

---

A workflow saved in API format is a dictionary of nodes, keyed by node id.

```exercise shape
id: io-07-shape-seed
question: Find the seed the sampler will use.
name: workflow
data: |
  {
    "3": {"class_type": "KSampler", "inputs": {"seed": 1, "steps": 20, "cfg": 7.0, "model": ["4", 0], "positive": ["6", 0]}},
    "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "a harbour crane at dusk", "clip": ["4", 1]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
    "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "harbour", "images": ["8", 0]}}
  }
answer: 'workflow["3"]["inputs"]["seed"]'
explain: |
  The sampler is the node whose `class_type` is `KSampler`, here `"3"`. The id is a string, so `workflow[3]` would be a `KeyError`. A list such as `["4", 0]` is a wire: output 0 of node `"4"`.
```

---

## Read it with what you know

`json.loads` turns the file into a dict. `workflow["3"]["inputs"]["seed"]` follows a path into nested data. `post(..., json=...)` sends a dict as JSON. The last line reads one key from the reply.

Nothing here is new. Node ids differ in every workflow, so open your own file and find your sampler before you trust `"3"`.

---

```exercise predict
id: io-07-predict-queue
files:
  workflow_api.json: |
    {
      "3": {"class_type": "KSampler", "inputs": {"seed": 1, "steps": 20}},
      "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "harbour", "images": ["8", 0]}}
    }
code: |
  import json
  from pathlib import Path
  from simulated import requests

  text = Path("workflow_api.json").read_text(encoding="utf-8")
  workflow = json.loads(text)
  workflow["3"]["inputs"]["seed"] = 42

  reply = requests.post("http://127.0.0.1:8188/prompt",
                        json={"prompt": workflow}, timeout=30)
  reply.raise_for_status()
  print(reply.status_code)
  print(reply.json()["prompt_id"])
output: |
  200
  a1b2c3d4
explain: |
  ComfyUI accepted the workflow into its queue and replied with an id for the job. Queueing is not the same as finished: the image is made later, and the id is how you ask about it.
```

---

When the job is done, `GET /history/a1b2c3d4` describes what it produced.

```exercise shape
id: io-07-shape-history
question: Find the file name of the image the job saved.
name: history
data: |
  {
    "a1b2c3d4": {
      "status": {"status_str": "success", "completed": true},
      "outputs": {
        "9": {"images": [{"filename": "ComfyUI_00001_.png", "subfolder": "", "type": "output"}]}
      }
    }
  }
answer: 'history["a1b2c3d4"]["outputs"]["9"]["images"][0]["filename"]'
explain: |
  The reply is keyed by the prompt id, then by the node that produced output: `"9"`, the save node. Each node can save several images, so `images` is a list.
```

---

```exercise edit
id: io-07-image-names
goal: 'Finish `image_names`: fetch the history for `prompt_id` and return a list of every image file name in its outputs.'
code: |
  from simulated import requests

  COMFY = "http://127.0.0.1:8188"

  def image_names(prompt_id):
      reply = requests.get(f"{COMFY}/history/{prompt_id}", timeout=10)
      reply.raise_for_status()
      job = reply.json()[prompt_id]
      names = []
      return names

  print(image_names("a1b2c3d4"))
check: |
  got = image_names("a1b2c3d4")
  assert got == ["ComfyUI_00001_.png"], f"image_names returned {got}; it should find ComfyUI_00001_.png."
solution: |
  from simulated import requests

  COMFY = "http://127.0.0.1:8188"

  def image_names(prompt_id):
      reply = requests.get(f"{COMFY}/history/{prompt_id}", timeout=10)
      reply.raise_for_status()
      job = reply.json()[prompt_id]
      names = []
      for node in job["outputs"].values():
          for image in node.get("images", []):
              names.append(image["filename"])
      return names

  print(image_names("a1b2c3d4"))
explain: |
  Looping over `outputs.values()` means you do not need to know the save node's id. `.get("images", [])` is a fair use of a default: some nodes output text or numbers rather than images, and that is normal.

  For a job still running, ComfyUI's history has no entry yet, so `reply.json()[prompt_id]` raises `KeyError`. A real tool waits and asks again.
```

---

A 400 means your request was wrong. The reply body says how.

```exercise predict
id: io-07-predict-400
code: |
  from simulated import requests

  reply = requests.post("http://127.0.0.1:8188/prompt",
                        json={"prompt": {}}, timeout=30)
  print(reply.status_code, reply.ok)
  print(reply.json()["error"]["message"])
output: |
  400 False
  Prompt has no outputs
explain: |
  An empty workflow has nothing to save, so ComfyUI refuses it. `raise_for_status()` would only say "400"; the body says why. When a call fails with a 400, print the body before you change anything.
```

---

```exercise choice
id: io-07-wrong-node
tag: Judgement call
question: 'You run a seed loop with `workflow["3"]["inputs"]["seed"] = seed` on a colleague''s workflow. No errors, but all five images are identical. What should you check first?'
options:
  - { id: node, text: 'Which node is `"3"` in this file: probably not the sampler, so the seed went nowhere' }
  - { id: server, text: "Whether ComfyUI is caching old images on the server" }
  - { id: json, text: "Whether `json.loads` lost the seed" }
answer: node
explain: |
  Setting a key on a dictionary never fails; it adds the key if it is not there. If `"3"` is a text encoder in this workflow, you gave it a `seed` input it ignores, and the real sampler kept its old seed. Find the node by its `class_type`, not by an id copied from someone else's file.
```
