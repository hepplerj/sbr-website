#!/usr/bin/env python3
"""Build ``static/data/wildfire.json``.

Annual United States wildland-fire totals — number of fires and acres
burned — from the National Interagency Fire Center (NIFC). Framed for
the project's climate-and-land thread: acres burned have climbed steeply
since the 1990s while the *number* of fires has stayed roughly flat, so
the fires aren't more numerous — they're bigger. That divergence sits
downstream of the warming and drying the project's climate sightlines
already chart, and upstream of the modern "the feds mismanage the
forests" grievance.

Data
----
Transcribed from the NIFC "Total Wildland Fires and Acres" table:
    https://www.nifc.gov/fire-information/statistics/wildfires
Retrieved June 2026; covers 1983–2025.

Caveats (per NIFC):
  - **No official data before 1983.** Prior to 1983 the federal wildland
    fire agencies did not track wildfire data with the current reporting
    process, so earlier "Smokey Bear era" estimates are not directly
    comparable and are excluded here.
  - **2004 acreage excludes North Carolina state lands** (a reporting
    gap that year); the figure is marked with a note in the data.

The table is embedded rather than fetched: NIFC publishes it as an HTML
page / PDF with no stable machine-readable endpoint, and the historical
figures are stable. Re-verify against the NIFC table if extending the
series.

Run: ``python scripts/build_wildfire.py``
"""

from __future__ import annotations

from _common import DATA_DIR, write_json

# (year, fires, acres) — NIFC "Total Wildland Fires and Acres," 1983–2025.
ROWS = [
    (1983, 18229, 1323666),
    (1984, 20493, 1148409),
    (1985, 82591, 2896147),
    (1986, 85907, 2719162),
    (1987, 71300, 2447296),
    (1988, 72750, 5009290),
    (1989, 48949, 1827310),
    (1990, 66481, 4621621),
    (1991, 75754, 2953578),
    (1992, 87394, 2069929),
    (1993, 58810, 1797574),
    (1994, 79107, 4073579),
    (1995, 82234, 1840546),
    (1996, 96363, 6065998),
    (1997, 66196, 2856959),
    (1998, 81043, 1329704),
    (1999, 92487, 5626093),
    (2000, 92250, 7393493),
    (2001, 84079, 3570911),
    (2002, 73457, 7184712),
    (2003, 63629, 3960842),
    (2004, 65461, 8097880),   # acreage excludes NC state lands
    (2005, 66753, 8689389),
    (2006, 96385, 9873745),
    (2007, 85705, 9328045),
    (2008, 78979, 5292468),
    (2009, 78792, 5921786),
    (2010, 71971, 3422724),
    (2011, 74126, 8711367),
    (2012, 67774, 9326238),
    (2013, 47579, 4319546),
    (2014, 63312, 3595613),
    (2015, 68151, 10125149),
    (2016, 67743, 5509995),
    (2017, 71499, 10026086),
    (2018, 58083, 8767492),
    (2019, 50477, 4664364),
    (2020, 58950, 10122336),
    (2021, 58985, 7125643),
    (2022, 68988, 7577183),
    (2023, 56580, 2693910),
    (2024, 64897, 8924884),
    (2025, 77850, 5131474),
]

# Years where the acreage figure carries a reporting caveat.
NOTES = {
    2004: "Acreage excludes North Carolina state lands (a reporting gap that year).",
}


def main() -> None:
    data = []
    for year, fires, acres in ROWS:
        row = {"year": year, "fires": fires, "acres": acres}
        if year in NOTES:
            row["note"] = NOTES[year]
        data.append(row)

    out = {
        "title": "U.S. wildland fires and acres burned, 1983–2025",
        "source": (
            "National Interagency Fire Center (NIFC), 'Total Wildland Fires and Acres,' "
            "https://www.nifc.gov/fire-information/statistics/wildfires (retrieved June 2026). "
            "No official data before 1983; 2004 acreage excludes North Carolina state lands."
        ),
        "data": data,
    }
    write_json(DATA_DIR / "wildfire.json", out)


if __name__ == "__main__":
    main()
