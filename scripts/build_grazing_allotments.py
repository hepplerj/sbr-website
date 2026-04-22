#!/usr/bin/env python3
"""Build per-state ``static/data/grazing-allotments-<state>.geojson`` files.

The fine-grained BLM allotment network — each state becomes its own
file so the site can offer a state-selector dropdown without shipping
a 21,700-polygon national blob.

Source: BLM National Grazing Allotment Polygons FeatureServer.
Free, no API key.

Run: ``python scripts/build_grazing_allotments.py``
"""

from __future__ import annotations

import json
import urllib.parse

from _common import DATA_DIR, fetch, write_json

BASE = (
    "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/"
    "BLM_Natl_Grazing_Allotment_Polygons/FeatureServer/1/query"
)
# States with BLM grazing allotments (Taylor Grazing Act geography).
# Counts as of 2026-04 probe: AZ 920, CA 694, CO 2406, ID 2073, MT 5697,
# NV 759, NM 2257, OR 1921, UT 1414, WY 3564. ~21,700 total.
STATES = ["AZ", "CA", "CO", "ID", "MT", "NV", "NM", "OR", "UT", "WY"]

PAGE_SIZE = 2000
SIMPLIFICATION = "0.002"


def fetch_page(state: str, offset: int) -> dict:
    params = {
        "where": f"ADMIN_ST='{state}'",
        "outFields": "ALLOT_NAME,ALLOT_NO,ADMIN_ST,ADM_OFC_CD,ADM_UNIT_CD,GIS_ACRES",
        "outSR": "4326",
        "maxAllowableOffset": SIMPLIFICATION,
        "f": "geojson",
        "resultOffset": str(offset),
        "resultRecordCount": str(PAGE_SIZE),
    }
    qs = urllib.parse.urlencode(params)
    body = fetch(f"{BASE}?{qs}")
    return json.loads(body)


def fetch_state(state: str) -> list:
    features: list = []
    offset = 0
    while True:
        fc = fetch_page(state, offset)
        feats = fc.get("features", []) or []
        if not feats:
            break
        features.extend(feats)
        if len(feats) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return features


def normalize(feats: list) -> list:
    for feat in feats:
        p = feat.get("properties", {}) or {}
        clean: dict = {}
        for k, v in p.items():
            if v in ("", None):
                continue
            if k == "GIS_ACRES":
                clean["acres"] = round(v)
            else:
                clean[k.lower()] = v
        feat["properties"] = clean
    return feats


def main() -> None:
    totals: dict[str, int] = {}
    for state in STATES:
        feats = normalize(fetch_state(state))
        out = {
            "type": "FeatureCollection",
            "features": feats,
            "source": (
                f"BLM National Grazing Allotment Polygons, filtered to "
                f"ADMIN_ST='{state}'. Fetched from the BLM Egis ArcGIS "
                f"FeatureServer. Geometry simplified to ~{SIMPLIFICATION}\u00b0 "
                f"for web delivery."
            ),
        }
        path = DATA_DIR / f"grazing-allotments-{state.lower()}.geojson"
        write_json(path, out)
        totals[state] = len(feats)
        print(f"  {state}: {len(feats)} allotments")

    # Also emit a small manifest the frontend can load to build the
    # dropdown without hard-coding the state list.
    manifest = {
        "states": [
            {"code": s, "count": totals[s]} for s in STATES
        ],
    }
    write_json(DATA_DIR / "grazing-allotments-manifest.json", manifest)
    print(f"total: {sum(totals.values())} allotments across {len(STATES)} states")


if __name__ == "__main__":
    main()
