#!/usr/bin/env python3
"""Build ``static/data/climate-space.json``.

A *derived* dataset that joins annual temperature and precipitation
anomalies by year for the "climate space" trajectory sightline. Where
the warming-stripes chart shows temperature alone and the drying-stripes
chart shows precipitation alone, this plots each year as a point in
two-axis space — temperature anomaly (x) against precipitation anomaly
(y) — so the *compound* drift toward the hot-and-dry quadrant becomes
visible. That hot-dry corner is the regime that drives the West's fire
and farm-stress crises.

The four-region overlay
-----------------------
The dataset carries all four NOAA Western climate regions so the
sightline can overlay their decade-average drift paths on one shared
plot. The point is the divergence: the Southwest, West, and Northwest
all march into the hot-dry quadrant since ~1990, but the Northern
Rockies & Plains warms *without* drying — it takes a different road.
"The West" is not one climate trajectory.

(Why not CONUS: at the national scale the hot-dry compound washes out —
the wetter East offsets the drying interior West. The signal is
regional.)

Source
------
Joins the two already-built regional climate files:
  - static/data/regions-temperature.json   (per-region anomaly, °F)
  - static/data/regions-precipitation.json (per-region anomaly, in)
Both derive from NOAA NCEI Climate at a Glance, against the 1901–2000
baseline. Run build_regions_climate.py first if those files are missing.

Run: ``python scripts/build_climate_space.py``
"""

from __future__ import annotations

import json

from _common import DATA_DIR, write_json

# NOAA Western climate regions to include, in plot/legend order. The
# Southwest leads (sharpest hot-dry drift, most project-relevant); the
# Northern Rockies & Plains is last as the contrast case.
REGION_ORDER = ["Southwest", "West", "Northwest", "Northern Rockies & Plains"]


def _load(name: str) -> dict:
    return json.loads((DATA_DIR / name).read_text())


def _region(doc: dict, label: str) -> dict:
    for r in doc["regions"]:
        if r["label"] == label:
            return r
    raise SystemExit(f"region {label!r} not found in dataset")


def main() -> None:
    temp_doc = _load("regions-temperature.json")
    pcp_doc = _load("regions-precipitation.json")

    regions = []
    for label in REGION_ORDER:
        rt = _region(temp_doc, label)
        rp = _region(pcp_doc, label)
        tb = {row["year"]: row["anomaly"] for row in rt["data"]}
        pb = {row["year"]: row["anomaly"] for row in rp["data"]}
        years = sorted(set(tb) & set(pb))
        regions.append({
            "label": label,
            "slug": rt["slug"],
            "states": rt.get("states", []),
            "data": [
                {"year": y, "temp": round(tb[y], 2), "precip": round(pb[y], 2)}
                for y in years
            ],
        })

    out = {
        "title": "Western climate space: temperature vs. precipitation anomaly, by region",
        "source": (
            "Derived join of NOAA NCEI Climate at a Glance annual temperature and precipitation "
            "anomalies for the four Western climate regions, against the 1901–2000 baseline. "
            "See build_regions_climate.py."
        ),
        "xlabel": "Temperature anomaly (°F)",
        "ylabel": "Precipitation anomaly (in)",
        "regions": regions,
    }
    write_json(DATA_DIR / "climate-space.json", out)


if __name__ == "__main__":
    main()
