#!/usr/bin/env python3
"""Build ``static/data/farm-consolidation.json``.

US farm count and average farm size over the twentieth and early
twenty-first centuries, from the USDA NASS QuickStats API. Both series
indexed to 1950 = 100 so the divergence renders as a single-axis line
chart (farms falling, average size rising).

Requires a NASS QuickStats API key in the environment:

    export NASS_API_KEY="YOUR-KEY-HERE"     # free from quickstats.nass.usda.gov/api

API documentation: https://quickstats.nass.usda.gov/api

Run: ``python scripts/build_farm_consolidation.py``
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request

from _common import DATA_DIR, write_json

API = "https://quickstats.nass.usda.gov/api/api_GET/"


def nass(params: dict) -> list[dict]:
    """Call the NASS QuickStats API and return the data array."""
    key = os.environ.get("NASS_API_KEY")
    if not key:
        sys.exit(
            "NASS_API_KEY is not set.\n"
            "Get a free key at https://quickstats.nass.usda.gov/api and\n"
            "    export NASS_API_KEY=YOUR-KEY-HERE"
        )
    q = dict(params)
    q["key"] = key
    q["format"] = "JSON"
    url = API + "?" + urllib.parse.urlencode(q)
    with urllib.request.urlopen(url) as r:
        body = r.read()
    d = json.loads(body)
    return d.get("data", [])


def to_float(s: str) -> float | None:
    """Parse a NASS numeric Value, which uses commas and sometimes '(D)' suppression."""
    if not s or s == "(D)":
        return None
    try:
        return float(s.replace(",", "").replace("$", ""))
    except ValueError:
        return None


def best_annual(records: list[dict]) -> dict[int, float]:
    """Reduce per-year records to a single value per year, preferring CENSUS
    over SURVEY (Census is the gold-standard decennial / quinquennial snapshot)."""
    out: dict[int, tuple[str, float]] = {}
    for r in records:
        y = int(r["year"])
        v = to_float(r.get("Value", ""))
        if v is None:
            continue
        src = r.get("source_desc", "")
        cur = out.get(y)
        if cur is None or (cur[0] != "CENSUS" and src == "CENSUS"):
            out[y] = (src, v)
    return {y: v for y, (_, v) in out.items()}


def main() -> None:
    # Farm count (operations), national, 1910-present
    farms_rows = nass({
        "short_desc": "FARM OPERATIONS - NUMBER OF OPERATIONS",
        "agg_level_desc": "NATIONAL",
        "domain_desc": "TOTAL",
    })
    farms = best_annual(farms_rows)

    # Average farm size (acres / operation), national, 1979-present
    size_rows = nass({
        "short_desc": "FARM OPERATIONS - AREA OPERATED, MEASURED IN ACRES / OPERATION",
        "agg_level_desc": "NATIONAL",
        "domain_desc": "TOTAL",
    })
    size_reported = best_annual(size_rows)

    # Total acres operated, national, 1950-present. Combined with farm
    # count this lets us compute avg size back to 1950, extending the
    # reported series by ~30 years.
    acres_rows = nass({
        "short_desc": "FARM OPERATIONS - ACRES OPERATED",
        "agg_level_desc": "NATIONAL",
        "domain_desc": "TOTAL",
    })
    acres = best_annual(acres_rows)

    # Merge: prefer reported avg size where present, otherwise compute
    # from acres / farms.
    size = dict(size_reported)
    for y, a in acres.items():
        if y in farms and farms[y] > 0 and y not in size:
            size[y] = a / farms[y]

    # Indexing baseline: 1950. That year has both series and a round
    # baseline for narrative ("since 1950 the farm count has fallen to…").
    base_year = 1950
    farms_base = farms.get(base_year)
    size_base  = size.get(base_year)
    if farms_base is None or size_base is None:
        sys.exit(f"Expected {base_year} values for indexing baseline; got "
                 f"farms={farms_base!r} size={size_base!r}")

    years = sorted(set(farms) | set(size))
    data = []
    for y in years:
        row = {"year": y}
        if y in farms:
            row["farms"] = round(farms[y])
            row["farms_idx"] = round(farms[y] / farms_base * 100, 1)
        if y in size:
            row["avg_size"] = round(size[y], 1)
            row["size_idx"] = round(size[y] / size_base * 100, 1)
        data.append(row)

    out = {
        "title": "US farm count and average farm size, 1910–2025",
        "source": (
            "USDA National Agricultural Statistics Service (NASS) via the "
            "QuickStats API. Farm count: FARM OPERATIONS - NUMBER OF "
            "OPERATIONS (national, total domain; Census where available, "
            "Survey interpolation otherwise). Average farm size: reported "
            "acres/operation from 1979 forward; computed as total acres "
            "operated / farm count for 1950–1978."
        ),
        "baseline_year": base_year,
        "baseline_farms":    farms_base,
        "baseline_avg_size": round(size_base, 1),
        "data": data,
    }
    write_json(DATA_DIR / "farm-consolidation.json", out)

    # Spot-check key years
    by_year = {r["year"]: r for r in data}
    print("spot-check:", file=sys.stderr)
    for y in [1910, 1950, 1980, 2000, 2022]:
        r = by_year.get(y, {})
        f = r.get("farms", "-")
        s = r.get("avg_size", "-")
        print(f"  {y}: farms={f!s:>9}  avg={s!s:>6} ac", file=sys.stderr)


if __name__ == "__main__":
    main()
