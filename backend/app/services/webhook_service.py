import json
import urllib.error
import urllib.request


def dispatch_webhook(url: str, payload: dict) -> None:
    if not url:
        return
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "Formly-Webhook/1.0"},
        method="POST",
    )
    try:
        urllib.request.urlopen(request, timeout=4)
    except (urllib.error.URLError, TimeoutError, ValueError):
        return
