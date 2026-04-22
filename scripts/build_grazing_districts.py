#!/usr/bin/env python3
"""Build ``static/data/grazing-districts.geojson``.

The 93 Taylor Grazing Act (1934) district boundaries — the BLM's
administrative containers for federal-range grazing in the American
West. The districts predate nearly every sagebrush-rebellion grievance;
they are the administrative geography the movement has been arguing
about for ninety years.

Source: BLM National GIS / BLM Egis ArcGIS hub,
"BLM National Taylor Grazing Act District Boundaries Polygons"
FeatureServer. Free, no API key.

Each district carries name, number, administrative state, BLM acreage
(where populated), and an effective date (when the district was
formally organized under the 1934 Act — most were established
1934–1945, a few later).

Geometry is simplified (maxAllowableOffset ~0.01°) for web delivery.

Run: ``python scripts/build_grazing_districts.py``
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from _common import DATA_DIR, fetch, write_json

BASE = (
    "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/"
    "Taylor_Grazing_Act_District_Boundaries_Polygons/FeatureServer/0/query"
)
PARAMS = {
    "where": "1=1",
    "outFields": "TGA_NAME,TGA_NR,ADMIN_ST,BLM_ACRES,TGA_EFF_DT,LOCAL_TGA_ID",
    "outSR": "4326",
    "maxAllowableOffset": "0.01",
    "f": "geojson",
    "resultRecordCount": "2000",
}


def main() -> None:
    qs = "&".join(f"{k}={v}" for k, v in PARAMS.items())
    url = f"{BASE}?{qs}"
    body = fetch(url)
    fc = json.loads(body)
    features = fc.get("features", [])

    # Normalize properties: strip nulls, convert TGA_EFF_DT from ms
    # epoch to a readable ISO date and an integer year (for UI).
    for feat in features:
        p = feat.get("properties", {}) or {}
        clean: dict = {}
        for k, v in p.items():
            if v in ("", None):
                continue
            if k == "TGA_EFF_DT":
                # Sometimes a negative int (ms since epoch); dates pre-1970 fine
                try:
                    dt = datetime.fromtimestamp(v / 1000, tz=timezone.utc)
                    clean["effective_date"] = dt.strftime("%Y-%m-%d")
                    clean["effective_year"] = dt.year
                except (ValueError, OSError, TypeError):
                    continue
            elif k == "BLM_ACRES":
                clean["blm_acres"] = round(v)
            else:
                clean[k.lower()] = v
        feat["properties"] = clean

    out = {
        "type": "FeatureCollection",
        "features": features,
        "source": (
            "Bureau of Land Management (BLM), National Taylor Grazing Act "
            "District Boundaries Polygons. Fetched from the BLM Egis ArcGIS "
            "FeatureServer. Geometry simplified to ~0.01\u00b0 for web delivery."
        ),
    }
    write_json(DATA_DIR / "grazing-districts.geojson", out)
    print(f"districts: {len(features)}")
    # Decade-of-establishment spot-check
    from collections import Counter
    years = Counter((f["properties"].get("effective_year", 0) // 10) * 10
                    for f in features if "effective_year" in f["properties"])
    for d, n in sorted(years.items()):
        print(f"  {d}s: {n} districts")


if __name__ == "__main__":
    main()
