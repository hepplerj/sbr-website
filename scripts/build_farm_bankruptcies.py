#!/usr/bin/env python3
"""Build ``static/data/farm-bankruptcies.json``.

Combined US farmer-bankruptcy series, 1899–2024, plus a West-and-Plains
state aggregate for the years that have district-level Chapter 12 data
(1996–2024). Compiled from:

  - ``0-data/uscourts/historical_bankruptcies.csv`` in Dinterman's
    ``historical-bankruptcies`` repo, which carries Jerry Stam's USDA ERS
    compilation of farmer-specific filings 1899–1979 (under pre-Chapter 12
    Chapters 7 and 11) together with Chapter 12 counts from 1987 forward.
  - ``1-tidy/bankruptcy/national_annual.csv`` in the same repo — the
    authoritative Chapter 12 national series 1987–2024.
  - ``1-tidy/bankruptcy/district_quarterly.csv`` — Chapter 12 by judicial
    district 1995–present, aggregated here to the 15 Western and Plains
    states that are this project's regional focus.

The years 1980–1986 appear as null in ``national_annual`` because
farmer-specific bankruptcy filings were not separately tabulated before
Chapter 12's October 1986 creation; farmers filed under Chapters 7 and
11 alongside other small businesses.

Run: ``python scripts/build_farm_bankruptcies.py``
"""

from __future__ import annotations

import csv
import io
from collections import defaultdict

from _common import DATA_DIR, fetch, write_json

REPO = "https://raw.githubusercontent.com/rdinter/historical-bankruptcies/master"
HISTORICAL_URL       = f"{REPO}/0-data/uscourts/historical_bankruptcies.csv"
NATIONAL_ANNUAL_URL  = f"{REPO}/1-tidy/bankruptcy/national_annual.csv"
DISTRICT_QUARTER_URL = f"{REPO}/1-tidy/bankruptcy/district_quarterly.csv"

WEST_PLAINS = [
    "ARIZONA", "CALIFORNIA", "COLORADO", "IDAHO", "KANSAS",
    "MONTANA", "NEBRASKA", "NEVADA", "NEW MEXICO", "NORTH DAKOTA",
    "OREGON", "SOUTH DAKOTA", "UTAH", "WASHINGTON", "WYOMING",
]


def _rows(body: str) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(body)))


def main() -> None:
    hist = _rows(fetch(HISTORICAL_URL))
    hist_by_year: dict[int, dict] = {}
    for r in hist:
        y = int(r["year"])
        bk = (r.get("bankruptcies") or "").strip()
        farms = (r.get("farms") or "").strip()
        hist_by_year[y] = {
            "bankruptcies": int(bk) if bk else None,
            "farms": int(farms) if farms else None,
        }

    ch12_national: dict[int, int] = {}
    for r in _rows(fetch(NATIONAL_ANNUAL_URL)):
        y = int(r["YEAR"])
        ch12_national[y] = int(float(r.get("CHAP_12") or 0))

    national_annual = []
    for y in range(1899, 2025):
        row: dict = {"year": y}
        if y <= 1986:
            row["count"] = hist_by_year.get(y, {}).get("bankruptcies")
        else:
            row["count"] = ch12_national.get(y)
        farms = hist_by_year.get(y, {}).get("farms")
        if farms is not None:
            row["farms"] = farms
        national_annual.append(row)

    # West/Plains annual from district-quarterly data
    state_year: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    for r in _rows(fetch(DISTRICT_QUARTER_URL)):
        st = r["STATE"]
        if st not in WEST_PLAINS:
            continue
        y = int(r["DATE"][:4])
        state_year[st][y] += int(float(r["CHAP_12"] or 0))

    years = list(range(1996, 2025))
    west_plains_annual = [
        {"year": y, "count": sum(state_year[s].get(y, 0) for s in WEST_PLAINS)}
        for y in years
    ]

    # Per-state annual, ordered by total filings descending. Readable labels
    # (Nebraska, not NEBRASKA) — the source CSV uses uppercase.
    by_state = sorted(
        (
            {
                "code": state,
                "label": state.title().replace(" ", " "),
                "total": sum(state_year[state].values()),
                "data": [{"year": y, "count": state_year[state].get(y, 0)} for y in years],
            }
            for state in WEST_PLAINS
        ),
        key=lambda s: s["total"],
        reverse=True,
    )

    out = {
        "title": "Farmer bankruptcy filings, 1899–2024",
        "source": (
            "Compiled from Dinterman, 'historical-bankruptcies' "
            "(https://github.com/rdinter/historical-bankruptcies). Pre-1987 "
            "counts are Jerry Stam's USDA ERS compilation of farmer-specific "
            "filings under Chapters 7 and 11; 1987–2024 counts are Chapter 12 "
            "(family farmer) filings from US Courts Table F-2. Data for "
            "1980–1986 is sparse because pre-Chapter 12 federal bankruptcy "
            "statistics did not separate farmer filings from other "
            "small-business filings."
        ),
        "national_annual": national_annual,
        "west_plains_annual": west_plains_annual,
        "west_plains_states": WEST_PLAINS,
        "by_state": by_state,
    }
    write_json(DATA_DIR / "farm-bankruptcies.json", out)


if __name__ == "__main__":
    main()
