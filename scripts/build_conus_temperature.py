#!/usr/bin/env python3
"""Build ``static/data/conus-temperature.json``.

Annual contiguous-US mean temperature anomalies, 1895–2024, against the
1901–2000 baseline (standard NOAA convention). Aggregated from NOAA NCEI
Climate at a Glance monthly tavg series, national region code 110.

Source CSV:
  https://www.ncei.noaa.gov/cag/national/time-series/110-tavg-all-12-1895-2024.csv

Run: ``python scripts/build_conus_temperature.py``
"""

from __future__ import annotations

import csv
import io
from collections import defaultdict

from _common import DATA_DIR, fetch, write_json

URL = "https://www.ncei.noaa.gov/cag/national/time-series/110-tavg-all-12-1895-2024.csv"


def main() -> None:
    body = fetch(URL)

    # The NOAA CSV begins with two comment lines (# ...), then a header row.
    monthly: dict[int, list[float]] = defaultdict(list)
    reading = False
    for row in csv.reader(io.StringIO(body)):
        if not row:
            continue
        if not reading:
            if row[0] == "Date":
                reading = True
            continue
        date, val = row[:2]
        year = int(date[:4])
        monthly[year].append(float(val))

    # Only keep years with all 12 months reported
    annual = {y: sum(vs) / len(vs) for y, vs in monthly.items() if len(vs) == 12}
    years = sorted(annual)

    base_years = [y for y in years if 1901 <= y <= 2000]
    baseline = sum(annual[y] for y in base_years) / len(base_years)

    series = [
        {
            "year": y,
            "tavg_f": round(annual[y], 2),
            "anomaly_f": round(annual[y] - baseline, 2),
        }
        for y in years
    ]

    out = {
        "region": "Contiguous United States",
        "source": (
            "NOAA NCEI Climate at a Glance, national time series (region 110), "
            "annual averages computed from monthly data."
        ),
        "units": "Fahrenheit",
        "baseline": {"start": 1901, "end": 2000, "value": round(baseline, 2)},
        "data": series,
    }
    write_json(DATA_DIR / "conus-temperature.json", out)


if __name__ == "__main__":
    main()
