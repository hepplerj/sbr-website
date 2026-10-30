#!/usr/bin/env python3
"""Build ``static/data/states-temperature.json``.

Per-state annual mean-temperature anomalies for the Western and Plains
states, ordered north → south by centroid latitude, for a latitude-by-
time heatmap (a Hovmöller-style diagram). Where the warming-stripes
chart shows one CONUS series, this stacks the states so the spatial
structure of the warming is visible: the whole grid reddens toward the
right, and you can read which latitudes warm first and hardest.

Modeled on the global-surface-temperature-by-latitude visualization, but
for the project's geography. NOAA Climate at a Glance does not publish
clean latitude bands for the region, so states ordered by latitude are
the faithful stand-in.

Source
------
NOAA NCEI Climate at a Glance, statewide monthly average-temperature
series (one CSV per state, by NOAA state code):
  https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/statewide/time-series/{code}-tavg-all-12-1895-2024.csv
Annual means are computed from the monthly values; anomalies are against
the 1901–2000 baseline (NOAA convention), per state.

Run: ``python scripts/build_states_temperature.py``
"""

from __future__ import annotations

import csv
import io

from _common import DATA_DIR, fetch, write_json

URL_TMPL = (
    "https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/"
    "statewide/time-series/{code}-tavg-all-12-1895-2024.csv"
)

# (NOAA CAG state code, name, abbr, approx centroid latitude). Codes are
# alphabetical 1–48 for the lower 48. Ordered here north → south by
# centroid latitude — the order the heatmap rows render top to bottom.
STATES = [
    (32, "North Dakota", "ND", 47.4),
    (45, "Washington",   "WA", 47.4),
    (24, "Montana",      "MT", 47.0),
    (39, "South Dakota", "SD", 44.4),
    (10, "Idaho",        "ID", 44.4),
    (35, "Oregon",       "OR", 44.0),
    (48, "Wyoming",      "WY", 43.0),
    (25, "Nebraska",     "NE", 41.5),
    (26, "Nevada",       "NV", 39.3),
    (42, "Utah",         "UT", 39.3),
    (5,  "Colorado",     "CO", 39.0),
    (14, "Kansas",       "KS", 38.5),
    (4,  "California",   "CA", 37.2),
    (34, "Oklahoma",     "OK", 35.5),
    (29, "New Mexico",   "NM", 34.4),
    (2,  "Arizona",      "AZ", 34.3),
    (41, "Texas",        "TX", 31.5),
]


def _annual_anomalies(body: str) -> dict[int, float]:
    """NOAA monthly CSV → {year: anomaly_f vs 1901–2000}."""
    monthly: dict[int, list[float]] = {}
    reading = False
    for row in csv.reader(io.StringIO(body)):
        if not row:
            continue
        if not reading:
            if row[0] == "Date":
                reading = True
            continue
        date, val = row[:2]
        monthly.setdefault(int(date[:4]), []).append(float(val))
    annual = {y: sum(vs) / len(vs) for y, vs in monthly.items() if len(vs) == 12}
    base = [annual[y] for y in annual if 1901 <= y <= 2000]
    baseline = sum(base) / len(base)
    return {y: round(annual[y] - baseline, 2) for y in annual}


def main() -> None:
    rows = []
    all_years: set[int] = set()
    for code, name, abbr, lat in STATES:
        print(f"  fetching {name} (code {code})…", flush=True)
        anoms = _annual_anomalies(fetch(URL_TMPL.format(code=code)))
        all_years |= set(anoms)
        rows.append({"state": name, "abbr": abbr, "lat": lat, "_anoms": anoms})

    years = sorted(all_years)
    out_rows = [
        {
            "state": r["state"],
            "abbr": r["abbr"],
            "lat": r["lat"],
            # anomaly per year, aligned to the shared `years` list (null if missing)
            "anomalies": [r["_anoms"].get(y) for y in years],
        }
        for r in rows
    ]

    out = {
        "title": "Western & Plains state temperature anomalies, by latitude, 1895–2024",
        "source": (
            "NOAA NCEI Climate at a Glance, statewide annual mean-temperature anomalies "
            "against the 1901–2000 baseline. States ordered north → south by centroid latitude."
        ),
        "units": "Fahrenheit",
        "baseline": {"start": 1901, "end": 2000},
        "years": years,
        "rows": out_rows,
    }
    write_json(DATA_DIR / "states-temperature.json", out)


if __name__ == "__main__":
    main()
