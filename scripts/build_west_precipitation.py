#!/usr/bin/env python3
"""Build ``static/data/west-precipitation.json``.

Annual precipitation for the eleven western public-land states (AZ, CA,
CO, ID, MT, NV, NM, OR, UT, WA, WY), 1895–2024, as an area-weighted mean
of the statewide totals, with anomalies against the 1901–2000 baseline
(NOAA convention).

Why not the contiguous-US series: since 2000 the national total runs
*above* the baseline because the Northeast, Midwest and Ohio Valley got
wetter, which hides the drying of the Southwest, California–Nevada and
the Northwest. A western series shows the West.

Weights are each state's land area (U.S. Census Bureau, 2010, square
miles), standing in for NOAA's gridded area weighting.

Source CSVs (NOAA NCEI Climate at a Glance, statewide, 12-month totals
ending December — i.e. calendar-year precipitation, inches):
  https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/statewide/time-series/{code}/pcp/12/12/1895-2024.csv

Run: ``python scripts/build_west_precipitation.py``
"""

from __future__ import annotations

import csv
import io

from _common import DATA_DIR, fetch, write_json

URL_TMPL = (
    "https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/"
    "statewide/time-series/{code}/pcp/12/12/1895-2024.csv"
)

# (NOAA CAG state code, name, land area in sq mi — Census 2010)
STATES = [
    (2,  "Arizona",    113_594),
    (4,  "California", 155_779),
    (5,  "Colorado",   103_642),
    (10, "Idaho",       82_643),
    (24, "Montana",    145_546),
    (26, "Nevada",     109_781),
    (29, "New Mexico", 121_298),
    (35, "Oregon",      95_988),
    (42, "Utah",        82_170),
    (45, "Washington",  66_456),
    (48, "Wyoming",     97_093),
]


def _annual(body: str, name: str) -> dict[int, float]:
    """NOAA 12-month-total CSV → {year: inches}. Checks the state header."""
    if f"{name} January-December Precipitation" not in body:
        raise SystemExit(f"unexpected NOAA header for {name}: {body[:120]!r}")
    out: dict[int, float] = {}
    reading = False
    for row in csv.reader(io.StringIO(body)):
        if not row:
            continue
        if not reading:
            reading = row[0] == "Date"
            continue
        out[int(row[0][:4])] = float(row[1])
    return out


def main() -> None:
    series = {name: _annual(fetch(URL_TMPL.format(code=code)), name)
              for code, name, _ in STATES}
    total_area = sum(area for _, _, area in STATES)
    years = sorted(set.intersection(*(set(s) for s in series.values())))
    annual = {
        y: sum(series[name][y] * area for _, name, area in STATES) / total_area
        for y in years
    }

    base_years = [y for y in years if 1901 <= y <= 2000]
    baseline = sum(annual[y] for y in base_years) / len(base_years)

    out = {
        "region": "Eleven western states (AZ, CA, CO, ID, MT, NV, NM, OR, UT, WA, WY)",
        "source": (
            "NOAA NCEI Climate at a Glance, statewide annual precipitation, "
            "area-weighted by state land area (Census 2010)."
        ),
        "units": "inches",
        "baseline": {"start": 1901, "end": 2000, "value": round(baseline, 2)},
        "data": [
            {
                "year": y,
                "pcp_in": round(annual[y], 2),
                "anomaly_in": round(annual[y] - baseline, 2),
            }
            for y in years
        ],
    }
    write_json(DATA_DIR / "west-precipitation.json", out)


if __name__ == "__main__":
    main()
