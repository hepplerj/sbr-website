#!/usr/bin/env python3
"""Build ``static/data/farm-foreclosures.json``.

USDA farm-transfer rates (transfers per 1,000 of all farms, by method),
annual 1913-1981, from the discontinued BAE/ERS farm real estate
transfer series. Unlike the other pipelines this one has no fetch step:
the series died in 1981, a decade before USDA published anything
electronically, so it exists only in scanned page images. The numbers
were hand-transcribed into ``scripts/data/usda_farm_transfers.csv``
from the cumulative national tables in three annual *Agricultural
Statistics* volumes (scans at https://esmis.nal.usda.gov, publication
j3860694x), using the latest-published (revised) value for each year:

  - 1913-1954 — *Agricultural Statistics 1957*, table 634, p. 528
  - 1955-1965 — *Agricultural Statistics 1967*, table 638, p. 517
  - 1966-1981 — *Agricultural Statistics 1981*, table 607, p. 421

Each CSV row carries its source table in the ``source`` column. The
transcription was verified against the page images and against the
overlapping year-ranges of the three tables (and, for 1926-1945,
against series E 6-11 in *Historical Statistics of the United States,
1789-1945*, which prints an earlier revision of the same series).

Column notes, from the source tables' own footnotes:

  - ``foreclosures`` includes foreclosures, assignments, bankruptcies,
    and related defaults.
  - ``other`` includes inheritances and gifts, administrators' and
    executors' sales, and miscellaneous or unclassified transfers;
    not published before 1927.
  - ``tax_sales`` not published before 1927; discontinued as a
    separate category after 1969.
  - Years are 12-month periods ending March 15 (through 1957),
    March 1 (1958-1975), or February 1 (1976-1981). Alaska and Hawaii
    are excluded from 1966 forward.
  - The 1925 census-year estimate exists only in the 1913-24-plus-1925
    early revisions; the value here (25.5 / 16.7) is from the 1957
    volume's table, which carries it.

Alongside each rate the output carries an estimated absolute count
(``*_n`` fields): rate x annual farm numbers / 1,000, rounded to the
nearest hundred so the derived values don't pretend to more precision
than the two-significant-digit rates carry. Farm numbers come from the
same Dinterman ``historical-bankruptcies`` CSV the farm-bankruptcies
pipeline uses, so the two charts share their denominator source. The
1933 estimate (~256,000 farms lost to foreclosure) squares with the
"more than 200,000" figure standard in the literature.

Run: ``python scripts/build_farm_foreclosures.py``
"""

from __future__ import annotations

import csv
import io
from pathlib import Path

from _common import DATA_DIR, fetch, write_json

CSV_PATH = Path(__file__).parent / "data" / "usda_farm_transfers.csv"

FARMS_URL = (
    "https://raw.githubusercontent.com/rdinter/historical-bankruptcies"
    "/master/0-data/uscourts/historical_bankruptcies.csv"
)

SOURCE = (
    "Hand-transcribed from the USDA farm real estate transfer series "
    "(transfers per 1,000 of all farms), discontinued after 1981. "
    "1913-1954: Agricultural Statistics 1957, table 634; 1955-1965: "
    "Agricultural Statistics 1967, table 638; 1966-1981: Agricultural "
    "Statistics 1981, table 607. Scans: https://esmis.nal.usda.gov "
    "(publication j3860694x). Transcription: scripts/data/"
    "usda_farm_transfers.csv (per-row source tables). Estimated counts "
    "(*_n fields) are rate x annual farm numbers (Dinterman, "
    "'historical-bankruptcies'), rounded to the nearest hundred."
)

FIELDS = ("voluntary", "foreclosures", "tax_sales", "other", "total")


def main() -> None:
    farms_by_year: dict[int, int] = {}
    for rec in csv.DictReader(io.StringIO(fetch(FARMS_URL))):
        v = (rec.get("farms") or "").strip()
        if v:
            farms_by_year[int(rec["year"])] = int(v)

    rows = []
    with open(CSV_PATH, newline="") as fh:
        for rec in csv.DictReader(fh):
            year = int(rec["year"])
            row = {"year": year, "farms": farms_by_year.get(year)}
            for f in FIELDS:
                v = (rec.get(f) or "").strip()
                rate = float(v) if v else None
                row[f] = rate
                if rate is not None and row["farms"]:
                    row[f + "_n"] = round(rate * row["farms"] / 1000 / 100) * 100
                else:
                    row[f + "_n"] = None
            rows.append(row)
    rows.sort(key=lambda r: r["year"])

    years = [r["year"] for r in rows]
    assert years == list(range(1913, 1982)), "expected continuous 1913-1981"
    assert all(r["foreclosures"] is not None for r in rows)
    assert all(r["farms"] is not None for r in rows), "missing farm counts"

    write_json(
        DATA_DIR / "farm-foreclosures.json",
        {
            "title": "Farm transfers per 1,000 farms, 1913–1981",
            "source": SOURCE,
            "series": rows,
        },
    )


if __name__ == "__main__":
    main()
