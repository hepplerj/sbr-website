#!/usr/bin/env python3
"""Build Follow-the-Money derivatives into ``static/data/``.

Three outputs, all derived from Taylor/Steiner et al.'s county-year
federal-payments CSV:

- ``follow-the-money.json`` — a year × program time series (annual totals
  summed across all western counties), for the line/bar chart on the
  "Federal Payments to Western Counties" sightline.
- ``ftm-counties.geojson`` — county boundary polygons for the 11 western
  states in the dataset, fetched from the Census Generalized_ACS2023
  TIGER service at 1:20M scale. ~400 polygons, small enough for web.
- ``ftm-payments-{code}.json`` (×10, one per program) — per-county
  time series for one program, shape ``{fips: [year, thousands, ...]}``.
  Zeros dropped, amounts rounded to thousands of 2020 dollars. Loaded
  on demand by the county-choropleth sightline.

Data: http://followthemoney.stanford.edu/data_new/
Project: https://web.stanford.edu/group/spatialhistory/FollowTheMoney/

Cite as:
    Taylor, Joseph E., III, Krista Fryauff, Erik Steiner, Celena Allen,
    Alex Sherman, and Zephyr Frank. "Follow the Money: A Spatial History
    of In-Lieu Programs for Western Federal Lands." Spatial History
    Project, CESTA, Stanford University, 1 June 2016.

Licensed CC BY-NC 4.0 by the authors.

Run: ``python scripts/build_follow_the_money.py``
"""

from __future__ import annotations

import csv
import io
import json
import urllib.parse

from _common import DATA_DIR, fetch, write_json

CSV_URL = (
    "https://followthemoney.stanford.edu/data_new/"
    "Federal_Program_History_2020_Dollars_JAY_TAYLOR.csv"
)

# Column → display label.
PROGRAMS = [
    ("PILT",    "Payments in Lieu of Taxes"),
    ("SRS",     "Secure Rural Schools"),
    ("FS",      "Forest Service 25% Fund"),
    ("O_C",     "Oregon & California Lands"),
    ("BLM",     "BLM Receipts"),
    ("FML",     "Federal Mineral Leasing"),
    ("TGA-3",   "Taylor Grazing Act (3%)"),
    ("TGA-15",  "Taylor Grazing Act (15%)"),
    ("BJA/NG",  "Bankhead-Jones / National Grasslands"),
    ("LWCF",    "Land & Water Conservation Fund"),
]

# FIPS state codes for the 11 states in the FTM data.
STATE_FIPS = ["04", "06", "08", "16", "30", "32", "35", "41", "49", "53", "56"]

# Census TIGER generalized counties (20M = ~1:20M cartographic scale).
COUNTIES_URL = (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/"
    "Generalized_ACS2023/State_County/MapServer/13/query"
)

# Filesystem-safe slug from a program code (preserves `/` and `-` specially).
def slug(code: str) -> str:
    return code.replace("/", "-").replace(" ", "_")


def clean(v: str) -> float:
    # -999 = missing data; NA = program didn't exist in that year.
    if v in ("", "-999", "NA"):
        return 0.0
    try:
        return float(v)
    except ValueError:
        return 0.0


def fetch_counties() -> dict:
    """Fetch western-state county polygons from Census TIGER."""
    states = ",".join(f"'{s}'" for s in STATE_FIPS)
    params = {
        "where": f"STATE IN ({states})",
        "outFields": "GEOID,NAME,STATE",
        "outSR": "4326",
        "f": "geojson",
        "resultRecordCount": "2000",
    }
    url = f"{COUNTIES_URL}?{urllib.parse.urlencode(params)}"
    body = fetch(url)
    return json.loads(body)


def main() -> None:
    body = fetch(CSV_URL)
    reader = csv.DictReader(io.StringIO(body))

    # Two passes over the CSV (it's all in memory once parsed):
    # (a) year → program_code → sum (for the aggregated chart)
    # (b) program_code → fips → year → value (for the county choropleth)
    agg: dict[int, dict[str, float]] = {}
    per_county: dict[str, dict[str, dict[int, float]]] = {
        code: {} for code, _ in PROGRAMS
    }
    # Incidentally collect county display names for the popup.
    county_names: dict[str, str] = {}

    for row in reader:
        try:
            year = int(row["YEAR"])
        except (KeyError, ValueError):
            continue
        try:
            fips_int = int(row["FIPS"])
        except (KeyError, ValueError):
            continue
        fips = f"{fips_int:05d}"
        county_names.setdefault(fips, f"{row.get('COUNTY','?')}, {row.get('STATE','?')}")

        bucket = agg.setdefault(year, {code: 0.0 for code, _ in PROGRAMS})
        for code, _label in PROGRAMS:
            v = clean(row.get(code, ""))
            bucket[code] += v
            if v:
                per_county[code].setdefault(fips, {})[year] = v

    years = sorted(agg)

    # ── (1) Year-aggregated line-chart data ──────────────────────────
    data = []
    for y in years:
        row = {"year": y}
        for code, _label in PROGRAMS:
            row[code] = round(agg[y][code] / 1e6, 2)  # millions
        data.append(row)
    write_json(DATA_DIR / "follow-the-money.json", {
        "title": "Federal payments to western counties (2020 dollars)",
        "unit": "USD, millions (2020)",
        "years": [years[0], years[-1]] if years else [],
        "data": data,
        "programs": [{"code": c, "label": l} for c, l in PROGRAMS],
        "source": (
            "Taylor et al., Follow the Money (Stanford Spatial History, "
            "2016). CC BY-NC 4.0. Re-aggregated."
        ),
    })

    # ── (2) Per-program per-county files ────────────────────────────
    program_meta = []
    for code, label in PROGRAMS:
        fc = per_county[code]
        # Interleaved [year, thousands, year, thousands, ...] keeps JSON
        # compact and easy to iterate in the browser.
        compact: dict[str, list] = {}
        max_val = 0.0
        first_year: int | None = None
        for fips, yearmap in fc.items():
            pairs = []
            for y in sorted(yearmap):
                v = yearmap[y]
                if v <= 0:
                    continue
                # Round to thousands of dollars (integer).
                thousands = int(round(v / 1000))
                if thousands <= 0:
                    continue
                pairs.extend([y, thousands])
                if thousands > max_val:
                    max_val = thousands
                if first_year is None or y < first_year:
                    first_year = y
            if pairs:
                compact[fips] = pairs
        out = {
            "program": code,
            "label": label,
            "unit": "thousands of 2020 dollars",
            "year_range": [first_year if first_year else years[0], years[-1]],
            "max_value": int(max_val),
            "counties": compact,
        }
        path = DATA_DIR / f"ftm-payments-{slug(code)}.json"
        write_json(path, out)
        program_meta.append({
            "code": code,
            "label": label,
            "slug": slug(code),
            "first_year": first_year if first_year else years[0],
            "max_value": int(max_val),
        })

    # Manifest that the JS viz can read to build the program dropdown.
    write_json(DATA_DIR / "ftm-payments-manifest.json", {
        "programs": program_meta,
        "years": [years[0], years[-1]],
        "unit": "thousands of 2020 dollars",
        "source": (
            "Taylor et al., Follow the Money (Stanford Spatial History, "
            "2016). CC BY-NC 4.0."
        ),
    })

    # ── (3) County polygons (11 western states) ─────────────────────
    fc = fetch_counties()
    for feat in fc.get("features", []):
        p = feat.get("properties", {}) or {}
        geoid = p.get("GEOID") or ""
        # Normalize property keys and tack on the display name from the
        # payments data (which includes the state, handy for popups).
        feat["properties"] = {
            "fips":  geoid,
            "name":  county_names.get(geoid, p.get("NAME") or geoid),
            "state": p.get("STATE") or "",
        }
    fc["source"] = (
        "U.S. Census Bureau, TIGERweb Generalized_ACS2023 (20M cartographic). "
        "Filtered to 11 western states in the Follow the Money dataset."
    )
    write_json(DATA_DIR / "ftm-counties.geojson", fc)

    # Spot-check
    print(f"\nyears: {years[0]}–{years[-1]} ({len(years)})")
    print(f"counties (geom): {len(fc.get('features', []))}")
    for meta in program_meta:
        print(f"  {meta['code']:<8} first {meta['first_year']}  max ${meta['max_value']:,}K")


if __name__ == "__main__":
    main()
