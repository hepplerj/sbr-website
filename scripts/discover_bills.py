#!/usr/bin/env python3
"""Discover candidate public-lands bills for the cosponsorship network.

Queries the GovTrack API (no key needed) for bills tagged with subject
6279 ("Public Lands and Natural Resources") in each requested Congress,
then fetches cosponsor counts from api.congress.gov and filters by
title keywords relevant to the sagebrush / federal-lands-transfer lineage.

Output is a tab-separated table sorted by Congress + cosponsor count,
ready to copy-paste into build_cosponsorship_network.py.

Usage:
    export CONGRESS_API_KEY=your_key_here
    python scripts/discover_bills.py            # default: 95th–119th
    python scripts/discover_bills.py 96 97 98   # specific Congresses
    python scripts/discover_bills.py --min-cosponsors 3  # raise threshold

The script is read-only — it does not write any data files.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

# ── Configuration ─────────────────────────────────────────────────────────────

GOVTRACK_API  = "https://www.govtrack.us/api/v2/bill"
CONGRESS_API  = "https://api.congress.gov/v3"
API_KEY       = os.environ.get("CONGRESS_API_KEY", "")

# GovTrack subject ID for "Public Lands and Natural Resources"
SUBJECT_ID    = 6279

# Title keywords — any match keeps the bill (case-insensitive, substring).
# Tuned for the transfer/disposal/grazing/Antiquities lineage.
KEYWORDS = [
    "federal land",
    "public land",
    "grazing",
    "rangeland",
    "range management",
    "range improvement",
    "disposal",
    "transfer",
    "wilderness",
    "forest management",
    "national forest",
    "national grassland",
    "antiquities",
    "blm",
    "bureau of land management",
    "taylor grazing",
    "sagebrush",
    "western lands",
    "land utilization",
    "submarginal land",
]

# Bill types to include (exclude resolutions, private bills, etc.)
BILL_TYPES = {"s", "hr", "sjres", "hjres"}

# Default Congress range — full coverage from 95th through current (119th)
DEFAULT_CONGRESSES = list(range(95, 120))

# Minimum cosponsors to include a bill in output (keeps list manageable)
DEFAULT_MIN_COSPONSORS = 2


# ── Helpers ───────────────────────────────────────────────────────────────────

UA = "governing-ground-pipeline/1.0 (+https://github.com/hepplerj/sbr-website)"


def get(url: str, retries: int = 4, backoff: float = 3.0) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    last_err: Exception = RuntimeError("no attempts")
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as err:
            last_err = err
            wait = backoff * (2 ** attempt)
            print(f"\n    retry {attempt + 1}/{retries} after {wait:.0f}s ({err}) …",
                  file=sys.stderr, end="", flush=True)
            time.sleep(wait)
    raise last_err


GOVTRACK_MAX_OFFSET = 1000  # GovTrack hard cap; results beyond this are unreachable

def govtrack_bills(congress: int) -> list[dict]:
    """Return GovTrack bills for congress tagged with subject SUBJECT_ID.

    GovTrack caps offset at 1000, so for congresses with more than 1000
    subject bills we get the first 1000 only. In practice the keyword
    filter catches the most-cosponsored bills which tend to be indexed
    earliest, so coverage is good even with the cap.
    """
    bills, limit, offset = [], 100, 0
    while True:
        url = (
            f"{GOVTRACK_API}?congress={congress}&terms={SUBJECT_ID}"
            f"&limit={limit}&offset={offset}&fields=bill_type,number,title"
        )
        data = get(url)
        batch = data.get("objects", [])
        bills.extend(batch)
        total = data["meta"]["total_count"]
        next_offset = offset + limit
        if next_offset >= total or next_offset >= GOVTRACK_MAX_OFFSET:
            if total > GOVTRACK_MAX_OFFSET:
                import sys
                print(f"\n    NOTE: {congress}th Congress has {total} subject bills; "
                      f"GovTrack cap limits fetch to {GOVTRACK_MAX_OFFSET}.",
                      file=sys.stderr)
            break
        offset = next_offset
        time.sleep(0.4)
    return bills


def cosponsor_count(congress: int, btype: str, number: int) -> int | None:
    """Return cosponsor count from api.congress.gov, or None on error."""
    if not API_KEY:
        return None
    url = (
        f"{CONGRESS_API}/bill/{congress}/{btype}/{number}/cosponsors"
        f"?api_key={API_KEY}&format=json&limit=1"
    )
    try:
        data = get(url)
        return data.get("pagination", {}).get("count", 0)
    except (urllib.error.HTTPError, urllib.error.URLError):
        return None


def matches_keywords(title: str) -> bool:
    t = title.lower()
    return any(kw in t for kw in KEYWORDS)


GOVTRACK_TYPE_MAP = {
    "senate_bill":                  "s",
    "house_bill":                   "hr",
    "senate_joint_resolution":      "sjres",
    "house_joint_resolution":       "hjres",
    "senate_concurrent_resolution": "sconres",
    "house_concurrent_resolution":  "hconres",
    "senate_resolution":            "sres",
    "house_resolution":             "hres",
}


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("congresses", nargs="*", type=int,
                        help="Congress numbers to scan (default: 95–107)")
    parser.add_argument("--min-cosponsors", type=int, default=DEFAULT_MIN_COSPONSORS,
                        metavar="N", help="Minimum cosponsors to include (default: 2)")
    parser.add_argument("--no-cosponsor-filter", action="store_true",
                        help="Skip cosponsor lookup and show all keyword matches")
    args = parser.parse_args()

    congresses = args.congresses or DEFAULT_CONGRESSES
    min_co     = args.min_cosponsors

    if not API_KEY and not args.no_cosponsor_filter:
        print("WARNING: CONGRESS_API_KEY not set — cosponsor counts unavailable.",
              file=sys.stderr)
        print("         Run with --no-cosponsor-filter to list keyword matches only.\n",
              file=sys.stderr)

    header = f"{'Congress':>9}  {'Bill':<12}  {'Cosponsors':>10}  Title"
    print(header)
    print("-" * 100)

    results: list[tuple[int, str, int, str, int]] = []  # (congress, bill_id, number, title, cosp)

    for congress in congresses:
        print(f"  scanning {congress}th Congress …", file=sys.stderr, end="\r", flush=True)
        try:
            bills = govtrack_bills(congress)
        except Exception as err:
            print(f"\n  ERROR fetching Congress {congress}: {err}", file=sys.stderr)
            continue

        candidates = []
        for b in bills:
            btype = GOVTRACK_TYPE_MAP.get(b.get("bill_type", ""), "")
            if btype not in BILL_TYPES:
                continue
            title = b.get("title") or ""
            if not matches_keywords(title):
                continue
            candidates.append((btype, int(b["number"]), title))

        print(f"  {congress}th Congress: {len(bills)} subject bills, "
              f"{len(candidates)} keyword matches          ", file=sys.stderr)
        time.sleep(1.0)

        for btype, number, title in sorted(candidates, key=lambda x: x[1]):
            if API_KEY and not args.no_cosponsor_filter:
                count = cosponsor_count(congress, btype, number)
                time.sleep(0.1)
            else:
                count = None

            if count is not None and count < min_co:
                continue

            bill_id = f"{btype.upper()}. {number}"
            results.append((congress, bill_id, number, title, count or 0))

    results.sort(key=lambda x: (x[0], -x[4]))

    for congress, bill_id, number, title, count in results:
        co_str = str(count) if count is not None else "?"
        print(f"  {congress:>7}  {bill_id:<12}  {co_str:>10}  {title[:65]}")

    print(f"\n{len(results)} candidates across {len(congresses)} Congresses.", file=sys.stderr)
    print("\nTo add a bill to the network, append to BILLS in "
          "scripts/build_cosponsorship_network.py:", file=sys.stderr)
    print('    (CONGRESS, "hr_or_s", NUMBER, "Short label (Nth, Sponsor)"),',
          file=sys.stderr)


if __name__ == "__main__":
    main()
