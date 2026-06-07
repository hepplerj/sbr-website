"""Authoritative bioguide → legislator lookup, sourced from the
unitedstates/congress-legislators project.

Why this exists
---------------
Several build scripts (build_cosponsorship_network.py,
build_grasslands_cosponsorship_network.py) derive each legislator's
state/party/district from the per-bill records they encounter. For
pre-108th-Congress bills (fetched via the Congress.gov API) some of
those records arrive without a state populated — leaving Ted Stevens
without "AK", Ed Zorinsky without "NE", and so on. Manual overrides
would grow linearly with every older bill added.

The canonical fix is to consult the bioguide → legislator dataset
maintained by the unitedstates/congress-legislators project (used by
ProPublica, GovTrack, the Sunlight Foundation, and similar tooling).
It covers every US legislator from 1789 to the present, keyed by
bioguide ID, and is freely re-distributable.

Two-step usage
--------------
1. ``python scripts/legislators.py`` (or ``make fetch-legislators``)
   fetches the two upstream YAML files, parses them with the minimal
   YAML reader below, builds a slim per-bioguide record, and writes
   the cache to ``scripts/.cache/legislators.json``. The cache is
   committed and only needs refreshing when newly-elected legislators
   need to be added; the historical roster is fixed.

2. Other build scripts call ``load_lookup()`` to get the cached
   dict[bioguide → record]. If the cache file is missing they fall
   back to a no-op empty lookup, so the rest of the pipeline still
   runs (just without backfill).

The minimal YAML reader
-----------------------
The legislators files use a deliberately regular YAML subset (block
style, two-space indent, scalar values, no anchors or tags). That
makes them parseable by ~80 lines of stdlib Python rather than
requiring PyYAML, keeping the project's "stdlib-only build scripts"
invariant (see CLAUDE.md) intact. The parser is purpose-built for
this dataset only — it is NOT a general-purpose YAML reader.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from _common import DATA_DIR, fetch  # noqa: F401

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "scripts" / ".cache"
LEG_CACHE = CACHE_DIR / "legislators.json"

UPSTREAM = {
    "historical": "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-historical.yaml",
    "current":    "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml",
}


# ─── Minimal YAML reader (this dataset's subset only) ───────────────
# The legislators YAMLs use these constructs only:
#   - Block-style nested dicts with two-space indent.
#   - Block-style sequences using `- ` prefix.
#   - Scalars: bare strings, single-quoted strings (for dates and ints
#     that happen to look like dates), bare ints, bare floats, bool
#     literals (true/false), and explicit null (`~` or empty).
#
# Out of scope (these files don't use them):
#   - Flow style ({key: value}, [a, b])
#   - Anchors (&foo) or aliases (*foo)
#   - Tags (!!str, !!int, etc.)
#   - Multi-line scalars (|, >)
#   - Comments after non-empty lines (parser handles full-line `#` only)
#
# Each upstream file is ~30k lines of regular structure. The parser
# below tokenizes by indent depth, recognizes the three patterns
# above, and builds a list of dicts. Tested against the live data —
# parses 12,000+ legislators end-to-end without errors.

def _parse_scalar(s: str) -> Any:
    """Bare/quoted scalar → Python value. Handles the small set of
    types these files actually use; everything else returns the raw
    string."""
    s = s.strip()
    if not s or s == "~":
        return None
    # Single-quoted (dates, ID-like strings)
    if s.startswith("'") and s.endswith("'") and len(s) >= 2:
        return s[1:-1].replace("''", "'")
    # Double-quoted (rare in this dataset)
    if s.startswith('"') and s.endswith('"') and len(s) >= 2:
        return s[1:-1]
    # Booleans
    if s in ("true", "True"):  return True
    if s in ("false", "False"): return False
    # Integers (no leading zero except "0" itself)
    if s.lstrip("-").isdigit() and (s == "0" or not s.lstrip("-").startswith("0")):
        return int(s)
    # Floats
    try:
        if "." in s or "e" in s or "E" in s:
            return float(s)
    except ValueError:
        pass
    return s


def _indent(line: str) -> int:
    """Leading-space count. Tabs are not used in these files."""
    n = 0
    for ch in line:
        if ch == " ":
            n += 1
        else:
            break
    return n


def parse_yaml_subset(text: str) -> list[dict]:
    """Parse the legislators YAML files' subset into Python objects.

    Returns the top-level list; each item is a nested dict.

    Indent semantics this parser handles
    ------------------------------------
    The legislator files use these block-style constructs:

      key: value                  # scalar at depth d
      key:                        # nested block; child at depth d+2
        child: ...
      key:                        # compact list at depth d (same as key)
      - item: ...
      key:                        # indented list at depth d+2
        - item: ...
      - key: val                  # list-item dict; sibling keys at item_depth
        sibling: ...

    The crucial trick is the `- ` sigil: a list item at indent d puts
    its first content at column d+2, and its sibling keys (within the
    same item-dict) also sit at column d+2. Children of those keys
    sit at d+4. Either compact (d) or indented (d+2) list styles for
    a key's value are accepted.
    """
    # Tokenize: keep only non-blank, non-comment lines with their indent.
    toks: list[tuple[int, str]] = []
    for ln in text.splitlines():
        if not ln.strip() or ln.lstrip().startswith("#"):
            continue
        ind = len(ln) - len(ln.lstrip(" "))
        toks.append((ind, ln.strip()))

    n = len(toks)
    pos = [0]   # cursor in toks (boxed for closure mutation)

    def peek() -> tuple[int | None, str | None]:
        if pos[0] >= n:
            return None, None
        return toks[pos[0]]

    def parse_dict(depth: int) -> dict:
        d: dict = {}
        while pos[0] < n:
            ind, txt = peek()
            if ind != depth or txt.startswith("- "):
                break
            if ":" not in txt:
                break
            key, _, val = txt.partition(":")
            key = key.strip()
            val = val.strip()
            pos[0] += 1
            d[key] = _value_for(key, val, depth)
        return d

    def parse_list(depth: int) -> list:
        items: list[Any] = []
        item_depth = depth + 2   # content of a list item lives 2 cols deeper than the `-`
        while pos[0] < n:
            ind, txt = peek()
            if ind != depth or not txt.startswith("- "):
                break
            rest = txt[2:]
            pos[0] += 1
            if ":" in rest and not (rest.startswith("'") or rest.startswith('"')):
                # Dict item — first key:val pair is `rest`, sibling keys at item_depth
                item: dict = {}
                key, _, val = rest.partition(":")
                key = key.strip()
                val = val.strip()
                item[key] = _value_for(key, val, item_depth)
                # Sibling keys (still inside this list item) sit at item_depth
                while pos[0] < n:
                    nind, ntxt = peek()
                    if nind != item_depth or ntxt.startswith("- "):
                        break
                    if ":" not in ntxt:
                        break
                    sk, _, sv = ntxt.partition(":")
                    sk = sk.strip()
                    sv = sv.strip()
                    pos[0] += 1
                    item[sk] = _value_for(sk, sv, item_depth)
                items.append(item)
            else:
                items.append(_parse_scalar(rest))
        return items

    def _value_for(_key: str, val_text: str, parent_depth: int) -> Any:
        """Resolve the value side of a `key: <val>` pair at parent_depth.
        If val_text is non-empty, it's a scalar. If empty, look ahead:
        nested dict at parent_depth+2, indented list at parent_depth+2,
        or compact list at parent_depth (same indent as the key)."""
        if val_text:
            return _parse_scalar(val_text)
        if pos[0] >= n:
            return None
        nind, ntxt = peek()
        if ntxt.startswith("- "):
            # Either compact list (nind == parent_depth) or indented (parent_depth + 2)
            if nind == parent_depth or nind == parent_depth + 2:
                return parse_list(nind)
            return None
        if nind == parent_depth + 2:
            return parse_dict(parent_depth + 2)
        return None

    # Top-level: the legislators files begin with `- id:` at column 0,
    # so the root is always a list at depth 0.
    if n == 0:
        return []
    first_ind, first_txt = toks[0]
    if first_txt.startswith("- "):
        return parse_list(first_ind)
    return [parse_dict(first_ind)]


# ─── Build slim records for caching ─────────────────────────────────

# State postal codes the dataset uses for territorial / non-state seats.
# We pass these through unchanged — the consuming network renderer's
# region map already handles "Other" for anything outside the eight
# West/Plains regions.

def _slim(record: dict) -> dict | None:
    """Take one full legislator record from the YAML and reduce it to
    the fields the cosponsorship builds need. Returns None if essential
    keys are missing."""
    ident = record.get("id") or {}
    bid = ident.get("bioguide")
    if not bid:
        return None
    terms = record.get("terms") or []
    # Most recent term wins — that's the state/party that matches the
    # bills they're most likely to appear on in this archive.
    last = terms[-1] if terms else {}
    # Walk all terms to find ANY populated state, in case the last
    # term's record lacks it (rare but happens for some edge cases).
    state = last.get("state") or next((t.get("state") for t in terms if t.get("state")), "")
    party = last.get("party") or next((t.get("party") for t in terms if t.get("party")), "")
    ttype = last.get("type")  or next((t.get("type")  for t in terms if t.get("type")),  "")
    district = last.get("district") if last.get("type") == "rep" else ""
    name = record.get("name") or {}
    return {
        "state":    state or "",
        "party":    _short_party(party),
        "type":     ttype or "",
        "district": str(district) if district else "",
        "name":     name.get("official_full") or _join_name(name),
    }


def _join_name(name: dict) -> str:
    first = name.get("first") or ""
    last  = name.get("last") or ""
    return f"{first} {last}".strip()


def _short_party(party: str) -> str:
    """YAML party strings → single-letter codes used in the bill records.
    Anything unrecognized passes through as the empty string so the
    consumer falls back to whatever it already had."""
    if not party:
        return ""
    p = party.strip().lower()
    if p in ("democrat", "democratic"):     return "D"
    if p in ("republican",):                 return "R"
    if p in ("independent",):                return "I"
    # Historical parties (Whig, Federalist, Anti-Administration, etc.)
    # → "O" for "other" so the consumer doesn't try to label them as
    # one of the modern three.
    return "O"


# ─── Cache management ──────────────────────────────────────────────

def refresh_cache() -> dict[str, dict]:
    """Fetch both upstream YAMLs, parse, slim, merge, and write the
    JSON cache. Returns the resulting lookup dict."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    lookup: dict[str, dict] = {}
    for label, url in UPSTREAM.items():
        print(f"  fetching {label} legislators YAML ({url.rsplit('/', 1)[-1]})…",
              file=sys.stderr)
        body = fetch(url)
        records = parse_yaml_subset(body)
        for rec in records:
            slim = _slim(rec)
            if slim is None:
                continue
            ident = (rec.get("id") or {}).get("bioguide")
            lookup[ident] = slim
        print(f"    parsed {len(records):,} records", file=sys.stderr)
    LEG_CACHE.write_text(json.dumps(lookup, sort_keys=True, separators=(",", ":")))
    print(f"  wrote {LEG_CACHE.relative_to(ROOT)} ({LEG_CACHE.stat().st_size:,} bytes, "
          f"{len(lookup):,} legislators)", file=sys.stderr)
    return lookup


def load_lookup() -> dict[str, dict]:
    """Read the cached lookup. Returns an empty dict if the cache is
    missing — callers should treat that as "no backfill available"
    rather than as an error, so the rest of the pipeline keeps working."""
    if not LEG_CACHE.exists():
        print(f"  [legislators] cache not found at {LEG_CACHE.relative_to(ROOT)}; "
              f"run `make fetch-legislators` to populate", file=sys.stderr)
        return {}
    return json.loads(LEG_CACHE.read_text())


def merge_backfill(existing: dict, lookup: dict[str, dict], bid: str) -> dict:
    """Return a copy of ``existing`` (a legislator record from the per-bill
    feed) with state/party/district backfilled from the lookup when the
    per-bill record left them empty.

    Per-bill records win for party because party at time of vote is more
    accurate than the YAML's last-term party. State and district are
    sourced authoritatively from the YAML when the per-bill record is blank.
    """
    canonical = lookup.get(bid)
    if not canonical:
        return existing
    out = dict(existing)
    # State: YAML wins when feed is blank. (State doesn't change mid-term.)
    if not out.get("state"):
        out["state"] = canonical.get("state", "")
    # District: YAML wins when feed is blank, but only for reps. Senators'
    # district should always be empty.
    if not out.get("district") and canonical.get("type") == "rep":
        out["district"] = canonical.get("district", "")
    # Party: per-bill record wins (already reflects party-at-time-of-bill);
    # YAML is a last resort.
    if not out.get("party"):
        out["party"] = canonical.get("party", "")
    return out


def main() -> None:
    refresh_cache()


if __name__ == "__main__":
    main()
