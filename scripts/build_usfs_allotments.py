#!/usr/bin/env python3
"""Build ``static/data/usfs-allotments.geojson``.

National Forest System range allotments — the USDA Forest Service
counterpart to the BLM grazing districts. Roughly 8,400 allotments
administered under Granger-Thye (1950) and subsequent authority,
covering ~100 million acres of federal range outside the BLM estate.

Source: USFS Enterprise Data Warehouse, ``EDW_RangeManagement_01``
MapServer layer 0 (Range_Allotment). Free, no API key.

Geometry simplified (maxAllowableOffset ~0.003°) for web delivery.
Paginated because the service caps results at 2000 per query.

Run: ``python scripts/build_usfs_allotments.py``
"""

from __future__ import annotations

import json

from _common import DATA_DIR, fetch, write_json

BASE = (
    "https://apps.fs.usda.gov/arcx/rest/services/EDW/"
    "EDW_RangeManagement_01/MapServer/0/query"
)
OUT_FIELDS = (
    "ALLOT_NAME,ADMIN_ORG_NAME,ALLOT_STATUS,"
    "CATTLE,SHEEP,GOATS,HORSES,BISON,"
    "GIS_ACRES,NEPA_DEC_APPROVED_FY"
)
PAGE_SIZE = 2000


def fetch_page(offset: int) -> dict:
    params = {
        "where": "1=1",
        "outFields": OUT_FIELDS,
        "outSR": "4326",
        "maxAllowableOffset": "0.003",
        "f": "geojson",
        "resultOffset": str(offset),
        "resultRecordCount": str(PAGE_SIZE),
    }
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    body = fetch(f"{BASE}?{qs}")
    return json.loads(body)


def main() -> None:
    all_features: list = []
    offset = 0
    while True:
        fc = fetch_page(offset)
        feats = fc.get("features", []) or []
        if not feats:
            break
        all_features.extend(feats)
        print(f"  fetched {len(feats)} (offset {offset}); total {len(all_features)}")
        if len(feats) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    yesflags = ("CATTLE", "SHEEP", "GOATS", "HORSES", "BISON")
    for feat in all_features:
        p = feat.get("properties", {}) or {}
        clean: dict = {}
        for k, v in p.items():
            if v in ("", None):
                continue
            if k in yesflags:
                if str(v).strip().upper() == "YES":
                    clean[k.lower()] = True
            elif k == "GIS_ACRES":
                clean["acres"] = round(v)
            elif k == "NEPA_DEC_APPROVED_FY":
                try:
                    clean["nepa_year"] = int(v)
                except (TypeError, ValueError):
                    continue
            else:
                clean[k.lower()] = v
        # Derive a single livestock-kind label for coloring.
        kinds = [k for k in ("cattle", "sheep", "goats", "horses", "bison")
                 if clean.get(k)]
        if len(kinds) == 1:
            clean["livestock"] = kinds[0]
        elif len(kinds) > 1:
            clean["livestock"] = "multiple"
        feat["properties"] = clean

    out = {
        "type": "FeatureCollection",
        "features": all_features,
        "source": (
            "USDA Forest Service, Enterprise Data Warehouse, Range_Allotment "
            "(EDW_RangeManagement_01). Fetched from the USFS ArcGIS MapServer. "
            "Geometry simplified to ~0.02\u00b0 for web delivery."
        ),
    }
    write_json(DATA_DIR / "usfs-allotments.geojson", out)
    print(f"allotments: {len(all_features)}")

    from collections import Counter
    kinds = Counter(f["properties"].get("livestock", "(none)")
                    for f in all_features)
    for k, n in sorted(kinds.items(), key=lambda x: -x[1]):
        print(f"  {k}: {n}")
    statuses = Counter(f["properties"].get("allot_status", "(none)")
                       for f in all_features)
    for s, n in sorted(statuses.items(), key=lambda x: -x[1])[:6]:
        print(f"  status {s}: {n}")


if __name__ == "__main__":
    main()
