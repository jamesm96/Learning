---
id: io-06
title: "APIs: asking another program over the network"
minutes: 8
recap: |
  An API call sends a method and an address, sometimes with a JSON body, and gets back a status code and usually JSON, which I read with `.json()`. I call `raise_for_status()` so a failed reply becomes an error instead of fake data, I always set a timeout so a stalled server cannot freeze the tool, and keys come from environment variables, never the code.
---

An API call is a message to another program: an address (a URL), a method (`GET` to fetch, `POST` to send), some headers, and often a JSON body. The reply is a status code and usually JSON.

Image generators, language models, asset stores, shop catalogues, studio databases and robot fleets all work this way.

**This lesson uses a simulation.** `from simulated import requests` gives a stand-in with canned replies, so it works offline on your phone and gives the same answer every time. On your computer, `pip install requests` and `import requests` give you the real library, with exactly the same calls.

---

```exercise predict
id: io-06-predict-get
code: |
  from simulated import requests

  url = "https://shop.example/api/products/LAMP-01"
  reply = requests.get(url, timeout=5)
  print(reply.status_code)

  product = reply.json()
  print(product["name"], product["price"])
  print(type(product["price"]).__name__)
output: |
  200
  Desk lamp 39.0
  float
explain: |
  200 means it worked. `.json()` turns the reply's JSON text into a dictionary, exactly like `json.loads`. Unlike a CSV, JSON keeps numbers as numbers, so the price is already a `float`.
```

---

This is the reply from `https://shop.example/api/products`, the whole catalogue.

```exercise shape
id: io-06-shape-catalogue
question: Find how many wool rugs are in stock.
name: reply
data: |
  {
    "products": [
      {"sku": "LAMP-01", "name": "Desk lamp", "price": 39.0, "currency": "GBP", "stock": 14},
      {"sku": "CHAIR-OAK-120", "name": "Oak chair", "price": 149.0, "currency": "GBP", "stock": 0},
      {"sku": "RUG-07", "name": "Wool rug", "price": 89.5, "currency": "GBP", "stock": 3}
    ],
    "count": 3
  }
answer: 'reply["products"][2]["stock"]'
explain: |
  A dict with a list of product dicts under `"products"`: the same shape as the harbour manifest, from a completely different industry. The rug is the third product, index 2.
```

---

## Status codes

| Status | Meaning |
|---|---|
| 200s | It worked |
| 400 | Your request was malformed; read the reply body |
| 401, 403 | Missing or wrong credentials |
| 404 | Wrong address, or no such thing |
| 429 | Too many requests; slow down and retry |
| 500s | The server failed; often worth one retry |

---

An unknown product gives a 404. Predict all three lines.

```exercise predict
id: io-06-predict-404
code: |
  from simulated import requests

  url = "https://shop.example/api/products/LAMP-99"
  reply = requests.get(url, timeout=5)
  print(reply.status_code)
  print(reply.json())

  try:
      reply.raise_for_status()
  except requests.HTTPError as e:
      print("failed:", e)
output: |
  404
  {'error': 'not found', 'sku': 'LAMP-99'}
  failed: 404 Error for url: https://shop.example/api/products/LAMP-99
explain: |
  The request itself did not fail. The server answered, with a 404 and a body that is valid JSON. Without a status check, code would carry on and treat `{'error': 'not found'}` as if it were a product. `raise_for_status()` turns any 400 or 500 reply into an error.
```

---

```exercise edit
id: io-06-raise-for-status
goal: 'Make `get_price` raise `requests.HTTPError` for a product that does not exist, instead of failing later with a `KeyError`.'
code: |
  from simulated import requests

  SHOP = "https://shop.example/api/products/"

  def get_price(sku):
      reply = requests.get(SHOP + sku, timeout=5)
      return reply.json()["price"]

  print(get_price("RUG-07"))
check: |
  assert get_price("RUG-07") == 89.5, "get_price should still return 89.5 for RUG-07."
  try:
      get_price("LAMP-99")
  except requests.HTTPError:
      pass
  else:
      raise AssertionError("get_price('LAMP-99') should raise requests.HTTPError.")
solution: |
  from simulated import requests

  SHOP = "https://shop.example/api/products/"

  def get_price(sku):
      reply = requests.get(SHOP + sku, timeout=5)
      reply.raise_for_status()
      return reply.json()["price"]

  print(get_price("RUG-07"))
explain: |
  One line, straight after the request. Now the error says "404 for LAMP-99" rather than `KeyError: 'price'`, which would send you looking at the wrong thing. Joining `SHOP + sku` with `+` is fine here: web addresses are text, not file paths.
```

---

## Always set a timeout

Without a `timeout`, a real `requests` call waits as long as the server keeps the connection open. A stalled server freezes your tool, and a batch of 200 never finishes.

```exercise predict
id: io-06-predict-timeout
code: |
  from simulated import requests

  try:
      reply = requests.get("https://slow.example/report", timeout=5)
      print(reply.status_code)
  except requests.Timeout:
      print("no reply in 5 seconds; try again later")
  print("the tool carries on")
output: |
  no reply in 5 seconds; try again later
  the tool carries on
explain: |
  The simulated server never answers, so the call raises `Timeout` and `reply` is never set. The handler names the specific failure and says what to do, which is what an honest `except` looks like.
```

---

```exercise choice
id: io-06-api-key
tag: Judgement call
question: A script calls a paid image service. Where should the API key come from?
options:
  - { id: env, text: 'An environment variable: `os.environ["SERVICE_API_KEY"]`' }
  - { id: code, text: "A constant at the top of the script, so it is easy to find" }
  - { id: json, text: "The settings JSON that is committed to Git with the tool" }
answer: env
explain: |
  A key in the code or in a committed file goes everywhere the code goes: to Git, to colleagues, sometimes to the public internet. Anyone who has it can spend your money. An environment variable stays on the machine. Square brackets also mean a missing key fails at once, with its name in the error.
```
