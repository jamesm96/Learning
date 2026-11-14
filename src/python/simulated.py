"""A SIMULATION of the requests library, for lessons on the phone.

It never touches the network. Every reply below is canned, so lessons give the
same result every time, offline. Use it exactly like requests:

    from simulated import requests
    reply = requests.get("https://shop.example/api/products/LAMP-01", timeout=5)
    reply.raise_for_status()
    product = reply.json()

On your computer, `pip install requests` and `import requests` give you the real thing,
with the same calls.
"""

import json as _json
from urllib.parse import urlencode


class RequestException(Exception):
    """Base class for everything that can go wrong with a request."""


class HTTPError(RequestException):
    """The server replied with an error status (4xx or 5xx)."""


class ConnectionError(RequestException):  # noqa: A001 - same name as in requests
    """The server could not be reached."""


class Timeout(RequestException):
    """The server took too long to reply."""


class Response:
    """What a request gives back: a status code, and a body you can read as text or JSON."""

    def __init__(self, url, status_code, body):
        self.url = url
        self.status_code = status_code
        self.text = body if isinstance(body, str) else _json.dumps(body)
        self.ok = status_code < 400

    def json(self):
        return _json.loads(self.text)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise HTTPError(f"{self.status_code} Error for url: {self.url}")

    def __repr__(self):
        return f"<Response [{self.status_code}]>"


_PRODUCTS = {
    "LAMP-01": {"sku": "LAMP-01", "name": "Desk lamp", "price": 39.0, "currency": "GBP", "stock": 14},
    "CHAIR-OAK-120": {"sku": "CHAIR-OAK-120", "name": "Oak chair", "price": 149.0, "currency": "GBP", "stock": 0},
    "RUG-07": {"sku": "RUG-07", "name": "Wool rug", "price": 89.5, "currency": "GBP", "stock": 3},
}

_WEATHER = {
    "Leeds": {"city": "Leeds", "temp_c": 11.5, "conditions": "light rain", "wind_kph": 18},
    "Lisbon": {"city": "Lisbon", "temp_c": 19.0, "conditions": "clear", "wind_kph": 9},
}

_COMFY = "http://127.0.0.1:8188"
_PROMPT_ID = "a1b2c3d4"


def _get(url):
    if url == "https://shop.example/api/products":
        return 200, {"products": list(_PRODUCTS.values()), "count": len(_PRODUCTS)}
    if url.startswith("https://shop.example/api/products/"):
        sku = url.rsplit("/", 1)[-1]
        if sku in _PRODUCTS:
            return 200, _PRODUCTS[sku]
        return 404, {"error": "not found", "sku": sku}
    if url.startswith("https://weather.example/v1/current"):
        city = url.split("city=", 1)[-1] if "city=" in url else ""
        if city in _WEATHER:
            return 200, _WEATHER[city]
        return 400, {"error": "unknown city", "city": city}
    if url == f"{_COMFY}/history/{_PROMPT_ID}":
        return 200, {
            _PROMPT_ID: {
                "status": {"status_str": "success", "completed": True},
                "outputs": {
                    "9": {"images": [{"filename": "ComfyUI_00001_.png", "subfolder": "", "type": "output"}]}
                },
            }
        }
    if url.startswith(f"{_COMFY}/history/"):
        return 200, {}
    if url == "https://slow.example/report":
        raise Timeout("simulated: the server did not reply in time")
    raise ConnectionError(f"simulated: no canned reply for GET {url}")


def _post(url, body):
    if url == f"{_COMFY}/prompt":
        workflow = (body or {}).get("prompt")
        if not isinstance(workflow, dict) or not workflow:
            return 400, {"error": {"type": "prompt_no_outputs", "message": "Prompt has no outputs"}, "node_errors": {}}
        return 200, {"prompt_id": _PROMPT_ID, "number": 1, "node_errors": {}}
    raise ConnectionError(f"simulated: no canned reply for POST {url}")


def _with_params(url, params):
    return f"{url}?{urlencode(params)}" if params else url


class _Requests:
    """The simulated `requests` module: get, post, and the same exception classes."""

    RequestException = RequestException
    HTTPError = HTTPError
    ConnectionError = ConnectionError
    Timeout = Timeout
    Response = Response

    def get(self, url, params=None, timeout=None):
        full = _with_params(url, params)
        status, body = _get(full)
        return Response(full, status, body)

    def post(self, url, json=None, timeout=None):
        status, body = _post(url, json)
        return Response(url, status, body)


requests = _Requests()
