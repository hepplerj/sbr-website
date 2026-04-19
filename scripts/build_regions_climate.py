#!/usr/bin/env python3
"""Build ``static/data/regions-precipitation.json`` and ``regions-temperature.json``.

Four NOAA Climate at a Glance regions covering the Plains, Intermountain
West, and Pacific states — read as a stacked-stripes chart to surface
regional drought patterns that average out at CONUS scale.

Regions covered:
  105  Northern Rockies & Plains  (MT, WY, NE, ND, SD)
  107  Southwest                  (AZ, CO, NM, UT)
  108  Northwest                  (ID, OR, WA)
  109  West                       (CA, NV)

Source CSVs (one per region per variable):
  https://www.ncei.noaa.gov/cag/regional/time-series/{region}-{var}-all-12-1895-2024.csv

Precipitation aggregates as an annual SUM; temperature as an annual MEAN.
Baselines use 1901-2000 (NOAA convention).

Run: ``python scripts/build_regions_climate.py``
"""

from __future__ import annotations

import csv
import io
from collections import defaultdict

from _common import DATA_DIR, fetch, write_json

REGIONS = [
    {
        "code": "105",
        "slug": "northern-rockies-plains",
        "label": "Northern Rockies & Plains",
        "states": ["Montana", "Wyoming", "Nebraska", "North Dakota", "South Dakota"],
    },
    {
        "code": "107",
        "slug": "southwest",
        "label": "Southwest",
        "states": ["Arizona", "Colorado", "New Mexico", "Utah"],
    },
    {
        "code": "108",
        "slug": "northwest",
        "label": "Northwest",
        "states": ["Idaho", "Oregon", "Washington"],
    },
    {
        "code": "109",
        "slug": "west",
        "label": "West",
        "states": ["California", "Nevada"],
    },
]

URL_TMPL = "https://www.ncei.noaa.gov/cag/regional/time-series/{code}-{var}-all-12-1895-2024.csv"


def fetch_monthly(code: str, var: str) -> dict[int, list[float]]:
    """Fetch a region's monthly series and bucket values by year."""
    body = fetch(URL_TMPL.format(code=code, var=var))
    months: dict[int, list[float]] = defaultdict(list)
    reading = False
    for row in csv.reader(io.StringIO(body)):
        if not row:
            continue
        if not reading:
            if row[0] == "Date":
                reading = True
            continue
        date, val = row[:2]
        months[int(date[:4])].append(float(val))
    return months


def aggregate(months: dict[int, list[float]], *, agg: str) -> dict[int, float]:
    """Aggregate monthly values to annual. ``agg`` is 'sum' (precip) or 'mean' (temp)."""
    out: dict[int, float] = {}
    for y, vs in months.items():
        if len(vs) != 12:
            continue
        out[y] = sum(vs) if agg == "sum" else sum(vs) / 12.0
    return out


def baseline_mean(series: dict[int, float], start: int = 1901, end: int = 2000) -> float:
    years = [y for y in series if start <= y <= end]
    return sum(series[y] for y in years) / len(years)


def build(var: str, agg: str, unit: str, val_key: str, out_name: str) -> None:
    regions_out = []
    for meta in REGIONS:
        monthly = fetch_monthly(meta["code"], var)
        annual = aggregate(monthly, agg=agg)
        base = baseline_mean(annual)
        data = [
            {
                "year": y,
                val_key: round(annual[y], 2),
                "anomaly": round(annual[y] - base, 2),
            }
            for y in sorted(annual)
        ]
        regions_out.append({
            **meta,
            "baseline": {"start": 1901, "end": 2000, "value": round(base, 2)},
            "data": data,
        })

    out = {
        "variable": var,
        "units": unit,
        "source": (
            "NOAA NCEI Climate at a Glance, regional time series "
            "(nClimDiv), aggregated from monthly data."
        ),
        "regions": regions_out,
    }
    write_json(DATA_DIR / out_name, out)


def main() -> None:
    build(var="pcp",  agg="sum",  unit="inches",     val_key="pcp_in",  out_name="regions-precipitation.json")
    build(var="tavg", agg="mean", unit="Fahrenheit", val_key="tavg_f",  out_name="regions-temperature.json")


if __name__ == "__main__":
    main()
