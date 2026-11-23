#!/usr/bin/env python3
"""Build the *private land open to public hunting* layer (exploratory).

Conservation easements keep land private *and closed*: a WPA easement or a
Ducks Unlimited easement buys the right to stop drainage or plowing, not a
right of entry. Public access to private land comes through a different
instrument — the state walk-in lease, often paid for since 2008 by USDA's
Voluntary Public Access and Habitat Incentive Program (VPA-HIP). This script
pulls the two largest Plains programs:

  ND PLOTS  — Private Land Open To Sportsmen (ND Game & Fish, since 1997).
              Some units are co-funded by NGOs and say so in ``Unit_Name``
              ("PLOTS - Ducks Unlimited", "PLOTS - Mule Deer Foundation").
  KS WIHA   — Walk-In Hunting Access (KDWP, since 1995).

Sources (ArcGIS REST, no key required):
  https://services1.arcgis.com/GOcSXpzwBHyk2nog/ArcGIS/rest/services/NDGISHUB_PLOTS_Lands/FeatureServer/0
  https://services1.arcgis.com/q2CglofYX6ACNEeu/arcgis/rest/services/24_25_7_29/FeatureServer/0
    (despite the service name, KDWP's web map titles this "2026-2027 WIHA
    Access"; KDWP leaves each season's layer up as its own service, so prior
    seasons back to 2018 are recoverable — see the services directory.)

Both are *leases*: enrollment turns over yearly, so this is one season's
snapshot, not a stock of land. ND redistribution requests go to ND Game &
Fish (701-328-6369) — clear that before publishing.

Acreage: ND's ``Total_Acres`` is the whole agreement's figure, repeated on
every polygon the agreement spans; summing it double counts (~2.0M vs
~0.94M). Per-polygon ``Acres`` is used instead.

Output: static/data/hunting-access.json  GeoJSON polygons, EPSG:4326, wound
for D3 by build_federal_interests.rewind().

Run: ``/usr/bin/python3 scripts/build_hunting_access.py``
"""

from __future__ import annotations

import sys
import time

from _common import DATA_DIR, write_json
from build_federal_interests import query, rewind

ND_URL = (
    "https://services1.arcgis.com/GOcSXpzwBHyk2nog/ArcGIS/rest/services/"
    "NDGISHUB_PLOTS_Lands/FeatureServer/0/query"
)
KS_URL = (
    "https://services1.arcgis.com/q2CglofYX6ACNEeu/arcgis/rest/services/"
    "24_25_7_29/FeatureServer/0/query"
)
PAGE = 2000

# ND Unit_Type: the habitat program the access agreement rides on.
ND_TYPES = {
    "WLP": "Working Lands",
    "CRP": "CRP access",
    "CREP": "CREP access",
    "CREP II": "CREP access",
    "WRP": "WRP access",
    "HAB": "Habitat",
    "HAB-LT": "Habitat (long-term)",
}

# KS LEGENDID is a season code: start (S = Sept. 1, N = Nov. 1), end
# (J = Jan. 31, MR = Mar. 31, MY = May 31), AM = Apr. 1–May 31 spring
# window, ASO = archery only. Decoded against the 2018 layer's ACCESS field.
KS_START = {"S": "Sept. 1", "N": "Nov. 1"}
KS_END = {"J": "Jan. 31", "MR": "Mar. 31", "MY": "May 31"}


def ks_season(code: str) -> str:
    code = (code or "").upper()
    archery = "ASO" in code
    spring = code.endswith("AM")
    core = code.replace("ASO", "").removesuffix("AM")
    parts = []
    if core[:1] in KS_START and core[1:] in KS_END:
        parts.append(f"{KS_START[core[:1]]}–{KS_END[core[1:]]}")
    if spring:
        parts.append("Apr. 1–May 31")
    s = " / ".join(parts) or code
    return s + (" · archery only" if archery else "")


def fetch(url: str, fields: str, label: str) -> list:
    """All features as GeoJSON, generalized for national/regional display."""
    feats, offset = [], 0
    while True:
        page = query(url, {
            "where": "1=1",
            "outFields": fields,
            "returnGeometry": "true",
            "outSR": "4326",
            # ~100 m: a quarter-section (800 m on a side) keeps its shape.
            "maxAllowableOffset": "0.001",
            "geometryPrecision": "4",
            "orderByFields": "OBJECTID" if "ObjectID" in fields else "FID",
            "resultOffset": offset,
            "resultRecordCount": PAGE,
            "f": "geojson",
        }).get("features", [])
        feats += page
        offset += len(page)
        print(f"  {label}: {offset:,}", file=sys.stderr)
        if len(page) < PAGE:
            return feats


def build() -> dict:
    out, totals = [], {}

    def keep(f, props, acres, state):
        if not rewind(f.get("geometry")):
            return
        f["properties"] = props
        out.append(f)
        t = totals.setdefault(state, {"areas": 0, "acres": 0.0})
        t["areas"] += 1
        t["acres"] += acres

    for f in fetch(ND_URL, "ObjectID,Unit_Type,Unit_Name,County_Name,Acres,EndDate", "ND PLOTS"):
        p = f.get("properties") or {}
        acres = p.get("Acres") or 0.0
        partner = (p.get("Unit_Name") or "").partition(" - ")[2]
        kind = ND_TYPES.get(p.get("Unit_Type") or "", "Other agreement")
        keep(f, {
            "name": f"PLOTS · {p.get('County_Name') or ''} County",
            "kind": kind + (f" · with {partner}" if partner else ""),
            "partner": partner or None,
            "state": "ND",
            "acres": round(acres),
            "ends": (p.get("EndDate") or "")[:4] or None,
        }, acres, "ND")

    for f in fetch(KS_URL, "FID,ACRES,COUNTY,LEGENDID", "KS WIHA"):
        p = f.get("properties") or {}
        acres = p.get("ACRES") or 0.0
        keep(f, {
            "name": f"WIHA · {p.get('COUNTY') or ''} County",
            "kind": ks_season(p.get("LEGENDID")),
            "partner": None,
            "state": "KS",
            "acres": round(acres),
            "ends": None,
        }, acres, "KS")

    for k, t in totals.items():
        print(f"  {k}: {t['areas']:,} areas, {t['acres']:,.0f} acres", file=sys.stderr)
    return {
        "type": "FeatureCollection",
        "source": "ND Game & Fish PLOTS Lands; KDWP Walk-In Hunting Access (2026–27)",
        "retrieved": time.strftime("%Y-%m-%d", time.gmtime()),
        "note": (
            "Private land leased by the state for public walk-in hunting. "
            "Annual agreements: one season's snapshot."
        ),
        "totals": {k: {"areas": t["areas"], "acres": round(t["acres"])} for k, t in totals.items()},
        "features": out,
    }


if __name__ == "__main__":
    assert ks_season("SJ") == "Sept. 1–Jan. 31"
    assert ks_season("NJASOAM") == "Nov. 1–Jan. 31 / Apr. 1–May 31 · archery only"
    assert ks_season("AM") == "Apr. 1–May 31"
    write_json(DATA_DIR / "hunting-access.json", build())
