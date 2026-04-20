"""Shared helpers for the data-build scripts."""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "static" / "data"

UA = "governing-ground-pipeline/1.0 (+https://github.com/hepplerj/sbr-website)"


def fetch(url: str, dest: Path | None = None, *, binary: bool = False) -> bytes | str:
    """Fetch ``url``; return its body and optionally cache it at ``dest``.

    Content is fetched with a descriptive user-agent so well-behaved servers
    can identify this pipeline in their logs.
    """
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as r:
        body = r.read()
    if dest is not None:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(body)
    return body if binary else body.decode("utf-8")


def write_json(path: Path, obj) -> None:
    """Write ``obj`` as compact JSON (no whitespace) — Hugo ships it as-is."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, separators=(",", ":")))
    print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size:,} bytes)", file=sys.stderr)
