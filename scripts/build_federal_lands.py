#!/usr/bin/env python3
"""Build ``static/data/federal-lands.geojson``.

A 14-state choropleth of federal-land ownership share across the American
West and Northern Plains. State polygons come from a well-known public
US-states GeoJSON; the ``federal_pct`` property is a compiled all-agency
total (BLM + USFS + NPS + FWS + DoD) sourced from the Congressional
Research Service, *Federal Land Ownership: Overview and Data* (CRS R42346).

Run: ``python scripts/build_federal_lands.py``
"""

from __future__ import annotations

import json

from _common import DATA_DIR, fetch, write_json

STATES_URL = (
    "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"
)

# Federal ownership share, all agencies combined. Intermountain West and
# Pacific values trace to the CRS report; Northern Plains values (NE/ND/SD)
# added here as the project's regional focus widened east.
FEDERAL_PCT = {
    "Nevada":       80.1,
    "Utah":         63.1,
    "Idaho":        61.6,
    "Oregon":       52.9,
    "Wyoming":      46.7,
    "California":   45.8,
    "Arizona":      38.6,
    "Colorado":     35.9,
    "New Mexico":   34.7,
    "Montana":      29.0,
    "Washington":   28.6,
    "South Dakota":  5.4,
    "North Dakota":  3.9,
    "Nebraska":      1.1,
}


def main() -> None:
    fc = json.loads(fetch(STATES_URL))

    kept = [
        {
            "type": "Feature",
            "properties": {
                "name": f["properties"]["name"],
                "federal_pct": FEDERAL_PCT[f["properties"]["name"]],
            },
            "geometry": f["geometry"],
        }
        for f in fc["features"]
        if f["properties"]["name"] in FEDERAL_PCT
    ]

    out = {"type": "FeatureCollection", "features": kept}
    write_json(DATA_DIR / "federal-lands.geojson", out)


if __name__ == "__main__":
    main()
